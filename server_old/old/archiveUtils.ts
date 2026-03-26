
import { spawn } from 'child_process';
import { fileTypeFromFile, FileTypeResult } from 'file-type';
import Paths from '@core/paths';
import * as tar from 'tar';


export interface ArchiveUtils {
    isArchiveFile(filename: string): Promise<boolean>;
    extract(archivePath: string, destDir: string): Promise<string>;
    createTar(dirPath: string, files?: string[]): Promise<string>;
}

const archiveUtils: ArchiveUtils = {
    async isArchiveFile(filename: string): Promise<boolean> {
        const archiveExts = ['zip', 'rar'];
        const type: FileTypeResult | undefined = await fileTypeFromFile(filename);
        return !!type && archiveExts.includes(type.ext);
    },

    async extract(archivePath: string, destDir: string): Promise<string> {
        if (!await archiveUtils.isArchiveFile(archivePath)) {
            throw new Error('請上傳壓縮檔（zip/rar）');
        }
        const scriptPath = Paths.concat('UTILS_PY', 'extract_archive.py');
        return new Promise((resolve, reject) => {
            const child = spawn('python', [scriptPath, archivePath, destDir]);
            let stdout = '';
            let stderr = '';
            child.stdout.on('data', (data: Buffer) => { stdout += data.toString('utf-8'); });
            child.stderr.on('data', (data: Buffer) => { stderr += data.toString('utf-8'); });
            child.on('error', (err) => reject(err));
            child.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(stderr || `Process exited with code ${code}`));
                } else {
                    resolve(stdout);
                }
            });
        });
    },

    async createTar(dirPath: string, files: string[] = []): Promise<string> {
        const tarPath = Paths.concat(dirPath + '.tar');
        const _files = files.length > 0 ? files : [Paths.basename(dirPath)];
        await tar.c({ cwd: Paths.dirname(dirPath), file: tarPath }, _files);
        return tarPath;
    }
};

export default archiveUtils;
