/**
 * @file Registers the FILE_UNCOMPRESS processor with the kernel registry.
 */

import { registerFileProcessor } from 'akigumo/modules/file/common/registry.helper';

import { uncompressFile } from './service';
import { UncompressPayloadSchema } from './schema';
import { FILE_INTEGRATION_ACTIONS } from '../../../contract';

registerFileProcessor(
    FILE_INTEGRATION_ACTIONS.UNCOMPRESS,
    UncompressPayloadSchema,
    uncompressFile,
);
