import { FileStore } from "@tus/file-store";
import { EVENTS, Server, Upload } from "@tus/server";
import { tusHookRegistry } from "./tus-hook.registry";
import Paths from "../paths";

export const tusServer = new Server({
    path: '/api/v1/tus/files',
    datastore: new FileStore({
        directory: Paths.TMP_TUS,
    }),
    relativeLocation: true
});

tusServer.on(EVENTS.POST_CREATE, async (req, upload: Upload) => {
    // const type = upload.metadata?.type; // 前端帶上的業務類型
    const processors = tusHookRegistry.getProcessors(EVENTS.POST_CREATE, 'create');

    // TODO: 要能終止流程並回錯誤給前端
    for (const processor of processors) {
        await processor(upload);
    }
});

tusServer.on(EVENTS.POST_FINISH, async (req, res, upload: Upload) => {
    const processors = tusHookRegistry.getProcessors(EVENTS.POST_FINISH, 'complete');

    if (processors.length > 0) {
        await Promise.all(processors.map(processor => processor(upload)));
    }

    return;
});