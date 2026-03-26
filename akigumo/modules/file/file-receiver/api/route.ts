/**
 * File Creation API Routes
 * 
 * Defines the OpenAPI route specifications for the Tus resumable upload workflow.
 * This module exports the HTTP route definitions that handle:
 * 1. Intent creation - Initializing uploads with metadata validation
 * 2. Seal finalization - Confirming upload completion and state transitions
 * 
 * Why we use defined routes:
 * - Provides clear contract for client-server communication
 * - Enables automatic API documentation generation
 * - Separates route definition from implementation logic (controller pattern)
 */

import { createRoute } from '@hono/zod-openapi';
import { z } from '@hono/zod-openapi';
import { ResponseSchema } from 'akigumo/shared/schemas/api.schema';

import { TusIntentInputSchema } from '../core';

const TusIntentResponseSchema = ResponseSchema;
const TusSealResponseSchema = ResponseSchema;

const TusSealRequestSchema = z.object({
    fileId: z.uuid().openapi({
        example: '019ce974-70b1-7b43-9be1-79e9579f7b12'
    }),
    checksum: z.string().openapi({
        example: 'd3c617d9527eb9c0c6297e60319aef64c022059a47dfbfdef92ab45464720016'
    }),
    fileName: z.string().openapi({
        example: 'HApnFc4bcAAA77i.jpg'
    }),
});


/**
 * Tus Intent Route
 * 
 * Creates a file intent before actual upload begins.
 * This step establishes the initial file record and temporary state, allowing us to track uploads
 * with a correlation ID and validate file metadata early without blocking the upload process.
 */
export const tusIntentRoute = createRoute({
    method: 'post',
    path: '/file/tus-intent',
    summary: '建立 Tus 上傳意圖',
    description: '在 Tus 正式開始前先建立檔案意圖與暫存狀態。',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: TusIntentInputSchema
                }
            }
        }
    },
    responses: {
        201: {
            content: {
                'application/json': {
                    schema: TusIntentResponseSchema
                }
            },
            description: '成功建立上傳意圖'
        },
        400: {
            description: '請求格式錯誤'
        }
    }
});


/**
 * Tus Seal Route
 * 
 * Finalizes an upload after all chunks have been transferred.
 * This endpoint confirms the upload completion, verifies the file integrity via checksum,
 * updates file status to finalized, and triggers downstream synchronization workflows.
 */
export const tusSealRoute = createRoute({
    method: 'post',
    path: '/file/tus-seal',
    summary: 'Tus 上傳最終確認',
    description: '上傳完成後進行最終確認，更新檔案狀態並觸發後續同步。',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: TusSealRequestSchema
                }
            }
        }
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: TusSealResponseSchema
                }
            },
            description: '上傳確認完成'
        },
        404: {
            description: '找不到對應的上傳意圖'
        }
    }
});
