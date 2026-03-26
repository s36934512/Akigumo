// import express from 'express';
// import { prisma } from '../../../prisma/lib/prisma.js';

// const router = express.Router();

// // Helper function to connect/create related entities
// const connectOrCreateMany = async (model, data, field = 'name') => {
//     return Promise.all(
//         data.map(async (item) => {
//             const existing = await prisma[model].findUnique({ where: { [field]: item[field] } });
//             if (existing) {
//                 return { id: existing.id };
//             } else {
//                 const created = await prisma[model].create({ data: item });
//                 return { id: created.id };
//             }
//         })
//     );
// };

// // Helper function to parse ComicFileDTO to Prisma connect/create data
// const parseComicFileDTO = async (dto) => {
//     const {
//         comic_id, // This is for existing comic, not for creation
//         cover_path,
//         imageFiles,
//         title,
//         author,
//         group, // Maps to Publisher or a specific tag
//         type, // Maps to ComicType
//         language, // Maps to Language
//         series, // Maps to Series
//         category, // Maps to Category
//         characters,
//         tags,
//         status, // Maps to ComicStatus
//         releaseDate,
//         isPublic,
//         description,
//         editorNote,
//         ai_generated
//     } = dto;

//     const parsedAuthors = await Promise.all(
//         author.map(async (name) => {
//             let existingAuthor = await prisma.author.findUnique({ where: { name } });
//             if (!existingAuthor) {
//                 existingAuthor = await prisma.author.create({ data: { name, code: name.replace(/\s+/g, '-').toLowerCase() } });
//             }
//             return { id: existingAuthor.id };
//         })
//     );

//     const parsedCharacters = await Promise.all(
//         characters.map(async (name) => {
//             let existingCharacter = await prisma.character.findUnique({ where: { name } });
//             if (!existingCharacter) {
//                 existingCharacter = await prisma.character.create({ data: { name, code: name.replace(/\s+/g, '-').toLowerCase() } });
//             }
//             return { id: existingCharacter.id };
//         })
//     );

//     const parsedTags = await Promise.all(
//         tags.map(async (name) => {
//             let existingTag = await prisma.tag.findUnique({ where: { name } });
//             if (!existingTag) {
//                 existingTag = await prisma.tag.create({ data: { name, code: name.replace(/\s+/g, '-').toLowerCase() } });
//             }
//             return { id: existingTag.id };
//         })
//     );

//     const parsedSeries = series
//         ? await (async () => {
//             let existingSeries = await prisma.series.findUnique({ where: { name: series } });
//             if (!existingSeries) {
//                 existingSeries = await prisma.series.create({ data: { name: series, code: series.replace(/\s+/g, '-').toLowerCase() } });
//             }
//             return { connect: { id: existingSeries.id } };
//         })()
//         : undefined;

//     const parsedComicType = await prisma.comicType.findUnique({ where: { name: type } });
//     if (!parsedComicType) throw new Error(`ComicType "${type}" not found`);

//     const parsedLanguage = await prisma.language.findUnique({ where: { name: language } });
//     if (!parsedLanguage) throw new Error(`Language "${language}" not found`);

//     const parsedCategory = await prisma.category.findUnique({ where: { name: category } });
//     if (!parsedCategory) throw new Error(`Category "${category}" not found`);

//     const parsedComicStatus = await prisma.comicStatus.findUnique({ where: { name: status } });
//     if (!parsedComicStatus) throw new Error(`ComicStatus "${status}" not found`);

//     // Files/Images are complex. For now, assume imageFiles are URLs that need to be linked or created.
//     // This part might need further refinement based on actual file storage and processing.
//     const fileAndImageCreates = imageFiles ? imageFiles.map(img => ({
//         file: {
//             create: {
//                 // Assuming FileType is 'image' and FileSubType 'jpg/png' based on imageFiles
//                 fileType: { connect: { code: 'image' } }, // Need to ensure 'image' fileType exists
//                 fileSubType: { connect: { code: 'jpg' } }, // Defaulting to jpg, need better handling
//                 size: img.size ? String(img.size) : '0',
//             }
//         },
//         image: {
//             create: {
//                 width: img.width,
//                 height: img.height,
//                 colorMode: img.colorMode,
//             }
//         }
//     })) : [];


