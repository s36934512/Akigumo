import { MeiliSearch } from 'meilisearch';

const client = new MeiliSearch({ host: 'http://meilisearch:7700', apiKey: 'masterKey123' });

export { client };