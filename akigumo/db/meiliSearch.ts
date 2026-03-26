import { MeiliSearch } from 'meilisearch';
import 'dotenv/config';

export const meili = new MeiliSearch({
    host: process.env.MEILI_HOST || 'http://meilisearch:7700',
    apiKey: process.env.MEILI_MASTER_KEY || 'masterKey',
});

/**
 * MeiliSearch index name for item documents.
 * Centralized here so processors and API handlers stay consistent.
 */
export const ITEMS_INDEX = 'items';
