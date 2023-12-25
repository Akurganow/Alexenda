import { TasksState } from 'types/tasks'
// import { Task, TasksState, TaskStatus } from 'types/tasks'
// import { faker } from '@faker-js/faker'
// import dayjs from 'dayjs'
// import { uniq } from 'lodash'

export const storeKey = 'tasks'

export const initialState: TasksState = {
	items: [],
	newTask: null,
}

// function initialTags() {
// 	return faker.helpers.multiple(faker.lorem.word, { count: 10 })
// }
//
// function createTaskMock(): Omit<Task, 'tags' | 'id'> {
// 	const title = faker.lorem.sentence()
// 	const repeatable = faker.datatype.boolean() ? null : {
// 		repeatType: faker.helpers.arrayElement(['day', 'day', 'day', 'day', 'week', 'week', 'week', 'month', 'year']) as Task['repeatable']['repeatType'],
// 		repeatEvery: faker.number.int({ min: 1, max: 7 }),
// 	}
// 	const estimate = faker.number.int({ min: 1, max: 8 })
// 	const timeSpent = faker.number.int({ min: 1, max: estimate })
// 	const status = faker.helpers.arrayElement([TaskStatus.Init, TaskStatus.Open, TaskStatus.InProgress, TaskStatus.Done]) as Task['status']
// 	const priority = faker.helpers.arrayElement([0, 1, 2, 3]) as Task['priority']
// 	const withDueDate = faker.datatype.boolean()
// 	const dueDate = withDueDate ? dayjs(faker.date.soon({ days: 10 })).toISOString() : undefined
// 	const withDate = faker.datatype.boolean()
// 	const isSoon = faker.datatype.boolean()
// 	const soonDate = dayjs(faker.date.soon({ days: isSoon ? 10 : 90 })).toISOString()
// 	const date = withDate ? soonDate : undefined
// 	const withTime = faker.datatype.boolean()
// 	const time = withTime ? date : undefined
//
// 	return {
// 		title,
// 		repeatable,
// 		estimate,
// 		timeSpent,
// 		dueDate,
// 		status,
// 		priority,
// 		date,
// 		time,
// 		checklist: createCheckListMock(faker.number.int({ min: 1, max: 10 }))
// 	}
// }

// function createTagsMock(tags: string[], count: number = 10) {
// 	return uniq(faker.helpers.multiple(() => {
// 		return faker.helpers.arrayElement(tags)
// 	}, { count }))
// }

// function createCheckListMock(count: number) {
// 	return faker.helpers.multiple(createCheckListItemMock, { count })
// }

// function createCheckListItemMock(): Task['checkList'][0] {
// 	const id = faker.number.int({ min: 1, max: 1000 })
// 	const title = faker.lorem.sentence()
// 	const completed = faker.datatype.boolean()
//
// 	return {
// 		id,
// 		title,
// 		completed
// 	}
// }

// // eslint-disable-next-line @typescript-eslint/no-unused-vars
// function createTasksMock(count: number): Task[] {
// 	const initTags = initialTags()
//
// 	return faker.helpers.multiple(() => {
// 		return {
// 			...createTaskMock(),
// 			tags: createTagsMock(initTags, faker.number.int({ min: 0, max: 5 })),
// 		}
// 	}, { count }).map((task, index) => ({ ...task, id: index }))
// }