import { Prisma } from '@prisma/client'
import { Diff } from 'types/common'

export type UnknownPayload = { id: string }
export type SyncPayload<T extends UnknownPayload> = {
    diff?: Diff<T>
    lastServerUpdate?: Date
}
export type SyncPayloadScope<T extends UnknownPayload> = Partial<{
    [K in Uncapitalize<Prisma.ModelName>]: SyncPayload<T> | SyncPayload<T>[]
}>
export type SyncConfig<T extends UnknownPayload> = {
    [K in string]: (action: unknown, state: unknown) => SyncPayloadScope<T>
}
export type ModelName = 'tag' | 'task'