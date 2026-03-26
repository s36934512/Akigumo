/**
 * @file Registration entry for SWITCH_PRIMARY_FILE processor.
 */

import { ITEM_FILE_SYNC_ACTIONS } from '../contract';
import { registerItemFileSyncProcessor } from '../registry.helper';
import { SwitchPrimaryFilePayloadSchema } from '../schema';
import { switchPrimaryFile } from './switch-primary.processor';

registerItemFileSyncProcessor(
    ITEM_FILE_SYNC_ACTIONS.SWITCH_PRIMARY_FILE,
    SwitchPrimaryFilePayloadSchema,
    switchPrimaryFile,
);
