import {
	addChecklistItem,
	addTask, importTasks,
	removeChecklistItem,
	removeTask,
	updateChecklistItem,
	updateTask
} from 'store/actions/tasks'
import { createSyncConfig } from 'lib/syncLog/createSyncConfig'
import type { Task } from 'types/tasks'
import type { SyncPayload } from 'lib/syncLog/types'

const config = createSyncConfig<Task>(builder => builder
	.case(addTask, ({ payload }) => ({
		created: payload
	}))
	.case(updateTask, ({ payload }) => ({
		updated: payload
	}))
	.case(removeTask, ({ payload }) => ({
		deleted: payload
	}))
	.case(addChecklistItem, ({ payload }, state) => {
		const task = state.tasks.items.find(task => task.id === payload)

		if (task) {
			return {
				updated: {
					...task,
					checklist: [...(task.checklist || []), {
						id: (task.checklist || []).length,
						title: '',
						completed: false
					}]
				}
			}
		}

		return {}
	})
	.case(updateChecklistItem, ({ payload }, state) => {
		const task = state.tasks.items.find(task => task.id === payload.taskId)

		if (task) {
			return {
				updated: {
					...task,
					checklist: (task.checklist || []).map(item => item.id === payload.item.id ? payload.item : item)
				}
			}
		}

		return {}
	})
	.case(removeChecklistItem, ({ payload }, state) => {
		const task = state.tasks.items.find(task => task.id === payload.taskId)

		if (task) {
			return {
				updated: {
					...task,
					checklist: (task.checklist || []).filter(item => item.id !== payload.itemId)
				}
			}
		}

		return {}
	})
	.case(importTasks, ({ payload }) => {
		const tasks = payload as Partial<Task>[]

		return tasks.map(task => ({
			created: task
		} as SyncPayload<Task>))
	})
)

export default config