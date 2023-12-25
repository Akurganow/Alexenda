import { Task, TaskDiff, TasksState } from 'types/tasks'
import {
	addChecklistItem,
	addTask,
	importTasks, initialSyncTasksWithServer,
	removeChecklistItem,
	removeTask, setIsTasksSyncing, setNewTask, syncTasksWithServer,
	updateChecklistItem,
	updateTask
} from 'store/actions/tasks'
import { createReducer } from '@reduxjs/toolkit'
import { isEmpty } from '@plq/is'
import { WritableDraft } from 'immer/src/types/types-external'

const tasksReducer = (initialState: TasksState) => createReducer(initialState, builder =>
	builder
		.addCase(setNewTask, (state, action) => {
			state.newTask = action.payload
		})
		.addCase(addTask, (state, action) => {
			const highestCount = state.items.reduce((acc, task) => Math.max(acc, task.count), 0)

			state.items.push({
				...action.payload,
				count: highestCount + 1,
			})
		})
		.addCase(removeTask, (state, action) => {
			state.items = state.items.filter(task => task.id !== action.payload)
		})
		.addCase(updateTask, (state, action) => {
			const task = state.items.find(task => task.id === action.payload.id)

			if (task) {
				Object.assign(task, action.payload)
			}
		})
		.addCase(updateChecklistItem, (state, action) => {
			const task = state.items.find(task => task.id === action.payload.taskId)

			if (task) {
				task.checklist = (task.checklist || []).map(item => item.id === action.payload.item.id ? action.payload.item : item)
			}
		})
		.addCase(addChecklistItem, (state, action) => {
			const task = state.items.find(task => task.id === action.payload)

			if (task) {
				task.checklist = [...(task.checklist || []), {
					id: (task.checklist || []).length,
					title: '',
					completed: false
				}]
			}
		})
		.addCase(removeChecklistItem, (state, action) => {
			const task = state.items.find(task => task.id === action.payload.taskId)

			if (task) {
				task.checklist = (task.checklist || []).filter(item => item.id !== action.payload.itemId)
			}
		})
		.addCase(importTasks, (state, action) => {
			state.items = [
				...state.items.filter(task => !action.payload.find(t => t.id === task.id)),
				...action.payload,
			]
		})
		.addCase(setIsTasksSyncing, (state, action) => {
			state.isSyncing = action.payload
		})
		.addCase(initialSyncTasksWithServer.pending, (state) => {
			state.isSyncing = true
		})
		.addCase(initialSyncTasksWithServer.rejected, (state) => {
			state.isSyncing = false
		})
		.addCase(initialSyncTasksWithServer.fulfilled, performTasksSync)
		.addCase(syncTasksWithServer.pending, (state) => {
			state.isSyncing = true
		})
		.addCase(syncTasksWithServer.rejected, (state) => {
			state.isSyncing = false
		})
		.addCase(syncTasksWithServer.fulfilled, performTasksSync)
)
export default tasksReducer

function performTasksSync(state: WritableDraft<TasksState>, { payload }: { payload?: { diff?: TaskDiff, lastServerUpdate?: Date } }) {
	state.isSyncing = false

	if (!payload || isEmpty(payload)) return

	const { diff, lastServerUpdate } = payload

	if (diff?.create && diff.create.length > 0) {
		const tasksMap = new Map(state.items.map(task => [task.id, task]))

		for (const task of diff.create) {
			tasksMap.set(task.id, task)
		}

		state.items = Array.from(tasksMap.values())
	}

	for (const task of (diff?.update || [])) {
		state.items = state.items
			.map(t =>
				t.id === task.id
					? { ...t, ...task } as Task
					: t
			)
	}

	if (diff?.delete && diff.delete.length > 0) {
		state.items = state.items.filter(task => !diff.delete!.includes(task.id))
	}

	state.lastServerUpdate = lastServerUpdate?.toString()
}
