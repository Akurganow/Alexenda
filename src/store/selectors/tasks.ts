import { createSelector } from 'reselect'
import { storeKey } from '../constants/tasks'
import { RootState } from '../types'
import dayjs from 'dayjs'
import { Task, TaskStatus } from 'types/tasks'
import { WithRequired } from 'types/common'
import minMax from 'dayjs/plugin/minMax'
import { getDayTitle, splitByDays, splitByTime } from 'lib/tasks/client'
import { ListTitle } from 'components/TasksList'

dayjs.extend(minMax)

const rawSelectedTasks = (state: RootState) => state[storeKey]
export const selectedTasks = createSelector(
	rawSelectedTasks,
	(state) => state.items
)
export const selectedLastServerUpdate = createSelector(
	rawSelectedTasks,
	(state) => state.lastServerUpdate ? new Date(state.lastServerUpdate) : new Date(0)
)

export const selectedIsSyncing = createSelector(
	rawSelectedTasks,
	(state) => state.isSyncing
)

export const selectedNewTask = createSelector(
	rawSelectedTasks,
	(state) => state.newTask
)

export const selectedHighestCount = createSelector(
	selectedTasks,
	(tasks) => Math.max(...tasks.map((task) => task.count))
)

export const selectedTaskDate = (id: Task['id']) =>
	createSelector(
		selectedTasks,
		(tasks) => tasks.find((task) => task.id === id)?.date
	)

export const selectedTasksWithDate = createSelector(
	selectedTasks,
	(tasks) =>
		tasks.filter(task =>
			task.date && dayjs(task.date).isAfter(dayjs().subtract(1, 'day'), 'day')
		) as WithRequired<Task, 'date'>[]
)

export const selectedTasksWithoutDate = createSelector(
	selectedTasks,
	(tasks) => tasks
		.filter((task) => !task.date)
		.sort((a, b) => {
			if (!a.dueDate && !b.dueDate) return a.priority - b.priority
			if (!a.dueDate) return 1
			if (!b.dueDate) return -1

			const daydiff = dayjs(a.dueDate).diff(dayjs(b.dueDate))

			if (daydiff === 0) return a.priority - b.priority

			return daydiff
		})
)

export const selectedTasksDateRange = createSelector(
	selectedTasksWithDate,
	(tasks) => {
		if (tasks.length === 0) return null

		const dates = tasks.map((task) => dayjs(task.date))
		return {
			firstDate: (dayjs.min(dates) as dayjs.Dayjs).startOf('day'),
			lastDate: (dayjs.max(dates) as dayjs.Dayjs).endOf('day'),
		}
	}
)

export const selectedTasksWithRepeatable = createSelector(
	selectedTasksWithDate,
	selectedTasksDateRange,
	(tasks, datesRange) => {
		if (tasks.length === 0) return []

		const repeatable = tasks
			.filter((item) => item.repeatable)
			.map((item) => ({
				...item,
				repeatable: {
					...item.repeatable,
					repeatIndex: 0
				},
			} as WithRequired<typeof item, 'repeatable'>))
		const nonRepeatable = tasks.filter((item) => !item.repeatable)
		const repeatTasks = repeatable.flatMap((item) => {
			if (item.repeatable.repeatEvery <= 0) return []

			const addItemsFn = (_: unknown, i: number) => {
				if (i === 0) return null

				const addCount = i * item.repeatable.repeatEvery
				const date = dayjs(item.date)
					.add(addCount, item.repeatable.repeatType)
					.toISOString()

				if (dayjs(date).isAfter(datesRange?.lastDate)) return null

				const repeatable = {
					...item.repeatable,
					repeatIndex: i
				}

				return {
					...item,
					repeatable,
					date,
				} as typeof item
			}
			const diff = datesRange?.lastDate.diff(datesRange?.firstDate, item.repeatable.repeatType) ?? 0
			const itemsCount = Math.floor(diff / item.repeatable.repeatEvery)

			return Array.from({ length: itemsCount }, addItemsFn)
		})

		const final = [...repeatTasks, ...repeatable, ...nonRepeatable] as WithRequired<Task, 'date'>[]

		return final
			.filter(Boolean)
			.sort((a, b) => dayjs(a.date).diff(dayjs(b.date)))
	}
)

export const selectedRepeatableStatus = (id: Task['id'], date?: string) =>
	createSelector(
		selectedTasksWithRepeatable,
		(tasks) => {
			if (!date) return null
			const task = tasks.find((task) => task.id === id && task.date === date)
			const statuses = task?.repeatStatuses ?? []
			const index = task?.repeatable?.repeatIndex ?? 0

			return statuses[index] ?? task?.status
		}
	)


export const selectedTasksWithTitles = createSelector(
	selectedTasksWithRepeatable,
	tasks => splitByDays(tasks)
		.flatMap(group => {
			const withTime = group
				.filter(item => item.time)
				.sort((a, b) => dayjs(a.time).diff(dayjs(b.time))) as unknown as WithRequired<Task, 'date' | 'time'>[]
			const withTimeSplit = splitByTime(withTime)
				.filter(group => group.length > 0)
				.flatMap(group => {
					const time = dayjs(group[0].time).format('HH:mm')

					return [{ type: 'time', title: time }, ...group] as (Task | ListTitle)[]
				})
			const withoutTime = group
				.filter((item) => !item.time)
				.sort((a, b) => {
					if (a.status === TaskStatus.Done && b.status !== TaskStatus.Done) return 1
					if (a.status !== TaskStatus.Done && b.status === TaskStatus.Done) return -1
					return a.priority - b.priority
				})

			return [
				{ type: 'date', title: getDayTitle(group[0].date), date: group[0].date },
				...withoutTime,
				...withTimeSplit
			] as (Task | ListTitle)[]
		})
)

export const selectedTags = createSelector(
	selectedTasks,
	(tasks) => {
		const tags = new Set<string>()

		if (tasks.length === 0) return []

		for (const task of tasks) {
			for (const tag of task.tags) {
				tags.add(tag)
			}
		}
		return [...tags]
	}
)

export const selectedExpiredTasks = createSelector(
	selectedTasks,
	(tasks) => tasks.filter((task) =>
		task.date && dayjs(task.date).isBefore(dayjs().startOf('day'))
		&& task.status !== TaskStatus.Done
	)
)

export const selectedTasksByDate = (date: string) =>
	createSelector(
		selectedTasksWithRepeatable,
		tasks => tasks.filter((task) =>
			dayjs(task.date).isSame(dayjs(date), 'day')
		)
	)