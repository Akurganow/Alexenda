import syncer from 'store/syncer.config'
import { addTag, editTag, removeTag } from 'store/actions/tags'

syncer
	.addCase(addTag, payload => ({
		tag: {
			diff: {
				create: [payload]
			}
		}
	}))
	.addCase(editTag, payload => ({
		tag: {
			diff: {
				update: [payload]
			}
		}
	}))
	.addCase(removeTag, payload => ({
		tag: {
			diff: {
				delete: [payload]
			}
		}
	}))