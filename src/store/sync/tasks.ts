import syncer from 'store/syncer.config'
import {
	addChecklistItem,
	addTask,
	importTasks,
	removeChecklistItem,
	removeTask,
	updateChecklistItem,
	updateTask
} from 'store/actions/tasks'

syncer
	.addCase(addTask, payload => ({
		task: {
			diff: {
				create: [payload]
			}
		}
	}))
	.addCase(updateTask, payload => ({
		task: {
			diff: {
				update: [payload]
			}
		}
	}))
	.addCase(removeTask, payload => ({
		task: {
			diff: {
				delete: [payload]
			}
		}
	}))
	.addCase(addChecklistItem, (payload, state) => {
		const task = state.tasks.items.find(task => task.id === payload)

		if (task) {
			const updatedTask = {
				...task,
				checklist: [...(task.checklist || []), {
					id: (task.checklist || []).length,
					title: '',
					completed: false
				}]
			}
            
			return {
				task: {
					diff: {
						update: [updatedTask]
					}
				}
			}
		}

		return {}
	})
	.addCase(updateChecklistItem, (payload, state) => {
		const task = state.tasks.items.find(task => task.id === payload.taskId)

		if (task) {
			const updatedTask = {
				...task,
				checklist: (task.checklist || []).map(item => item.id === payload.item.id ? payload.item : item)
			}

			return {
				task: {
					diff: {
						update: [updatedTask]
					}
				}
			}
		}

		return {}
	})
	.addCase(removeChecklistItem, (payload, state) => {
		const task = state.tasks.items.find(task => task.id === payload.taskId)

		if (task) {
			const updatedTask = {
				...task,
				checklist: (task.checklist || []).filter(item => item.id !== payload.itemId)
			}

			return {
				task: {
					diff: {
						update: [updatedTask]
					}
				}
			}
		}

		return {}
	})
	.addCase(importTasks, payload => ({
		task: {
			diff: {
				create: payload
			}
		}
	}))