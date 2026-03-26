import { createActor } from 'xstate';
import { createFileMachine } from './create-file.machine';
import { CreateFileInput } from './create-file.schema';

import './create-file.sync';
import './audit.sync';
import './create-file.process';
import { tusHookRegistry } from '@server/core/upload/tus-hook.registry';
import { EVENTS, Upload } from '@tus/server';
import { waitForState } from '@server/core/utils/xstate-helpers';
import { fileMachineRegistry } from './create-file.manager.';
import { Context, Next } from 'hono';
import { createFileIntent } from './create-file.service';
import { file } from 'zod';

export async function createFileOrchestrator(fileData: CreateFileInput) {
    const actor = createActor(createFileMachine, {
        input: { ...fileData }
    });
    actor.subscribe((state) => {
        console.log('目前狀態:', state.value);

        if (state.status === 'done') {
            console.log('流程結束，正在釋放資源...');
            actor.stop();
        }
    });
    actor.start();
    console.log('=== [createFileOrchestrator] ===', fileData);
    return actor;
}

// 註冊：建立檔案的起手式
// tusHookRegistry.register(EVENTS.POST_CREATE, 'create', async (upload: Upload) => {
//     console.log(`[Tus:Create] 收到新的上傳請求，ID: ${upload.id}, Metadata:`, upload.metadata);
//     const { userId, filetype, filename, mangaId, checksum } = upload.metadata || {};

//     const actor = fileMachineRegistry.getOrCreate(upload.id, {
//         fileName: filename || 'Unnamed File',
//         size: BigInt(upload.size || 0),
//         mimeType: filetype || 'application/octet-stream',
//     });

//     // 4. 重要：等待狀態機確認 DB 寫好了，才准 Tus 開始收檔案
//     // 這樣可以避免「檔案傳完了，DB 卻還沒建好」的 Race Condition
//     await waitForState(actor, 'uploading');

//     console.log(`[Tus:Create] File ${actor.getSnapshot().context.fileName} is ready for upload.`);
// });

// 註冊：上傳完成後的對接
tusHookRegistry.register(EVENTS.POST_FINISH, 'complete', async (upload: Upload) => {
    console.log(`[Tus:Complete] 上傳完成，ID: ${upload.id}, Metadata:`, upload.metadata);
    const actor = fileMachineRegistry.get(upload.id);

    if (actor) {
        // 告知狀態機：檔案已在硬碟
        actor.send({ type: 'UPLOAD_COMPLETE' });
    }
});

export const createFileIntentHandler = async (c: Context) => {
    const input: CreateFileInput = {
        fileName: "example.zip",
        size: BigInt(76224084),
        checksum: "example-checksum",
        metadata: { example: "metadata" },
    }
    const { fileId, itemId } = await createFileIntent(input);

    const actor = fileMachineRegistry.getOrCreate(fileId, {
        fileName: input.fileName || 'Unnamed File',
        size: BigInt(input.size || 0),
        mimeType: input.metadata?.filetype || 'application/octet-stream',
    });

    return c.json({ fileId, uploadUrl: '/files' });
}

/* Upload {
  id: '6e970a3f245e25877c780e4e8bceece0',
  metadata: {
    name: '[ノラネコノタマ (雪野みなと)] となり町の色模様 ノラネコノタマ総集編 [中国翻訳] [DL版].zip',
    type: 'application/x-zip-compressed',
    filetype: 'application/x-zip-compressed',
    filename: '[ノラネコノタマ (雪野みなと)] となり町の色模様 ノラネコノタマ総集編 [中国翻訳] [DL版].zip'
  },
  size: 76224084,
  offset: 76224084,
  creation_date: '2026-01-09T02:36:49.030Z',
  storage: {
    type: 'file',
    path: '/workspaces/kpptrproject/tmp/tus-uploads/6e970a3f245e25877c780e4e8bceece0'
  }
} */