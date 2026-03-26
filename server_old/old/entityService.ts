//     /**
//      * 依名稱查詢 category，若不存在則自動建立
//      */
//     async findOrCreateCategoryByName(name: string, description ?: string) {
//     let category = await prisma.category.findFirst({
//         where: {
//             categoryAlias: {
//                 some: { name }
//             }
//         },
//         include: { categoryAlias: true }
//     });
//     if (category) return category;
//     // 建立 category
//     category = await prisma.category.create({ data: {} });
//     // 建立 alias 並關聯
//     const alias = await prisma.categoryAlias.create({
//         data: {
//             name,
//             description,
//             category: { connect: { id: category.id } }
//         }
//     });
//     // 回傳含 alias 的 category
//     return await prisma.category.findUnique({
//         where: { id: category.id },
//         include: { categoryAlias: true }
//     });
// }

//     /**
//      * 取得所有 category（可選 include alias）
//      */
//     async getCategories(withAlias = false) {
//     return await prisma.category.findMany({
//         include: withAlias ? { categoryAlias: true } : undefined
//     });
// }

//     /**
//      * 取得某 category 的所有 alias
//      */
//     async getCategoryAliases(categoryId: number) {
//     const category = await prisma.category.findUnique({
//         where: { id: categoryId },
//         include: { categoryAlias: true }
//     });
//     return category?.categoryAlias || [];
// }
// import { prisma } from '../../prisma/lib/prisma';
// import { z } from 'zod';


// const CreateEntitySchema = z.object({
//     redundancy: z.any().optional(),
//     defaultCategoryId: z.number().optional(),
// });

// const CreateEntityAliasSchema = z.object({
//     entityId: z.number(),
//     name: z.string(),
//     description: z.string().optional(),
// });

// export class EntityService {

//     async createEntity(entityData: z.infer<typeof CreateEntitySchema>) {
//         const validatedData = CreateEntitySchema.parse(entityData);
//         return await prisma.entity.create({
//             data: {
//                 redundancy: validatedData.redundancy,
//                 defaultCategoryId: validatedData.defaultCategoryId,
//             },
//         });
//     }

//     /**
//      * 依角色名稱查詢，若不存在則自動建立角色 entity
//      */
//     async findOrCreateCharacterByName(name: string) {
//         // 1. 先查詢是否有同名角色
//         let character = await prisma.entity.findFirst({
//             where: {
//                 name,
//                 // 假設 type 欄位用 'character' 區分
//                 // 若你 schema 沒有 type 請移除此條件
//                 // type: 'character',
//             },
//         });
//         // 2. 若已存在，直接回傳
//         if (character) return character;
//         // 3. 若不存在，自動建立
//         character = await prisma.entity.create({
//             data: {
//                 name,
//                 // type: 'character', // 若有 type 欄位
//             },
//         });
//         return character;
//     }

//     async getEntityById(id: number) {
//         return await prisma.entity.findUnique({
//             where: { id },
//             include: {
//                 entityAlias: true,
//                 relations: true,
//                 defaultCategory: true,
//             },
//         });
//     }

//     async addAliasToEntity(entityId: number, aliasData: { name: string, description?: string }) {
//         return await prisma.entityAlias.create({
//             data: {
//                 name: aliasData.name,
//                 description: aliasData.description,
//                 entity: { connect: { id: entityId } },
//             },
//         });
//     }

//     async getAliasById(id: number) {
//         return await prisma.entityAlias.findUnique({
//             where: { id },
//         });
//     }


//     async getAliasesByEntityId(entityId: number) {
//         // 查詢某個 entity 關聯的所有 alias
//         const entity = await prisma.entity.findUnique({
//             where: { id: entityId },
//             include: { entityAlias: true }
//         });
//         return entity?.entityAlias || [];
//     }

//     async getRelationsByEntityId(entityId: number) {
//         // 查詢某個 entity 關聯的所有 relations
//         const entity = await prisma.entity.findUnique({
//             where: { id: entityId },
//             include: { relations: true }
//         });
//         return entity?.relations || [];
//     }

//     async updateAlias(id: number, aliasData: { name?: string, description?: string }) {
//         return await prisma.entityAlias.update({
//             where: { id },
//             data: aliasData,
//         });
//     }

//     async deleteAlias(id: number) {
//         return await prisma.entityAlias.delete({
//             where: { id },
//         });
//     }
// }
