import paths from '../core/paths.js';
import fs from 'fs';
import sharp from 'sharp';

const DEFAULT_IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];

/**
 * 批次將多個圖片轉為 webp
 * @param {string[]} imagePaths - 圖片完整路徑陣列
 * @returns {Promise<string[]>} - 轉換後 webp 路徑陣列
 */
async function convertImagesToWebp(imagePaths, outputDirPath = null, imageExts = DEFAULT_IMAGE_EXTS) {
    const webpPaths = [];
    for (const imagePath of imagePaths) {
        const webpPath = await convertImageToWebp(imagePath, outputDirPath, imageExts);
        webpPaths.push(webpPath);
    }
    return webpPaths;
}

/**
 * 將單一圖片轉為 webp
 * @param {string} imagePath - 圖片完整路徑
 * @returns {Promise<string>} - 轉換後 webp 路徑
 */
async function convertImageToWebp(imagePath, outputDirPath = null, imageExts = DEFAULT_IMAGE_EXTS) {
    if (!fs.existsSync(imagePath)) {
        throw new Error('Image file does not exist: ' + imagePath);
    }

    const _imageExts = imageExts.map(ext => ext.toLowerCase());
    const ext = paths.extname(imagePath);
    if (!_imageExts.includes(ext)) {
        throw new Error('Unsupported image format: ' + ext);
    }

    const _webpPath = paths.changeExt(outputDirPath ? paths.changeDir(imagePath, outputDirPath) : imagePath, '.webp');
    if (!fs.existsSync(paths.dirname(_webpPath))) {
        fs.mkdirSync(paths.dirname(_webpPath), { recursive: true });
    }

    if (ext !== '.webp') {
        await sharp(imagePath).toFile(_webpPath);
    } else {
        fs.copyFileSync(imagePath, _webpPath);
    }

    return _webpPath;
}

export default {
    convertImagesToWebp,
    convertImageToWebp,
};