'use server'
import { ModelName, SyncPayload, UnknownPayload } from 'lib/syncer/types'
import { getCurrentUser } from 'lib/server/user'
import { prisma } from 'lib/server/prisma'
import { Prisma } from '@prisma/client'
import { Diff } from 'types/common'

async function createMany(created: Diff<UnknownPayload>['create'], scopeName: ModelName) {
	if (!created || created.length === 0) return

	const db = prisma[scopeName as Prisma.ModelName]

	if (!db) return

	const createdIds = created.map(item => item?.id).filter(Boolean) as string[]
	const existingItems = (await db.findMany({
		where: {
			id: {
				in: createdIds,
			},
		},
		select: {
			id: true,
		},
	})).map((item: { id: string }) => item.id) as string[]

	const updatedItems = created.filter(item => existingItems.includes(item.id))
	const newItems = created.filter(item => !existingItems.includes(item.id))

	if (updatedItems.length > 0) {
		await this.updateMany(updatedItems, scopeName)
	}

	if (newItems.length > 0) {
		try {
			await db.createMany({
				data: newItems,
			})
		} catch (error) {
			throw new Error(error)
		}
	}
}

async function updateMany(updated: Diff<UnknownPayload>['update'], scopeName: ModelName) {
	if (!updated || updated.length === 0) return

	const db = prisma[scopeName as Prisma.ModelName]

	if (!db) return

	const updatedIds = updated.map(item => item.id).filter(Boolean) as string[]
	const existingItems = (await db.findMany({
		where: {
			id: {
				in: updatedIds,
			},
		},
		select: {
			id: true,
		},
	})).map((item: { id: string }) => item.id) as string[]

	const updatedItems = updated.filter(item => existingItems.includes(item.id))
	const newItems = updated.filter(item => !existingItems.includes(item.id))

	if (newItems.length > 0) {
		await this.createMany(newItems, scopeName)
	}

	await Promise.all(updatedItems.map(async item => {
		try {
			await db.update({
				where: {
					id: item.id,
				},
				data: item,
			})
		} catch (error) {
			throw new Error(error)
		}
	}))
}

async function deleteMany(deleted: Diff<UnknownPayload>['delete'], scopeName: ModelName) {
	if (!deleted || deleted.length === 0) return

	const db = prisma[scopeName as Prisma.ModelName]

	if (!db) return

	try {
		await db.updateMany({
			where: {
				id: {
					in: deleted,
				},
			},
			data: {
				deletedAt: new Date(),
			},
		})
	} catch (error) {
		throw new Error(error)
	}
}

async function getLastServerUpdate(scopeName: ModelName) {
	const user = await getCurrentUser()

	if (!user) return

	const db = prisma[scopeName as Prisma.ModelName]

	try {
		console.debug('getLastServerUpdate:start')
		const tasks = await db.findMany({
			where: {
				userId: user.id,
			},
			select: {
				updatedAt: true,
				deletedAt: true,
				createdAt: true,
			},
			orderBy: [
				{ createdAt: 'desc' },
				{ updatedAt: 'desc' },
				{ deletedAt: 'desc' },
			],
			take: 1,
		})

		if (tasks.length === 0) return

		const lastUpdate = Math.max.apply(null, [
			tasks[0].updatedAt,
			tasks[0].deletedAt,
			tasks[0].createdAt,
		]
			.filter(Boolean)
			.map(date => new Date(date!).getTime()))
		console.debug('getLastServerUpdate:end', lastUpdate)
		return lastUpdate ? new Date(lastUpdate) : undefined
	} catch (error) {
		throw new Error(error)
	}
}

async function getServerDiff(scopeName: ModelName, lastClientUpdate: Date) {
	const user = await getCurrentUser()

	if (!user) return

	const db = prisma[scopeName as Prisma.ModelName]

	if (!db) return

	const created = await db.findMany({
		where: {
			AND: [
				{ userId: user.id },
				{ createdAt: { gt: lastClientUpdate } },
				{
					OR: [
						{ deletedAt: null },
						{ deletedAt: undefined },
					]
				},
			],
		},
	})
	const updated = await db.findMany({
		where: {
			AND: [
				{ userId: user.id },
				{ updatedAt: { gt: lastClientUpdate } },
				{
					OR: [
						{ deletedAt: null },
						{ deletedAt: undefined },
					]
				},
			],
		},
	})
	const deleted = await db.findMany({
		where: {
			AND: [
				{ userId: user.id },
				{ deletedAt: { gt: lastClientUpdate } },
			],
		},
	})
	const lastServerUpdate = await getLastServerUpdate(scopeName)

	return {
		create: created,
		update: updated,
		delete: deleted,
		lastServerUpdate,
	}
}

export async function performClientDiff(scopeName: ModelName, clientDiff: SyncPayload<UnknownPayload>) {
	const user = await getCurrentUser()

	if (!user) return

	const db = prisma[scopeName]

	if (!db) return

	if (clientDiff.diff) {
		const { create, update, delete: deleted } = clientDiff.diff

		await Promise.all([
			createMany(create, scopeName),
			updateMany(update, scopeName),
			deleteMany(deleted, scopeName),
		])
	}

	return await getServerDiff(scopeName, clientDiff.lastServerUpdate || new Date(0))
}

