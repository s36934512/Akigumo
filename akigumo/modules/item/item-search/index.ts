export * from './api/handler';

// Side-effect import: registers ITEM_SEARCH_UPSERT processor with kernel registry
import './processors/upsert-index.processor';
