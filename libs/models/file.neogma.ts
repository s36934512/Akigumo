import { ModelRelatedNodesI } from 'neogma';
import { ModelFactory } from 'neogma';
import { neogma } from '@server/core/infrastructure/database/neogma';
import { FileProperties } from '../contract/zod/file/v1/file-neo.zod';
import { ItemInstance, ItemModel } from './item.neogma';
import { NeogmaModel, NeogmaInstance } from 'neogma';

export type FileInstance = NeogmaInstance<FileProperties, FileRelationships>;

export interface FileRelationships {
    Item: ModelRelatedNodesI<typeof ItemModel, ItemInstance>;
}

export const FileModel: NeogmaModel<FileProperties, FileRelationships> = ModelFactory<FileProperties, FileRelationships>({
    label: 'File',
    schema: {
        id: {
            type: 'string',
            required: true,
            primary: true,
        },
    },
    relationships: {
        Item: {
            model: () => ItemModel,
            name: 'CONTAINS',
            direction: 'in',
        }
    },
}, neogma);
