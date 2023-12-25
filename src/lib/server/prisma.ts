import { PrismaClient } from '@prisma/client'
import type { Prisma } from '@prisma/client'

type ModelNames = Prisma.ModelName

export type PrismaModels = {
    [M in ModelNames]: Exclude<
        Awaited<ReturnType<PrismaClient[Uncapitalize<M>]['findUnique']>>,
        null
    >
}

export const prisma: PrismaClient = globalThis.prisma || new PrismaClient({
	log: ['info'],
})