//     return {
//         workMetadata: {
//             title,
//             description,
//             // Publisher (group) might need a dedicated model or handling in redundancy
//             authors: { connect: parsedAuthors },
//             characters: { connect: parsedCharacters },
//             series: parsedSeries,
//             taggings: {
//                 create: parsedTags.map(tag => ({
//                     tag: { connect: { id: tag.id } }
//                 }))
//             },
//         },
//         comic: {
//             publishedTime: releaseDate ? new Date(releaseDate) : undefined,
//             aiGenerated: ai_generated,
//             comicType: { connect: { id: parsedComicType.id } },
//         },
//         comicContent: {
//             // cover, pageCount handled elsewhere or from File data
//             comicStatus: { connect: { id: parsedComicStatus.id } },
//             workContent: {
//                 language: { connect: { id: parsedLanguage.id } },
//                 category: { connect: { id: parsedCategory.id } },
//             },
//         },
//         // resource (handle separately for connection), file, image
//     };
// };

// // GET /api/v1/comics - Get all comics with pagination, filtering, and sorting
// router.get('/', async (req, res) => {
//     const {
//         page = 1,
//         limit = 10,
//         search = '',
//         author = '',
//         tag = '',
//         category = '',
//         status = '',
//         orderBy = 'publishedTime',
//         order = 'desc'
//     } = req.query;

//     const skip = (parseInt(page) - 1) * parseInt(limit);
//     const take = parseInt(limit);

//     const where = {
//         AND: [
//             search
//                 ? {
//                     OR: [
//                         { workMetadata: { name: { contains: search, mode: 'insensitive' } } },
//                         { workMetadata: { description: { contains: search, mode: 'insensitive' } } },
//                         { workMetadata: { authors: { some: { name: { contains: search, mode: 'insensitive' } } } } },
//                         { workMetadata: { taggings: { some: { tag: { name: { contains: search, mode: 'insensitive' } } } } } },
//                     ],
//                 }
//                 : {},
//             author ? { workMetadata: { authors: { some: { name: { contains: author, mode: 'insensitive' } } } } } : {},
//             tag ? { workMetadata: { taggings: { some: { tag: { name: { contains: tag, mode: 'insensitive' } } } } } } : {},
//             category ? { comicContent: { workContent: { category: { name: { contains: category, mode: 'insensitive' } } } } } : {},
//             status ? { comicContent: { comicStatus: { code: status } } } : {},
//         ],
//     };

//     try {
//         const comics = await prisma.comic.findMany({
//             skip,
//             take,
//             where,
//             orderBy: {
//                 [orderBy]: order,
//             },
//             include: {
//                 workMetadata: {
//                     include: {
//                         resource: true,
//                         authors: true,
//                         characters: true,
//                         series: true,
//                         taggings: {
//                             include: {
//                                 tag: true,
//                             },
//                         },
//                     },
//                 },
//                 comicContent: {
//                     include: {
//                         comicStatus: true,
//                         workContent: {
//                             include: {
//                                 category: true,
//                                 language: true,
//                             },
//                         },
//                     },
//                 },
//                 comicType: true,
//             },
//         });

//         const totalComics = await prisma.comic.count({ where });

//         res.json({
//             data: comics,
//             total: totalComics,
//             page: parseInt(page),
//             limit: parseInt(limit),
//             lastPage: Math.ceil(totalComics / parseInt(limit)),
//         });
//     } catch (error) {
//         console.error('Error fetching comics:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });

// // GET /api/v1/comics/:id - Get a single comic by ID
// router.get('/:id', async (req, res) => {
//     const { id } = req.params;

//     try {
//         const comic = await prisma.comic.findUnique({
//             where: { workMetadataId: parseInt(id) },
//             include: {
//                 workMetadata: {
//                     include: {
//                         resource: true,
//                         authors: true,
//                         characters: true,
//                         series: true,
//                         taggings: {
//                             include: {
//                                 tag: true,
//                             },
//                         },
//                     },
//                 },
//                 comicContent: {
//                     include: {
//                         comicStatus: true,
//                         workContent: {
//                             include: {
//                                 category: true,
//                                 language: true,
//                             },
//                         },
//                     },
//                 },
//                 comicType: true,
//             },
//         });

//         if (!comic) {
//             return res.status(404).json({ error: 'Comic not found' });
//         }

//         res.json(comic);
//     } catch (error) {
//         console.error(`Error fetching comic with ID ${id}:`, error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });

// // POST /api/v1/comics - Create a new comic
// router.post('/', async (req, res) => {
//     const dto = req.body; // ComicFileDTO
//     try {
//         const result = await prisma.$transaction(async (tx) => {
//             // 1. Create Resource (generic asset)
//             const resource = await tx.resource.create({
//                 data: {
//                     name: dto.title,
//                     resourceType: { connect: { code: 'comic' } }, // Assuming 'comic' resourceType exists
//                     // Add other resource specific fields if needed
//                 },
//             });

