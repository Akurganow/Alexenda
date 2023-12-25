import { combineReducers } from 'redux'
import { configureStore } from '@reduxjs/toolkit'
import { persistReducer, MigrationManifest, createMigrate, persistStore, type Storage } from 'redux-persist'
import storage from 'redux-persist-indexeddb-storage'
import { initialState as tasksInitialState, storeKey as tasksStoreKey } from 'store/constants/tasks'
import { initialState as settingsInitialState, storeKey as settingsStoreKey } from 'store/constants/settings'
import { initialState as tagsInitialState, storeKey as tagsStoreKey } from 'store/constants/tags'
import { initialState as dialogsInitialState, storeKey as dialogsStoreKey } from 'store/constants/dialogs'
import tasksReducer from 'store/reducers/tasks'
import settingsReducer from 'store/reducers/settings'
import tagsReducer from 'store/reducers/tags'
import dialogsReducer from 'store/reducers/dialogs'
import tasksMigrations, { version as tasksVersion } from 'store/migrations/tasks'
import tagsMigrations, { version as tagsVersion } from 'store/migrations/tags'
import settingsMigrations from 'store/migrations/settings'
import { isServer } from 'lib/is'
import { createNoopStorage } from 'lib/storage'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import syncer from 'store/syncer.config'

export const PERSIST_STORAGE_DB_NAME = 'nanoits'

function createPersistConfig(key: string, storage: Storage, migrations?: MigrationManifest, version: number = 1) {
	return {
		key: `nanoits/${key}`,
		version,
		storage,
		migrate: migrations ? createMigrate(migrations) : undefined,
	}
}

interface ConfigureReducerParams {
	storeKey: string,
	storage: Storage,
	reducer: (initialState: Record<string, unknown>) => ReturnType<typeof combineReducers>,
	initialState: Record<string, unknown>,
	migrations?: MigrationManifest,
	version?: number,
}

function configureReducer({
	storeKey,
	storage,
	migrations,
	version,
	reducer,
	initialState,
}: ConfigureReducerParams) {
	if (isServer()) {
		return {
			[storeKey]: reducer(initialState)
		}
	}

	return {
		[storeKey]: persistReducer(
			createPersistConfig(storeKey, storage, migrations, version),
			reducer(initialState),
		)
	}
}

export const serverStorage = createNoopStorage()
export const clientStorage = storage(PERSIST_STORAGE_DB_NAME)
export const webStorage = isServer() ? serverStorage : clientStorage

export const reducer = {
	...configureReducer({
		storeKey: tasksStoreKey,
		storage: webStorage,
		reducer: tasksReducer,
		initialState: tasksInitialState,
		migrations: tasksMigrations,
		version: tasksVersion,
	}),
	...configureReducer({
		storeKey: settingsStoreKey,
		storage: webStorage,
		migrations: settingsMigrations,
		reducer: settingsReducer,
		initialState: settingsInitialState,
	}),
	...configureReducer({
		storeKey: tagsStoreKey,
		storage: webStorage,
		migrations: tagsMigrations,
		reducer: tagsReducer,
		initialState: tagsInitialState,
		version: tagsVersion,
	}),
	[dialogsStoreKey]: dialogsReducer(dialogsInitialState),
}

export type RootState = {
	[K in keyof typeof reducer]: ReturnType<typeof reducer[K]>
}

export const makeStore = () => configureStore({
	reducer,
	devTools: process.env.NODE_ENV !== 'production',
	middleware: gDM => gDM({
		serializableCheck: false,
	}).concat(syncer.createReduxMiddleware()),
})

export const getPersistedStore = () => {
	const store = makeStore()
	const persistor = persistStore(store)

	return { store, persistor }
}

export type AppStore = ReturnType<typeof makeStore>
export type AppDispatch = AppStore['dispatch']

type DispatchFunc = () => AppDispatch
export const useAppDispatch: DispatchFunc = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector