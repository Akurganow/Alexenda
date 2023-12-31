'use client'
import { DatePicker, Form, FormProps, Input, InputNumber, Select, Switch, TimePicker } from 'antd'
import MDEditor from '@uiw/react-md-editor'
import { NewTaskValues, Task, TaskPriority } from 'types/tasks'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { selectedTags } from 'store/selectors/tasks'
import { useMemo, useState } from 'react'
import { isEmpty } from '@plq/is'
import rehypeSanitize from 'rehype-sanitize'

import frLocale from 'antd/es/date-picker/locale/fr_FR'
import esLocale from 'antd/es/date-picker/locale/es_ES'
import ruLocale from 'antd/es/date-picker/locale/ru_RU'
import enLocale from 'antd/es/date-picker/locale/en_US'

import localizedFormat from 'dayjs/plugin/localizedFormat'
import dayjs from 'dayjs'

dayjs.extend(localizedFormat)

const locales = {
	en: enLocale,
	ru: ruLocale,
	es: esLocale,
	fr: frLocale,
}

interface TaskFormProperties extends FormProps<NewTaskValues> {}

export default function TaskForm({ initialValues, name, onFinish }: TaskFormProperties) {
	const { i18n, t } = useTranslation()
	const [form] = Form.useForm<NewTaskValues>()
	const resolvedLanguage = useMemo(() => i18n.resolvedLanguage || 'en', [i18n.resolvedLanguage])
	const locale = useMemo(() => locales[resolvedLanguage], [resolvedLanguage])
	const tags = useSelector(selectedTags)
	const tagsOptions = tags.map((tag) => ({ label: tag, value: tag }))
	const [isRepeatable, setIsRepeatable] = useState(!isEmpty(initialValues?.repeatable))

	return <Form
		form={form}
		name={name}
		initialValues={initialValues}
		onFinish={onFinish}
		labelCol={{ span: 7 }}
		wrapperCol={{ span: 16 }}
		preserve={true}
	>
		<Form.Item<Task> name="title" label={t('title')} rules={[{ required: true }]}>
			<Input />
		</Form.Item>

		<Form.Item<Task> name="description" label={t('description')}>
			<MDEditor preview="edit" previewOptions={{ rehypePlugins: [[rehypeSanitize]], }} />
		</Form.Item>

		<Form.Item<Task> name="estimate" label={t('estimate')} rules={[{ required: true }]}>
			<InputNumber min={0} step={0.25} />
		</Form.Item>

		<Form.Item<Task> name="dueDate" label={t('dueDate')}>
			<DatePicker locale={locale} />
		</Form.Item>

		<Form.Item<Task> name="date" label={t('date')}>
			<DatePicker locale={locale} />
		</Form.Item>

		<Form.Item<Task> name="time" label={t('time')}>
			<TimePicker
				locale={locale}
				format="HH:mm"
				minuteStep={15}
				hideDisabledOptions={true}
				disabledTime={() => ({ disabledHours: () => [0, 1, 2, 3, 4, 5, 6, 7, 8, 22, 23] })}
			/>
		</Form.Item>

		<Form.Item<Task> label={t('repeatTask')}>
			<Switch defaultChecked={isRepeatable} onChange={setIsRepeatable} />
		</Form.Item>
		{isRepeatable && <>
			<Form.Item<Task> name={['repeatable', 'repeatEvery']} label={t('repeatEvery')}>
				<InputNumber min={1} placeholder={t('repeatEvery')} />
			</Form.Item>
			<Form.Item<Task> name={['repeatable', 'repeatType']} label={t('repeatType')}>
				<Select placeholder={t('repeatType')}>
					<Select.Option value="day">{t('repeatTypes.day')}</Select.Option>
					<Select.Option value="week">{t('repeatTypes.week')}</Select.Option>
					<Select.Option value="month">{t('repeatTypes.month')}</Select.Option>
					<Select.Option value="year">{t('repeatTypes.year')}</Select.Option>
				</Select>
			</Form.Item>
		</>}

		<Form.Item<Task> name="tags" label={t('tags')}>
			<Select mode="tags" options={tagsOptions} />
		</Form.Item>

		<Form.Item<Task> name="priority" label={t('priority')}>
			<Select>
				<Select.Option value={TaskPriority.Urgent}>{t('priorityType.urgent')}</Select.Option>
				<Select.Option value={TaskPriority.High}>{t('priorityType.high')}</Select.Option>
				<Select.Option value={TaskPriority.Normal}>{t('priorityType.normal')}</Select.Option>
				<Select.Option value={TaskPriority.Low}>{t('priorityType.low')}</Select.Option>
			</Select>
		</Form.Item>

		<Form.Item<Task> name="checklist" label={t('checkList')}>
			<Select mode="tags" />
		</Form.Item>
	</Form>
}