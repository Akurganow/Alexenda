import { Task, TaskPriority } from 'types/tasks'
import dayjs from 'dayjs'
import { BadgeProps } from 'antd/lib/badge'
import { grey, orange, red } from '@ant-design/colors'

export function getPriority(priority: TaskPriority) {
	switch (priority) {
	case TaskPriority.Low: {
		return 'low'
	}
	case TaskPriority.Normal: {
		return 'normal'
	}
	case TaskPriority.High: {
		return 'high'
	}
	case TaskPriority.Urgent: {
		return 'urgent'
	}
	}
}

export function getDueDateToken(dueDate: Task['dueDate'], date?: Task['date']): string {
	const now = dayjs()
	const currentDueDate = dayjs(dueDate)
	const daysLeft = currentDueDate.diff(now, 'day')
	const isOverdue = currentDueDate.isBefore(date, 'day')
	const isExpired = currentDueDate.isBefore(now, 'day')

	switch (true) {
	case isExpired: {
		return 'expired'
	}
	case isOverdue: {
		return 'overdue'
	}
	case daysLeft < 3: {
		return 'soon'
	}
	case daysLeft < 7: {
		return 'week'
	}
	case dayjs(dueDate).isSame(now, 'month'): {
		return 'month'
	}
	default: {
		return 'default'
	}
	}
}

export function getDueDateColor(dueDate: Task['dueDate'], date?: Task['date']): string {
	const now = dayjs()
	const currentDueDate = dayjs(dueDate)
	const daysLeft = currentDueDate.diff(now, 'day')
	const isOverdue = currentDueDate.isBefore(date, 'day')

	switch (true) {
	case isOverdue: {
		return red.primary as string
	}
	case daysLeft < 3: {
		return red.primary as string
	}
	case daysLeft < 7: {
		return orange.primary as string
	}
	default: {
		return grey.primary as string
	}
	}
}

export function getDueDateStatus(dueDate: Task['dueDate'], date?: Task['date']): BadgeProps['status'] {
	const now = dayjs()
	const currentDueDate = dayjs(dueDate)
	const daysLeft = currentDueDate.diff(now, 'day')
	const isOverdue = currentDueDate.isBefore(date, 'day')

	switch (true) {
	case isOverdue: {
		return 'error'
	}
	case daysLeft < 3: {
		return 'error'
	}
	case daysLeft < 7: {
		return 'warning'
	}
	default: {
		return 'default'
	}
	}
}