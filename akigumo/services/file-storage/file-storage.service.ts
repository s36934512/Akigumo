import { existsSync } from 'node:fs';
import { readFile, writeFile, unlink, mkdir } from 'node:fs/promises';
import path from 'node:path';

/**
 * Centralized file storage operations for consistent handling across the system.
 * Manages file I/O, temporary storage, and permanent archives.
 */

const DEFAULT_STORAGE_ROOT = path.resolve(process.cwd(), 'storage');
const DEFAULT_ORIGINALS_DIR = path.join(DEFAULT_STORAGE_ROOT, 'originals');
const DEFAULT_THUMBNAILS_DIR = path.join(DEFAULT_STORAGE_ROOT, 'thumbnails');
const DEFAULT_TUS_RECORD_DIR = path.join(DEFAULT_STORAGE_ROOT, 'tus-record');

export const fileStorageService = {
    // --- Path Resolution ---
    getOriginalsDir(): string {
        return DEFAULT_ORIGINALS_DIR;
    },

    getThumbnailsDir(): string {
        return DEFAULT_THUMBNAILS_DIR;
    },

    getTusRecordDir(): string {
        return DEFAULT_TUS_RECORD_DIR;
    },

    // --- File Operations ---
    /**
     * Read file contents as buffer.
     * Throws if file does not exist.
     */
    async readFile(filePath: string): Promise<Buffer> {
        return await readFile(filePath);
    },

    /**
     * Write buffer to file.
     * Creates parent directories if needed.
     */
    async writeFile(filePath: string, data: Buffer | string): Promise<void> {
        const dir = path.dirname(filePath);
        if (!existsSync(dir)) {
            await mkdir(dir, { recursive: true });
        }
        await writeFile(filePath, data);
    },

    /**
     * Delete a file.
     * Silently succeeds if file does not exist (idempotent).
     */
    async deleteFile(filePath: string): Promise<void> {
        try {
            await unlink(filePath);
        } catch (error: any) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
    },

    /**
     * Check if file exists.
     */
    fileExists(filePath: string): boolean {
        return existsSync(filePath);
    },

    /**
     * Create directory if it doesn't exist.
     */
    async ensureDir(dirPath: string): Promise<void> {
        if (!existsSync(dirPath)) {
            await mkdir(dirPath, { recursive: true });
        }
    },
};
