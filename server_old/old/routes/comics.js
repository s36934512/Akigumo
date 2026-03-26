import express from 'express';
import { pool } from '../core/infrastructure/postgres.js';
import { client } from '../core/infrastructure/meiliSearch.js';
import path from 'path';
const router = express.Router();

import { getComicsWithImages } from './comic-utils.js';
// 漫畫搜尋 API
router.get('/search', async (req, res) => {
    const keyword = req.query.keyword;
    if (!keyword || keyword.trim() === '') {
        return res.status(400).json({ error: '缺少搜尋關鍵字' });
    }
    try {
        // 只用 Meilisearch 搜尋
        const result = await client.index('comics').search(keyword, {
            filter: 'status = "active"'
        });
        res.json({ comics: result.hits });
    } catch (err) {
        res.status(500).json({ error: '搜尋失敗', detail: err.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const comicsWithImages = await getComicsWithImages('active');
        res.json({
            comics: comicsWithImages,
        });
    } catch (err) {
        res.status(500).json({ error: '查詢失敗', detail: err.message });
    }
});


// 取得單一漫畫詳細資料
router.get('/:fileId', async (req, res) => {
    const fileId = req.params.fileId;
    try {
        const result = await pool.query(`
            SELECT f.id as file_id, f.file_path, f.status, cm.*
            FROM files f
            JOIN comic_metadata cm ON f.id = cm.file_id
            WHERE f.id = $1
        `, [fileId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: '找不到漫畫' });
        }
        const comic = result.rows[0];
        // 查詢所有圖片檔名
        const imgResult = await pool.query('SELECT file_name FROM comic_page WHERE file_id = $1 ORDER BY page_number ASC', [fileId]);
        comic.imageFiles = imgResult.rows.map(row => row.file_name);
        res.json({ comic });
    } catch (err) {
        res.status(500).json({ error: '查詢失敗', detail: err.message });
    }
});

// 更新單一漫畫資料
router.put('/:fileId', async (req, res) => {
    const fileId = req.params.fileId;
    const updateData = req.body;

    const comicMetadataFields = ['title', 'author', 'group', 'type', 'language', 'series', 'category', 'characters', 'tags', 'description', 'ai_generated', 'cover_path', 'page_count'];
    const fileFields = ['file_path', 'status'];

    const comicSetClauses = [];
    const comicValues = [];
    let comicIdx = 1;

    const fileSetClauses = [];
    const fileValues = [];
    let fileIdx = 1;

    for (const key of comicMetadataFields) {
        if (updateData[key] !== undefined) {
            comicSetClauses.push(`${key === 'group' ? '"group"' : key} = $${comicIdx}`);
            comicValues.push(updateData[key]);
            comicIdx++;
        }
    }

    for (const key of fileFields) {
        if (updateData[key] !== undefined) {
            fileSetClauses.push(`${key} = $${fileIdx}`);
            fileValues.push(updateData[key]);
            fileIdx++;
        }
    }

    try {
        if (comicSetClauses.length > 0) {
            comicValues.push(fileId);
            const sql = `UPDATE comic_metadata SET ${comicSetClauses.join(', ')} WHERE file_id = $${comicIdx} RETURNING *`;
            await pool.query(sql, comicValues);
        }

        if (fileSetClauses.length > 0) {
            fileValues.push(fileId);
            const sql = `UPDATE files SET ${fileSetClauses.join(', ')} WHERE id = $${fileIdx} RETURNING *`;
            await pool.query(sql, fileValues);
        }

        if (comicSetClauses.length === 0 && fileSetClauses.length === 0) {
            return res.status(400).json({ error: '沒有可更新的欄位' });
        }

        // 查詢更新後的完整資料並回傳
        const result = await pool.query(`
            SELECT f.id as file_id, f.file_path, f.status, cm.*
            FROM files f
            JOIN comic_metadata cm ON f.id = cm.file_id
            WHERE f.id = $1
        `, [fileId]);

        const comic = result.rows[0];
        const imgResult = await pool.query('SELECT file_name FROM comic_page WHERE file_id = $1 ORDER BY page_number ASC', [fileId]);
        comic.imageFiles = imgResult.rows.map(row => row.file_name);

        res.json({ comic });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: '更新失敗', detail: err.message });
    }
});

// 批量更新漫畫狀態（支援 PATCH，僅允許 status 欄位）
router.patch('/', async (req, res) => {
    const { ids, status } = req.body;
    if (!Array.isArray(ids) || !status) {
        return res.status(400).json({ error: '缺少 ids 或 status' });
    }
    const sql = `UPDATE files SET status = $1 WHERE id = ANY($2::int[]) RETURNING *`;
    try {
        const result = await pool.query(sql, [status, ids]);
        res.json({ success: true, updated: result.rows });
    } catch (err) {
        res.status(500).json({ error: '批量更新失敗', detail: err.message });
    }
});

export default router;

