/**
 * @file Action bundle barrel for file-integration workflow
 *
 * Importing this file is the single side-effect that registers all processor
 * handlers with the kernel registry. Order matters only if bundles have
 * cross-dependencies; these are independent so order is alphabetical.
 */

import './init-recursive';
import './integration-notify.ts';
import './seal';
import './sync.ts';
import './transcode';
import './uncompress';
