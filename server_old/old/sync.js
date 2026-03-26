const { pool } = require('../core/infrastructure/postgres');
const { client } = require('../core/infrastructure/meiliSearch');
const nodejieba = require('nodejs-jieba');

async function sync() {
    const res = await pool.query(`
        SELECT f.id as file_id, f.status, cm.*
        FROM files f
        JOIN comic_metadata cm ON f.id = cm.file_id
    `);
    const documents = res.rows;

    // 將資料導入 Meilisearch
    const index = client.index('comics');

    const col = ['title', 'author', 'group', 'category', 'characters', 'tags', 'description'];
    for (document of documents) {
        for (const field of col) {
            if (document[field]) {
                let texts = [];
                if (Array.isArray(document[field])) {
                    texts = document[field];
                } else {
                    texts = [document[field]];
                }
                let allSegmented = [];
                for (const text of texts) {
                    const segmented = nodejieba.cutForSearch(text);
                    allSegmented = allSegmented.concat(segmented);
                }
                document[`${field}_segmented`] = allSegmented;
            } else {
                document[`${field}_segmented`] = [];
            }
        }
    }
    console.log('同步資料到 Meilisearch，數量:', documents[0]);
    const { updateId } = await index.addDocuments(documents);
    await index.updateSearchableAttributes(['title_segmented', 'author_segmented', 'group_segmented', 'category_segmented', 'characters_segmented', 'tags_segmented', 'description_segmented']);
    console.log('同步完成，updateId:', updateId);
    console.log('getRankingRules', await index.updateRankingRules(['proximity']));
    console.log('getRankingRules', await index.getRankingRules());
    console.log(await index.getSearchableAttributes());
    console.log('getEmbedders', await index.getEmbedders());
    console.log('search', await index.search('鹿島'));
}

export default { sync };
