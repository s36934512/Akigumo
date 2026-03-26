import { ModelRelatedNodesI } from 'neogma';
import { ModelFactory } from 'neogma';
import { neogma } from '@server/core/infrastructure/database/neogma';
import { ItemProperties } from '../contract/zod/item/v1/item-neo.zod';
import { FileInstance, FileModel } from './file.neogma';
import { NeogmaModel, NeogmaInstance } from 'neogma';

// 先定義 Instance 型別，方便後面 File 引用
export type ItemInstance = NeogmaInstance<ItemProperties, ItemRelationships>;

export interface ItemRelationships {
    children: ModelRelatedNodesI<
        typeof ItemModel,
        ItemInstance,       // 子項目的實例類型 (Instance)
        { order?: number }, // (選填) 你在程式碼中使用的關係屬性 (例如：排序)
        { order?: number }  // (選填) 在資料庫中實際存儲的屬性名稱
    >;
    trashedChildren: ModelRelatedNodesI<
        typeof ItemModel,
        ItemInstance,
        { order?: number },
        { order?: number }
    >;
    file: ModelRelatedNodesI<
        typeof FileModel,
        FileInstance,
        { order?: number },
        { order?: number }
    >;
    parent: ModelRelatedNodesI<
        typeof ItemModel,
        ItemInstance
    >;
    trashedParent: ModelRelatedNodesI<
        typeof ItemModel,
        ItemInstance
    >;
}

export const ItemModel: NeogmaModel<ItemProperties, ItemRelationships> = ModelFactory<ItemProperties, ItemRelationships>({
    label: 'Item',
    schema: {
        id: {
            type: 'string',
            required: true,
            primary: true,
        },
        title: {
            type: 'string',
            required: true,
        }
    },
    relationships: {
        // 1. 正常的包含關係
        children: {
            model: "self",
            name: 'CONTAINS', // 對應 Cypher 裡的 :CONTAINS
            direction: 'out',
        },
        // 2. 回收站的包含關係
        trashedChildren: {
            model: "self",
            name: 'TRASHED',  // 對應 Cypher 裡的 :TRASHED
            direction: 'out',
        },
        file: {
            model: () => FileModel,
            name: 'CONTAINS',
            direction: 'out',
        },
        // 3. 反向找父節點
        parent: {
            model: "self",
            name: 'CONTAINS',
            direction: 'in',
        },
        trashedParent: {
            model: "self",
            name: 'TRASHED',
            direction: 'in',
        }
    },
}, neogma);
export type ItemModelType = typeof ItemModel;