//             // 2. Prepare data for WorkMetadata, Comic, WorkContent, ComicContent
//             const parsedAuthors = await Promise.all(
//                 dto.author.map(async (name) => {
//                     let existingAuthor = await tx.author.findUnique({ where: { name } });
//                     if (!existingAuthor) {
//                         existingAuthor = await tx.author.create({ data: { name, code: name.replace(/\s+/g, '-').toLowerCase() } });
//                     }
//                     return { id: existingAuthor.id };
//                 })
//             );

//             const parsedCharacters = await Promise.all(
//                 dto.characters.map(async (name) => {
//                     let existingCharacter = await tx.character.findUnique({ where: { name } });
//                     if (!existingCharacter) {
//                         existingCharacter = await tx.character.create({ data: { name, code: name.replace(/\s+/g, '-').toLowerCase() } });
//                     }
//                     return { id: existingCharacter.id };
//                 })
//             );

//             const parsedTags = await Promise.all(
//                 dto.tags.map(async (name) => {
//                     let existingTag = await tx.tag.findUnique({ where: { name } });
//                     if (!existingTag) {
//                         existingTag = await tx.tag.create({ data: { name, code: name.replace(/\s+/g, '-').toLowerCase() } });
//                     }
//                     return { id: existingTag.id };
//                 })
//             );

//             const parsedSeries = dto.series
//                 ? await (async () => {
//                     let existingSeries = await tx.series.findUnique({ where: { name: dto.series } });
//                     if (!existingSeries) {
//                         existingSeries = await tx.series.create({ data: { name: dto.series, code: dto.series.replace(/\s+/g, '-').toLowerCase() } });
//                     }
//                     return { connect: { id: existingSeries.id } };
//                 })()
//                 : undefined;

//             const comicType = await tx.comicType.findUnique({ where: { name: dto.type } });
//             if (!comicType) throw new Error(`ComicType "${dto.type}" not found`);

//             const language = await tx.language.findUnique({ where: { name: dto.language } });
//             if (!language) throw new Error(`Language "${dto.language}" not found`);

//             const category = await tx.category.findUnique({ where: { name: dto.category } });
//             if (!category) throw new Error(`Category "${dto.category}" not found`);

//             const comicStatus = await tx.comicStatus.findUnique({ where: { name: dto.status } });
//             if (!comicStatus) throw new Error(`ComicStatus "${dto.status}" not found`);

//             // 3. Create WorkMetadata
//             const workMetadata = await tx.workMetadata.create({
//                 data: {
//                     description: dto.description,
//                     authors: { connect: parsedAuthors },
//                     characters: { connect: parsedCharacters },
//                     series: parsedSeries,
//                     taggings: {
//                         create: parsedTags.map(tag => ({
//                             tag: { connect: { id: tag.id } }
//                         }))
//                     },
//                     // publisher (group) would go here if mapped to Publisher model
//                 },
//             });

//             // 4. Create Work
//             const work = await tx.work.create({
//                 data: {
//                     resource: { connect: { id: resource.id } },
//                     workType: { connect: { code: 'comic' } }, // Assuming 'comic' workType exists
//                     workMetadata: { connect: { id: workMetadata.id } },
//                 },
//             });

//             // 5. Create WorkContent
//             const workContent = await tx.workContent.create({
//                 data: {
//                     work: { connect: { id: work.id } },
//                     language: { connect: { id: language.id } },
//                     category: { connect: { id: category.id } },
//                 },
//             });

//             // 6. Create ComicContent
//             const comicContent = await tx.comicContent.create({
//                 data: {
//                     workContent: { connect: { workId: workContent.workId } }, // Connect to WorkContent via workId
//                     comicStatus: { connect: { id: comicStatus.id } },
//                     // cover, pageCount from DTO, if available
//                     cover: dto.cover ? parseInt(dto.cover) : undefined, // Assuming cover is a page index
//                     pageCount: dto.pageCount ? parseInt(dto.pageCount) : undefined,
//                 },
//             });

//             // 7. Create Comic
//             const comic = await tx.comic.create({
//                 data: {
//                     workMetadata: { connect: { id: workMetadata.id } },
//                     publishedTime: dto.releaseDate ? new Date(dto.releaseDate) : undefined,
//                     aiGenerated: dto.ai_generated,
//                     comicType: { connect: { id: comicType.id } },
//                 },
//             });

