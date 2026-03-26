// 根據 prisma/models/item.prisma 定義的 TypeScript 項目預設設定
// 可擴充、型別安全，方便直接用於程式邏輯

import { ItemStatus, ItemType } from "generated/prisma/client"

export interface ItemDefaultConfig {
    title: string;
    description?: string;
    metadata?: any;
    type: ItemType;
    status: ItemStatus;
}

export const ITEM_DEFAULT: ItemDefaultConfig[] = [
    {
        title: "root",
        type: ItemType.FILE_CONTAINER,
        status: ItemStatus.ACTIVE,
    },
    {
        title: "預設項目B",
        type: ItemType.SERIES,
        status: ItemStatus.DRAFT,
    },
    {
        title: "預設項目C",
        type: ItemType.COLLECTION,
        status: ItemStatus.DRAFT,
    },
    // ...可依需求擴充
];
