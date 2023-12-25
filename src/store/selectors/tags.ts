import { RootState } from '../types'
import { createSelector } from '@reduxjs/toolkit'
import { storeKey } from 'store/constants/tags'
import { selectedTags as selectedTasksTags } from 'store/selectors/tasks'
import { Tag } from 'types/tags'
import memoize from 'lodash/memoize'
import { grey } from '@ant-design/colors'
import { filterBySameKeyValue } from '@plq/array-functions'

const rawTags = (state: RootState) => state[storeKey]

export const selectedTags = createSelector(
	rawTags,
	(state) => state.items
)

export const selectedAllTags = createSelector(
	selectedTags,
	selectedTasksTags,
	(tags, tasks) => {
		const tasksTags = tasks.map((tag) => ({
			id: tag,
			name: tag,
			showStats: false,
			color: grey.primary,
		}))

		return [...tags, ...tasksTags]
			.filter((tag, index, array) =>
				filterBySameKeyValue(tag, index, array, 'id')
			) as Tag[]
	}
)

export const selectedTag = memoize((id: Tag['id']) =>
	createSelector(
		selectedTags,
		tags => {
			const tag = tags.find((tag) => tag.id === id)

			if (tag) return tag

			return null
		}
	)
)

export const selectedStatsTags = createSelector(
	selectedTags,
	(tags) => tags.filter((tag) => tag.showStats)
)