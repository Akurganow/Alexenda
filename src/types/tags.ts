import { Color } from 'antd/es/color-picker'
import { Diff } from 'types/common'

export interface Tag {
    id: string;
    name: string;
    color: string;
    showStats: boolean;
    createdAt: number;
    updatedAt: number;
    deletedAt?: number;
}

export interface TagForm extends Omit<Tag, 'id' | 'color'> {
    color: Color | string;
}

export type TagsState = {
    items: Tag[]
    lastServerUpdate?: string
    isSyncing?: boolean
}

export type TagDiff = Diff<Tag>