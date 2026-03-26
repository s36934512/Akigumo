/**
 * @file Processor for FILE_INTEGRATION_NOTIFY action
 *
 * This processor is a passthrough: the receiver workflow reads the status
 * from the outbox result directly, so no transformation is needed here.
 */

import { FILE_ACTIONS } from 'akigumo/modules/file/common/contract';
import { registerFileProcessor } from 'akigumo/modules/file/common/registry.helper';

import { ReceiverNotifyPayloadSchema } from '../../machine/schema';

registerFileProcessor(
    FILE_ACTIONS.INTEGRATION_NOTIFY,
    ReceiverNotifyPayloadSchema,
    async (data) => data,
);
