/**
 * @file Core layer exports for file-integration module
 *
 * Barrel export for processors and queries. Importing this module as a side-effect
 * registers all processor handlers with the kernel registry.
 *
 * Order matters only if processors have cross-dependencies; these are independent
 * so listed alphabetically by operation.
 */

import './processors/init-recursive';
import './processors/integration-notify.ts';
import './processors/seal';
import './processors/sync.ts';
import './processors/transcode';
import './processors/uncompress';

export * from './processors/seal/service';
export * from './processors/transcode/service';
export * from './processors/uncompress/service';
export * from './processors/init-recursive/service';
