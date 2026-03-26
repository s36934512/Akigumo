import { TagCreateInputObjectSchema } from '../../generated/zod/schemas/objects/TagCreateInput.schema';
import { TaggingCreateInputObjectSchema } from '../../generated/zod/schemas/objects/TaggingCreateInput.schema';
import { z } from 'zod';
/**
 * Create a new tag.
 * @param tagData - The tag data.
 */
declare function createTag(tagData: z.infer<typeof TagCreateInputObjectSchema>): Promise<any>;
/**
 * Get a tag by ID.
 * @param id - The ID of the tag.
 */
declare function getTagById(id: number): Promise<any>;
/**
 * Tag a resource.
 * @param taggingData - The tagging data.
 */
declare function tagResource(taggingData: z.infer<typeof TaggingCreateInputObjectSchema>): Promise<any>;
export { createTag, getTagById, tagResource, };
