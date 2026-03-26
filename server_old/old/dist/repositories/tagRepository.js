import { prisma } from '../../prisma/lib/prisma.js';
import { TagCreateInputObjectSchema } from '../../generated/zod/schemas/objects/TagCreateInput.schema';
import { TaggingCreateInputObjectSchema } from '../../generated/zod/schemas/objects/TaggingCreateInput.schema';
/**
 * Create a new tag.
 * @param tagData - The tag data.
 */
async function createTag(tagData) {
    const validation = TagCreateInputObjectSchema.safeParse(tagData);
    if (!validation.success) {
        throw new Error(`Invalid tag data: ${validation.error.message}`);
    }
    try {
        return await prisma.tag.create({
            data: validation.data,
        });
    }
    catch (err) {
        console.error('Failed to create tag:', err);
        throw err;
    }
}
/**
 * Get a tag by ID.
 * @param id - The ID of the tag.
 */
async function getTagById(id) {
    if (!id) {
        throw new Error('ID is required');
    }
    try {
        return await prisma.tag.findUnique({
            where: { id },
        });
    }
    catch (err) {
        console.error(`Failed to get tag with id ${id}:`, err);
        throw err;
    }
}
/**
 * Tag a resource.
 * @param taggingData - The tagging data.
 */
async function tagResource(taggingData) {
    const validation = TaggingCreateInputObjectSchema.safeParse(taggingData);
    if (!validation.success) {
        throw new Error(`Invalid tagging data: ${validation.error.message}`);
    }
    try {
        return await prisma.tagging.create({
            data: validation.data,
        });
    }
    catch (err) {
        console.error('Failed to tag resource:', err);
        throw err;
    }
}
export { createTag, getTagById, tagResource, };
