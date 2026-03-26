import { FileStore } from "@tus/file-store";
import { EVENTS, Server, Upload } from "@tus/server";
import Paths from "akigumo/kernel/paths";

import { tusHookRegistry } from "./tus-hook.registry";

export const tusServer = new Server({
    path: '/api/v1/tus/files',
    namingFunction: (req) => {
        const metadataStr = req.headers.get('upload-metadata') || 'error';
        const pairs = metadataStr.split(',').map(p => p.trim().split(' '));
        const metadata = Object.fromEntries(
            pairs.map(([k, v]) => [k, v ? Buffer.from(v, 'base64').toString() : ''])
        );

        return metadata.fileId || crypto.randomUUID();
    },
    datastore: new FileStore({
        directory: Paths.TMP_TUS,
    }),
    relativeLocation: true
});

tusServer.on(EVENTS.POST_FINISH, async (req, res, upload: Upload) => {
    const processors = tusHookRegistry.getProcessors(EVENTS.POST_FINISH, 'complete');

    if (processors.length > 0) {
        await Promise.all(processors.map(processor => processor(upload)));
    }

    return;
});