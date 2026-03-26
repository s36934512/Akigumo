import { pool } from '../core/infrastructure/postgres.js';
import path from 'path';
import { imageSizeFromFile } from 'image-size/fromFile';
const baseImageDir = '/workspaces/kpptrproject/tmp/';

async function getImageMeta(fileName) {
    try {
        const filePath = path.join(baseImageDir, fileName);
        const dimensions = await imageSizeFromFile(filePath);
        return { file_name: fileName, width: dimensions.width, height: dimensions.height };
    } catch (e) {
        return { file_name: fileName, width: null, height: null };
    }
}

async function getComicsWithImages(status = 'active') {
    const result = await pool.query(`
        SELECT
            f.id as file_id,
            f.file_path,
            f.status,
            cm.*
        FROM files f
        JOIN comic_metadata cm ON f.id = cm.file_id
        WHERE f.status = $1
        ORDER BY f.id DESC
    `, [status]);

    const fileIds = result.rows.map(c => c.file_id);
    let imageFilesMap = {};
    if (fileIds.length > 0) {
        const imgResult = await pool.query('SELECT file_id, file_name FROM comic_page WHERE file_id = ANY($1)', [fileIds]);
        const imageMetaPromises = imgResult.rows.map(async row => {
            if (!imageFilesMap[row.file_id]) imageFilesMap[row.file_id] = [];
            const meta = await getImageMeta(row.file_name);
            imageFilesMap[row.file_id].push(meta);
        });
        await Promise.all(imageMetaPromises);
    }
    return result.rows.map(comic => ({
        ...comic,
        imageFiles: imageFilesMap[comic.file_id] || []
    }));
}

export { getComicsWithImages, getImageMeta };
