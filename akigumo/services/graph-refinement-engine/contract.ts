/**
 * @file Contracts for dispatching file graph refinement tasks.
 *
 * Keep identifiers stable so outbox producers and processors route consistently.
 */

import { createEventCodes } from 'akigumo/shared/contracts/event-codes.helper';
import { ActionCategory, Severity } from 'generated/prisma/enums';

export const GRAPH_REFINEMENT_ENGINE_AGGREGATE = 'GRAPH_REFINEMENT_ENGINE' as const;

export const GRAPH_REFINEMENT_ENGINE_ACTIONS = {
    DISPATCH_GRAPH_TASK: {
        code: 'DISPATCH_GRAPH_TASK',
        name: '派送檔案圖譜整理任務',
        category: ActionCategory.DATA_OP,
        severity: Severity.LOW,
    },
} as const;

export const GraphRefinementEngineEventCode = createEventCodes(GRAPH_REFINEMENT_ENGINE_ACTIONS);

export type GraphRefinementEngineActionCode =
    typeof GRAPH_REFINEMENT_ENGINE_ACTIONS[keyof typeof GRAPH_REFINEMENT_ENGINE_ACTIONS]['code'];
