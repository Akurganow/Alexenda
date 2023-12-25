import { MigrationManifest } from 'redux-persist'
import { TagsState } from 'types/tags'
import { PersistPartial } from 'store/types'

const tags: MigrationManifest = {
	1: (state: PersistPartial<TagsState>) => ({
		...state,
		items: (state as unknown as { tags: TagsState['items'] }).tags,
	}),
}

export const version = 1

export default tags