'use client'
import { Form, Input, message, Modal, Switch } from 'antd'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { selectedDialog } from 'store/selectors/dialogs'
import { useCallback, useEffect } from 'react'
import { closeDialog } from 'store/actions/dialogs'
import { setOpenAIUserId, setSettings } from 'store/actions/settings'
import { selectedOpenAI, selectedSettings } from 'store/selectors/settings'
import FeatureFlag from 'components/FeatureFlag'
import { initialSyncTasksWithServer } from 'store/actions/tasks'
import { useAppDispatch } from 'src/store'

export default function Settings() {
	const dispatch = useAppDispatch()
	const { t } = useTranslation()
	const currentSettings = useSelector(selectedSettings)
	const [messageApi, contextHolder] = message.useMessage()
	const isDialogOpened = useSelector(selectedDialog('settings'))
	const { userId } = useSelector(selectedOpenAI)
	const [form] = Form.useForm()

	form.setFieldsValue(currentSettings)

	const handleClose = useCallback(() => {
		dispatch(closeDialog('settings'))
	}, [dispatch])

	const handleFormSubmit = useCallback(async (values: typeof currentSettings) => {
		dispatch(setSettings(values))
		dispatch(closeDialog('settings'))
		messageApi.success(t('settingsSaved'))

		if (values.autoSync && !currentSettings.autoSync) {
			await dispatch(initialSyncTasksWithServer({}))
			messageApi.success(t('autoSyncEnabled'))
		}

	}, [currentSettings.autoSync, dispatch, messageApi, t])

	useEffect(() => {
		if (!userId || userId.length === 0) {
			dispatch(setOpenAIUserId())
		}
	}, [dispatch, userId])

	return <Modal
		forceRender
		title="Settings"
		style={{ minWidth: '50vw' }}
		open={isDialogOpened}
		okButtonProps={{ htmlType: 'submit', form: 'settings-form' }}
		okText={t('save')}
		onCancel={handleClose}
	>
		{contextHolder}
		<Form
			form={form}
			id="settings-form"
			onFinish={handleFormSubmit}
		>
			<FeatureFlag name="sync">
				<Form.Item
					name="autoSync"
					valuePropName="checked"
					label={t('autoSync')}
				>
					<Switch />
				</Form.Item>
			</FeatureFlag>

			<FeatureFlag name="dev">
				<Form.Item
					required
					name={['openAI', 'apiKey']}
					label={t('openAI.apiKey')}
					tooltip={<span>{t('openAI.apiKeyTooltip')} <a target="_blank" href='https://platform.openai.com/api-keys' rel="noreferrer">{t('openAI.apiKeyLink')}</a></span>}
				>
					<Input />
				</Form.Item>
			</FeatureFlag>
		</Form>
	</Modal>
}