import { storeKey } from 'store/constants/tags'
import { actionCreatorFactory, thunkCreatorFactory } from 'store/helpers/actions'
import { performClientDiff } from 'lib/tags/server'
import { createLogStorage } from 'lib/syncLog/storages'
import syncer from 'store/syncer.config'
import { Tag, TagDiff, TagsState } from 'types/tags'
import { RootState } from 'store/types'
import { SyncPayload } from 'lib/syncLog/types'

const createAction = actionCreatorFactory(storeKey)
const createThunk = thunkCreatorFactory(storeKey)

export const addTag = createAction<Tag>('ADD_TAG')
export const editTag = createAction<Tag>('EDIT_TAG')
export const removeTag = createAction<string>('REMOVE_TAG')
export const initialSyncTagsWithServer = createThunk(
	'INITIAL_SYNC_WITH_SERVER',
	(_, api) => {
		const state = api.getState() as RootState
		return syncer.initialSync(state, 'tag')
	},
)
export const syncTagsWithServer = createThunk(
	'SYNC_WITH_SERVER',
	(_, api) => {
		const state = api.getState() as RootState
		return syncer.sync(state, 'tag')
	},
)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function initialSync(state: TagsState) {
	try {
		const response = await fetch('/api/sync/tags', {
			method: 'POST',
			next: { revalidate: 360 },
			body: JSON.stringify({
				tags: state.items,
				lastServerUpdate: state.lastServerUpdate || new Date(0)
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
async function startSync(state: TagsState) {
	const lastServerUpdate = state.lastServerUpdate ? new Date(state.lastServerUpdate) : undefined

	const clientDiff: TagDiff = {
		create: [],
		update: [],
		delete: [],
	}
	let serverDiff: TagDiff = {
		create: [],
		update: [],
		delete: [],
	}

	const tagsSyncLogger = createLogStorage('tags')
	const tagsLog = (await Promise.all(
		(await tagsSyncLogger.keys())
			.map(key => tagsSyncLogger.getItem(key))
	)).filter(Boolean) as SyncPayload<Tag>[]

	for (const log of tagsLog) {
		if (log.created) {
			clientDiff.create!.push(log.created)
		}
		if (log.updated) {
			const updateId = log.updated.id
			const existingUpdate = clientDiff.update!.find(update => update.id === updateId)

			if (existingUpdate) {
				Object.assign(existingUpdate, log.updated)
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
			serverDiff = result.diff || serverDiff
			newServerUpdate = result.lastServerUpdate

			await tagsSyncLogger.clear()
		}
	} catch (error) {
		console.error('Tag:startSync:performClientDiff:error', error)
	}

	return {
		diff: serverDiff,
		lastServerUpdate: newServerUpdate
	}
}