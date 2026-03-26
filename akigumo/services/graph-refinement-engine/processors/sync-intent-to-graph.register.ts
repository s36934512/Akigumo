/**
 * @file Registration entry for FILE_RECEIVER_ACTIONS.SYNC_INTENT_TO_GRAPH handled by Graph Refinement Engine.
 */

import { defineActions } from 'akigumo/shared/contracts';
import { registerWorkflowProcessor } from 'akigumo/shared/utils';
import { ActionCategory, Severity } from 'generated/prisma/enums';

import { syncIntentToGraphWithEngine } from './sync-intent-to-graph.processor';
import { SyncIntentToGraphPayloadSchema } from './sync-intent-to-graph.schema';

const FILE_GRAPH_ENGINE_BRIDGE_ACTIONS = defineActions({
    SYNC_INTENT_TO_GRAPH: {
        code: 'INTENT_SYNC_TO_GRAPH',
        name: '同步意圖到圖資料庫',
        category: ActionCategory.DATA_OP,
        severity: Severity.LOW,
    },
});

registerWorkflowProcessor(
    'FILE',
    FILE_GRAPH_ENGINE_BRIDGE_ACTIONS.SYNC_INTENT_TO_GRAPH,
    SyncIntentToGraphPayloadSchema,
    syncIntentToGraphWithEngine,
);
