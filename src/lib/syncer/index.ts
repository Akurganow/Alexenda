import localForage from 'localforage'
import { Dispatch, isAction, Middleware, UnknownAction } from 'redux'
import { ActionCreatorWithPayload } from '@reduxjs/toolkit'
import { Diff } from 'types/common'
import { ModelName, SyncConfig, SyncPayload, SyncPayloadScope, UnknownPayload } from 'lib/syncer/types'
import { performClientDiff } from 'lib/syncer/server'
import { publicPath } from 'lib/syncer/constants'

export class Syncer<S extends object> {
	private logStorage: LocalForage
	private config: SyncConfig<UnknownPayload>
	private ignoredActions: string[] = []
    
	constructor(storeName: string, version: number = 1) {
		this.logStorage = localForage.createInstance({
			name: 'syncerLog',
			storeName,
			version
		})
	}

	private isActionIgnored(action: UnknownAction) {
		return isAction(action) && !this.ignoredActions.some(ignoredAction =>
			action.type.includes(ignoredAction)
		)
	}

	public addIgnoredActions(actions: (string | UnknownAction)[]) {
		this.ignoredActions = this.ignoredActions.concat(actions.map(action => isAction(action) ? action.type : action))
		return this
	}

	public addCase<A extends ActionCreatorWithPayload<unknown>>(action: A, handler: (payload: ReturnType<A>['payload'], state: S) => SyncPayloadScope<UnknownPayload>) {
		if (isAction(action)) {
			this.config[action.type] = handler
		}

		return this
	}

	public async clearLog() {
		await this.logStorage.clear()
	}

	public async sync(state: S, scopeName: ModelName) {
		const scopeState = state[scopeName] || state[scopeName + 's']

		if (!scopeState || !scopeState.items) return {}

		const clientDiff: Diff<UnknownPayload> = {
			create: [],
			update: [],
			delete: [],
		}

		const log = await this.getScopeLog(scopeName)

		for (const logItem of log) {
			if (logItem?.diff) {
				const { create, update, delete: deleted } = logItem.diff
				const ids = [...(create || []), ...(update || [])].map(item => item.id).filter(Boolean) as string[]
				const existingItems = scopeState.items.filter((item: { id: string }) => ids.includes(item.id))
				const createdUpdated = [...(create || []), ...(update || [])]
				const created = createdUpdated.filter(item => existingItems.includes(item))
				const updated = createdUpdated.filter(item => !existingItems.includes(item))

				if (created.length > 0) {
					clientDiff.create!.push(...created)
				}
				if (updated.length > 0) {
					clientDiff.update!.push(...updated)
				}
				if (deleted) {
					clientDiff.delete!.push(...deleted)
				}
			}
		}

		const clientDiffPayload = {
			diff: clientDiff,
			lastServerUpdate: scopeState.lastServerUpdate || new Date(0),
		}

		const serverDiff = await performClientDiff(scopeName, clientDiffPayload)
		await this.clearLog()

		return serverDiff
	}

	public async initialSync(state: S, scopeName: ModelName) {
		const scopeState = state[scopeName] || state[scopeName + 's']

		if (!scopeState || !scopeState.items) return

		try {
			const response = await fetch(publicPath, {
				method: 'POST',
				next: { revalidate: 360 },
				body: JSON.stringify({
					scopeName,
					items: scopeState.items,
					lastServerUpdate: scopeState.lastServerUpdate || new Date(0)
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

	public createReduxMiddleware(): Middleware {
		return (storeApi) => (next: Dispatch) => (action: UnknownAction) => {
			if (this.isActionIgnored(action)) {
				const state = storeApi.getState() as S
				const handler = this.config[action.type]

				if (handler) {
					const payload = handler(action, state)

					if (payload) {
						this.logStorage.setItem(action.type, payload)
					}
				}
			}

			return next(action)
		}
	}

	private async getScopeLog(scopeName: string) {
		const log = await this.logStorage.keys()

		return await Promise.all(log
			.filter(key => key.startsWith(scopeName))
			.map(async (key) => {
				return await this.logStorage.getItem<SyncPayload<UnknownPayload>>(key)
			}))
	}
}