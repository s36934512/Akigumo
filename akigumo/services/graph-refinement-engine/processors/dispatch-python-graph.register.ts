/**
 * @file Registration entry for DISPATCH_PYTHON_GRAPH_TASK processor.
 */

import { GRAPH_REFINEMENT_ENGINE_ACTIONS } from '../contract';
import { registerGraphRefinementEngineProcessor } from '../registry.helper';
import { DispatchGraphTaskPayloadSchema } from '../schema';
import { dispatchPythonGraphTask } from './dispatch-python-graph.processor';

registerGraphRefinementEngineProcessor(
    GRAPH_REFINEMENT_ENGINE_ACTIONS.DISPATCH_GRAPH_TASK,
    DispatchGraphTaskPayloadSchema,
    dispatchPythonGraphTask,
);
