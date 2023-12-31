'use client'
import { HTMLAttributes, useCallback, useEffect, useMemo, useState } from 'react'
import cn from 'classnames'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Button, message, Typography } from 'antd'
import ContentfulImage from 'components/ContentfulImage'
import { openDialog } from 'store/actions/dialogs'
import { setNewTask } from 'store/actions/tasks'
import { getHint, Hint } from './server'
import st from './styles.module.css'

const imageSize = 300

export default function EmptyHints({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
	const dispatch = useDispatch()
	const { i18n } = useTranslation()
	const [messageApi] = message.useMessage()
	const locale = useMemo(() => i18n.resolvedLanguage || i18n.language, [i18n.language, i18n.resolvedLanguage])
	const [hint, setHint] = useState<Hint>()

	const handleButtonClick = useCallback(() => {
		if (hint) {
			dispatch(setNewTask(hint.fields))
			dispatch(openDialog('new-task'))
		} else {
			messageApi.error('Hint is not loaded')
		}
	}, [dispatch, hint, messageApi])

	const getRandomHint = useCallback(async () => {
		try {
			const hint = await getHint({ locale })

			setHint(hint)
		} catch (error) {
			console.error(error)
		}
	}, [locale])

	useEffect(() => {
		getRandomHint()
	}, [getRandomHint])

	return hint ? <div {...props} className={cn(className, st.container)}>
		<style>{`:root { --empty-hint-image-width: {${imageSize}px}`}</style>
		<div className={st.empty}>
			<ContentfulImage
				preview={false}
				src={hint.image}
				alt={hint.imageAlt}
				width={imageSize}
				height={imageSize}
				className={st.image}
			/>

			<Typography.Text className={st.text} >
				<span dangerouslySetInnerHTML={{ __html: hint.text }} />
			</Typography.Text>

			<Button type="primary" onClick={handleButtonClick} className={st.button}>
				{hint.button}
			</Button>
		</div>
	</div> : null
}