//             // 8. Handle Image Files (assuming imageFiles are already uploaded and we just link them)
//             // This part needs refinement. For now, assuming imageFiles has `path` or `url`
//             // and we create File/Image entries for each, linking them to the Resource.
//             // This is a simplified approach. A more robust solution would involve a separate
//             // file upload service that returns file IDs.
//             if (dto.imageFiles && dto.imageFiles.length > 0) {
//                 for (const imgFile of dto.imageFiles) {
//                     const file = await tx.file.create({
//                         data: {
//                             // Link to parent Resource
//                             resource: { connect: { id: resource.id } },
//                             size: imgFile.size ? String(imgFile.size) : '0',
//                             fileType: { connect: { code: 'image' } }, // Assumes 'image' FileType exists
//                             fileSubType: { connect: { code: 'webp' } }, // Assuming webp, could be from imgFile.format
//                         },
//                     });

//                     await tx.image.create({
//                         data: {
//                             file: { connect: { id: file.id } },
//                             width: imgFile.width,
//                             height: imgFile.height,
//                             colorMode: imgFile.colorMode,
//                         },
//                     });
//                 }
//             }


//             return { comic, work, resource };
//         });

//         res.status(201).json(result.comic);
//     } catch (error) {
//         console.error('Error creating comic:', error);
//         res.status(500).json({ error: error.message || 'Internal server error' });
//     }
// });

// // PUT /api/v1/comics/:id - Update an existing comic
// router.put('/:id', async (req, res) => {
//     const { id } = req.params; // workMetadataId
//     const dto = req.body; // ComicFileDTO

//     try {
//         const result = await prisma.$transaction(async (tx) => {
//             const existingComic = await tx.comic.findUnique({
//                 where: { workMetadataId: parseInt(id) },
//                 include: {
//                     workMetadata: { include: { authors: true, characters: true, taggings: { include: { tag: true } } } },
//                     comicContent: { include: { workContent: true } },
//                 },
//             });

//             if (!existingComic) {
//                 throw new Error('Comic not found');
//             }

//             // Update WorkMetadata
//             const parsedAuthors = await Promise.all(
//                 dto.author.map(async (name) => {
//                     let existingAuthor = await tx.author.findUnique({ where: { name } });
//                     if (!existingAuthor) {
//                         existingAuthor = await tx.author.create({ data: { name, code: name.replace(/\s+/g, '-').toLowerCase() } });
//                     }
//                     return { id: existingAuthor.id };
//                 })
//             );

//             const parsedCharacters = await Promise.all(
//                 dto.characters.map(async (name) => {
//                     let existingCharacter = await tx.character.findUnique({ where: { name } });
//                     if (!existingCharacter) {
//                         existingCharacter = await tx.character.create({ data: { name, code: name.replace(/\s+/g, '-').toLowerCase() } });
//                     }
//                     return { id: existingCharacter.id };
//                 })
//             );

//             const parsedTags = await Promise.all(
//                 dto.tags.map(async (name) => {
//                     let existingTag = await tx.tag.findUnique({ where: { name } });
//                     if (!existingTag) {
//                         existingTag = await tx.tag.create({ data: { name, code: name.replace(/\s+/g, '-').toLowerCase() } });
//                     }
//                     return { id: existingTag.id };
//                 })
//             );

//             const parsedSeries = dto.series
//                 ? await (async () => {
//                     let existingSeries = await tx.series.findUnique({ where: { name: dto.series } });
//                     if (!existingSeries) {
//                         existingSeries = await tx.series.create({ data: { name: dto.series, code: dto.series.replace(/\s+/g, '-').toLowerCase() } });
//                     }
//                     return { connect: { id: existingSeries.id } };
//                 })()
//                 : undefined;

//             const comicType = await tx.comicType.findUnique({ where: { name: dto.type } });
//             if (!comicType) throw new Error(`ComicType "${dto.type}" not found`);

//             const language = await tx.language.findUnique({ where: { name: dto.language } });
//             if (!language) throw new Error(`Language "${dto.language}" not found`);

//             const category = await tx.category.findUnique({ where: { name: dto.category } });
//             if (!category) throw new Error(`Category "${dto.category}" not found`);

//             const comicStatus = await tx.comicStatus.findUnique({ where: { name: dto.status } });
//             if (!comicStatus) throw new Error(`ComicStatus "${dto.status}" not found`);

