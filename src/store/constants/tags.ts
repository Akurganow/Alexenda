import { Tag, TagsState } from 'types/tags'
import { blue, gold, green, grey, orange, red, yellow } from '@ant-design/colors'
import i18n from 'src/i18n'

export const storeKey = 'tags'

export const initialState: TagsState = {
	items: []
}
export const TAGS_MODAL_NAME = 'tags'
export const INITIAL_TAG_FORM: Omit<Tag, 'id'> = {
	name: '',
	color: grey.primary as string,
	showStats: false,
	createdAt: Date.now(),
	updatedAt: Date.now(),
}

export const COLOR_PRESETS = [
	{
		label: i18n.t('tags.presets.recommended'),
		colors: [
			...grey,
			...red,
			...orange,
			...gold,
			...yellow,
			...green,
			...blue,
		]
	}
]