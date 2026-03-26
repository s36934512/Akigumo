/**
 * @file Registers the FILE_TRANSCODE processor with the kernel registry.
 */

import { registerFileProcessor } from 'akigumo/modules/file/common/registry.helper';

import { transcodeFile } from './service';
import { TranscodePayloadSchema } from './schema';
import { FILE_INTEGRATION_ACTIONS } from '../../../contract';


registerFileProcessor(
    FILE_INTEGRATION_ACTIONS.TRANSCODE,
    TranscodePayloadSchema,
    transcodeFile,
);
