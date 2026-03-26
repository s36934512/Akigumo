import crypto from 'crypto';
import { pipeline } from 'stream/promises';

import fs from 'fs-extra';

export async function calculateChecksum(filePath: string): Promise<string> {
    const hash = crypto.createHash('sha256');
    await pipeline(fs.createReadStream(filePath), hash);
    return hash.digest('hex');
}