//             await tx.workMetadata.update({
//                 where: { id: existingComic.workMetadataId },
//                 data: {
//                     description: dto.description,
//                     // Disconnect all current authors and connect new ones
//                     authors: {
//                         set: parsedAuthors.map(author => ({ id: author.id }))
//                     },
//                     characters: {
//                         set: parsedCharacters.map(char => ({ id: char.id }))
//                     },
//                     series: parsedSeries,
//                     taggings: {
//                         deleteMany: {}, // Delete all existing taggings
//                         create: parsedTags.map(tag => ({
//                             tag: { connect: { id: tag.id } }
//                         }))
//                     },
//                     // Update publisher (group) if mapped
//                 },
//             });

//             // Update Comic
//             await tx.comic.update({
//                 where: { workMetadataId: parseInt(id) },
//                 data: {
//                     publishedTime: dto.releaseDate ? new Date(dto.releaseDate) : undefined,
//                     aiGenerated: dto.ai_generated,
//                     comicType: { connect: { id: comicType.id } },
//                 },
//             });

//             // Update WorkContent
//             await tx.workContent.update({
//                 where: { workId: existingComic.comicContent.workContent.workId },
//                 data: {
//                     language: { connect: { id: language.id } },
//                     category: { connect: { id: category.id } },
//                 },
//             });

//             // Update ComicContent
//             await tx.comicContent.update({
//                 where: { workContentId: existingComic.comicContent.workContentId },
//                 data: {
//                     comicStatus: { connect: { id: comicStatus.id } },
//                     cover: dto.cover ? parseInt(dto.cover) : undefined,
//                     pageCount: dto.pageCount ? parseInt(dto.pageCount) : undefined,
//                 },
//             });

//             // Re-linking/updating image files is more complex and depends on the specific
//             // workflow (e.g., if imageFiles array is a full replacement or incremental).
//             // For now, this part is omitted. A separate endpoint might be better for image management.

//             return existingComic;
//         });

//         res.json(result);
//     } catch (error) {
//         console.error(`Error updating comic with ID ${id}:`, error);
//         res.status(500).json({ error: error.message || 'Internal server error' });
//     }
// });

// // DELETE /api/v1/comics/:id - Delete a comic
// router.delete('/:id', async (req, res) => {
//     const { id } = req.params; // workMetadataId

//     try {
//         await prisma.$transaction(async (tx) => {
//             const comicToDelete = await tx.comic.findUnique({
//                 where: { workMetadataId: parseInt(id) },
//                 include: {
//                     workMetadata: { include: { resource: true } },
//                     comicContent: { include: { workContent: { include: { work: true } } } },
//                 },
//             });

//             if (!comicToDelete) {
//                 throw new Error('Comic not found');
//             }

//             const resourceId = comicToDelete.workMetadata.resource.id;
//             const workId = comicToDelete.comicContent.workContent.work.id;
//             const workContentId = comicToDelete.comicContent.workContentId;
//             const workMetadataId = comicToDelete.workMetadata.id;

//             // Delete related File and Image entries (assuming they are children of Resource)
//             // This needs to be carefully handled to avoid deleting files shared by other resources.
//             // For this implementation, I'm assuming files are directly associated with this comic's resource.
//             const filesToDelete = await tx.file.findMany({
//                 where: { resourceId: resourceId },
//                 select: { id: true }
//             });

//             if (filesToDelete.length > 0) {
//                 await tx.image.deleteMany({
//                     where: {
//                         fileId: { in: filesToDelete.map(f => f.id) }
//                     }
//                 });
//                 await tx.file.deleteMany({
//                     where: { resourceId: resourceId }
//                 });
//             }

//             // Delete Taggings associated with this workMetadata
//             await tx.tagging.deleteMany({
//                 where: { resourceId: resourceId } // Taggings are on Resource level
//             });


//             // Delete ComicContent, WorkContent, Comic, Work, WorkMetadata, Resource
//             await tx.comic.delete({ where: { workMetadataId: parseInt(id) } });
//             await tx.comicContent.delete({ where: { workContentId: workContentId } });
//             await tx.workContent.delete({ where: { workId: workId } });
//             await tx.work.delete({ where: { id: workId } });
//             await tx.workMetadata.delete({ where: { id: workMetadataId } });
//             await tx.resource.delete({ where: { id: resourceId } });
//         });

//         res.status(204).send(); // No Content
//     } catch (error) {
//         console.error(`Error deleting comic with ID ${id}:`, error);
//         res.status(500).json({ error: error.message || 'Internal server error' });
//     }
// });

// export default router;