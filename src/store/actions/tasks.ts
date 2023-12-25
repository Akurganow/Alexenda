import { storeKey } from 'store/constants/tasks'
import { actionCreatorFactory, thunkCreatorFactory } from 'store/helpers/actions'
import { performClientDiff } from 'lib/tasks/server'
import { createLogStorage } from 'lib/syncLog/storages'
import syncer from 'store/syncer.config'
import type { CheckListItem, NewTaskValues, Task, TaskDiff, TasksState } from 'types/tasks'
import type { RootState } from 'store/types'
import type { SyncPayload } from 'lib/syncLog/types'
import type { PartialWithId } from 'types/common'

const createAction = actionCreatorFactory(storeKey)
const createThunk = thunkCreatorFactory(storeKey)

export const setNewTask = createAction<NewTaskValues | null>('SET_NEW_TASK')
export const addTask = createAction<Task>('ADD_TASK')
export const removeTask = createAction<Task['id']>('REMOVE_TASK')
export const updateTask = createAction<PartialWithId<Task>>('UPDATE_TASK')
export const updateChecklistItem = createAction<{ taskId: Task['id'], item: CheckListItem }>('UPDATE_CHECKLIST_ITEM')
export const addChecklistItem = createAction<Task['id']>('ADD_CHECKLIST_ITEM')
export const removeChecklistItem = createAction<{ taskId: Task['id'], itemId: CheckListItem['id'] }>('REMOVE_CHECKLIST_ITEM')
export const importTasks = createAction<Task[]>('IMPORT_TASKS')
export const setIsTasksSyncing = createAction<boolean>('SET_IS_SYNCING')
export const initialSyncTasksWithServer = createThunk(
	'INITIAL_SYNC_WITH_SERVER',
	(_, api) => {
		const state = api.getState() as RootState
		return syncer.initialSync(state, 'task')
	}
)
export const syncTasksWithServer = createThunk<
	{ diff?: TaskDiff, lastServerUpdate?: Date } | undefined
>(
	'SYNC_WITH_SERVER',
	(_, api) => {
		const state = api.getState() as RootState
		return syncer.sync(state, 'task')
	},
)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function initialSync(state: TasksState): Promise<{ diff?: TaskDiff, lastServerUpdate?: Date }> {
	const lastServerUpdate = state.lastServerUpdate ? new Date(state.lastServerUpdate) : undefined

	try {
		const response = await fetch('/api/sync/tasks', {
			method: 'POST',
			next: { revalidate: 360 },
			body: JSON.stringify({
				tasks: state.items,
				lastServerUpdate: lastServerUpdate || new Date(0)
			}),
			headers: {
				'Content-Type': 'application/json',
			}
		})

		return await response.json()
	} catch (error) {
		console.error('startSync:performServerDiff:error', error)
	}

	return {}
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function startSync(state: TasksState): Promise<{ diff?: TaskDiff, lastServerUpdate?: Date }> {
	const lastServerUpdate = state.lastServerUpdate ? new Date(state.lastServerUpdate) : undefined

	const clientDiff: TaskDiff = {
		create: [],
		update: [],
		delete: [],
	}
	let serverDiff: TaskDiff = {
		create: [],
		update: [],
		delete: [],
	}

	const tasksSyncLogger = createLogStorage('tasks')
	const tasksLog = (await Promise.all(
		(await tasksSyncLogger.keys())
			.map(key => tasksSyncLogger.getItem<SyncPayload<Task>>(key))
	)).filter(Boolean) as SyncPayload<Task>[]

	for (const log of tasksLog) {
		if (log.created) {
			clientDiff.create!.push(log.created)
		}
		if (log.updated) {
			const updateId = log.updated.id
			const existedUpdate = clientDiff.update!.find(task => task.id === updateId)

			if (existedUpdate) {
				Object.assign(existedUpdate, log.updated)
			} else {
				clientDiff.update!.push(log.updated)
			}
		}
		if (log.deleted) {
			clientDiff.delete!.push(log.deleted)
		}
	}

	let newServerUpdate = lastServerUpdate

	try {
		const result = await performClientDiff(clientDiff, lastServerUpdate || new Date(0))

		if (result) {
			serverDiff = result.diff
			newServerUpdate = result.lastServerUpdate

			await tasksSyncLogger.clear()
		}
	} catch (error) {
		console.error('Task:startSync:performServerDiff:error', error)
	}

	return {
		diff: serverDiff,
		lastServerUpdate: newServerUpdate,
	}
}