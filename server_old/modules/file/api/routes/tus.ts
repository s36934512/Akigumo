import { Server, EVENTS, Upload } from '@tus/server';
import { FileStore } from '@tus/file-store';
import Paths from '@core/paths';
import { container } from '@server/ioc';
import FileUploadOrchestrator from '@server/orchestrators/file/file-upload.orchestrator';
import { DiskGuard } from '@server/shared/utils/disk-guard.utils';
import { ContextService } from '@server/core/context/context.service';

const tusServer = new Server({
    path: '/api/v1/tus/files',
    datastore: new FileStore({
        directory: Paths.TMP_TUS
    }),
    relativeLocation: true
});

// 1. 監聽上傳建立
tusServer.on(EVENTS.POST_CREATE, async (req, upload: Upload) => {
    const ctx = ContextService.getContext();
    console.log('[TUS POST_CREATE] New upload created:', upload, 'Context:', ctx);

    const fileUploadOrchestrator = container.resolve('fileUploadOrchestrator');
    await fileUploadOrchestrator.initUpload(upload);

    return;
});

// 2. 監聽完成事件 (使用 async/await 代替回調)
tusServer.on(EVENTS.POST_FINISH, async (req, res, upload: Upload) => {
    const authorization = req.headers.get('Authorization') || "019c1d69-84c4-7349-94e4-7086aa735867";

    console.log('[TUS POST_FINISH] Upload finished:', upload.id, 'Filename:', upload.metadata?.filename);
    const fileUploadOrchestrator = container.resolve('fileUploadOrchestrator') as FileUploadOrchestrator;

    // ContextService.setContext({ userId: '019c6bdc-e277-7caf-b595-30c19a3ab8ab', sessionId: authorization }, async () => {
    //     fileUploadOrchestrator.handleUpload(upload);
    // });
});

export default tusServer;


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