// import express from 'express';
// import { prisma } from '../../../prisma/lib/prisma.js';

// const router = express.Router();

// // GET /api/v1/authors - Get all authors
// router.get('/authors', async (req, res) => {
//     try {
//         const authors = await prisma.author.findMany({
//             select: { id: true, name: true, code: true },
//             orderBy: { name: 'asc' }
//         });
//         res.json(authors);
//     } catch (error) {
//         console.error('Error fetching authors:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });

// // GET /api/v1/characters - Get all characters
// router.get('/characters', async (req, res) => {
//     try {
//         const characters = await prisma.character.findMany({
//             select: { id: true, name: true, code: true },
//             orderBy: { name: 'asc' }
//         });
//         res.json(characters);
//     } catch (error) {
//         console.error('Error fetching characters:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });

// // GET /api/v1/series - Get all series
// router.get('/series', async (req, res) => {
//     try {
//         const series = await prisma.series.findMany({
//             select: { id: true, name: true, code: true },
//             orderBy: { name: 'asc' }
//         });
//         res.json(series);
//     } catch (error) {
//         console.error('Error fetching series:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });

// // GET /api/v1/languages - Get all languages
// router.get('/languages', async (req, res) => {
//     try {
//         const languages = await prisma.language.findMany({
//             select: { id: true, name: true, code: true },
//             orderBy: { name: 'asc' }
//         });
//         res.json(languages);
//     } catch (error) {
//         console.error('Error fetching languages:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });

// // GET /api/v1/categories - Get all categories
// router.get('/categories', async (req, res) => {
//     try {
//         const categories = await prisma.category.findMany({
//             select: { id: true, name: true },
//             orderBy: { name: 'asc' }
//         });
//         res.json(categories);
//     } catch (error) {
//         console.error('Error fetching categories:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });

// // GET /api/v1/tags - Get all tags (with optional search)
// router.get('/tags', async (req, res) => {
//     const { search } = req.query;
//     try {
//         const tags = await prisma.tag.findMany({
//             where: search ? { name: { contains: search, mode: 'insensitive' } } : {},
//             select: { id: true, name: true, code: true },
//             orderBy: { name: 'asc' }
//         });
//         res.json(tags);
//     } catch (error) {
//         console.error('Error fetching tags:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });

// // GET /api/v1/comic-types - Get all comic types
// router.get('/comic-types', async (req, res) => {
//     try {
//         const comicTypes = await prisma.comicType.findMany({
//             select: { id: true, name: true, code: true },
//             orderBy: { name: 'asc' }
//         });
//         res.json(comicTypes);
//     } catch (error) {
//         console.error('Error fetching comic types:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });

// // GET /api/v1/comic-statuses - Get all comic statuses
// router.get('/comic-statuses', async (req, res) => {
//     try {
//         const comicStatuses = await prisma.comicStatus.findMany({
//             select: { id: true, name: true, code: true },
//             orderBy: { name: 'asc' }
//         });
//         res.json(comicStatuses);
//     } catch (error) {
//         console.error('Error fetching comic statuses:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });

// export default router;