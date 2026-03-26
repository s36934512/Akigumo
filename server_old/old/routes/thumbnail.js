import express from 'express';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// 動態產生縮圖
// GET /thumbnail?src=相對路徑&width=寬&height=高
router.get('/', async (req, res) => {
    const { src, width = 180, height = 240 } = req.query;
    console.log('Thumbnail request:', req.query);
    if (!src) return res.status(400).send('src required');

    let decodedSrc;
    try {
        decodedSrc = decodeURIComponent(src);
    } catch (e) {
        return res.status(400).send('invalid src encoding');
    }

    let realSrc = decodedSrc;
    // 僅允許特定目錄，避免路徑穿越
    if (decodedSrc.startsWith('/uploads/extracted/')) {
        realSrc = path.join('tmp', decodedSrc);
    }

    const absPath = path.resolve(process.cwd(), realSrc);
    if (!absPath.startsWith(process.cwd())) {
        return res.status(400).send('invalid path');
    }
    if (!fs.existsSync(absPath)) return res.status(404).send('file not found');

    let w = parseInt(width, 10);
    let h = parseInt(height, 10);
    if (isNaN(w) || w <= 0) w = 180;
    if (isNaN(h) || h <= 0) h = 240;

    try {
        res.type('image/webp');
        await sharp(absPath)
            .resize(w, h, { fit: 'inside' })
            .webp({ quality: 100 })
            .pipe(res);
    } catch (e) {
        console.error('thumbnail error:', e);
        res.status(500).send('thumbnail error');
    }
});

export default router;
