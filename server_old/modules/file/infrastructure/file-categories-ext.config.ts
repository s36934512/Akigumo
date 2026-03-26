// 根據 prisma/models/file.prisma 定義的 TypeScript 檔案分類與副檔名設定
// 可擴充、型別安全，方便直接用於程式邏輯

export interface FileExtensionConfig {
    code: string; // 例如: "jpg"
    name?: string; // 例如: "JPEG 圖片"
    description?: string;
}

export interface FileCategoryConfig {
    code: string; // 例如: "IMAGE"
    name: string; // 例如: "圖片"
    description?: string;
    extensions: FileExtensionConfig[];
}

export const FILE_CATEGORIES_EXT: FileCategoryConfig[] = [
    {
        code: 'OTHER',
        name: '其他',
        description: '未分類或未知格式',
        extensions: [
            { code: 'bin', name: '二進位檔案' },
            { code: 'dat', name: '資料檔案' },
            { code: 'raw', name: '原始檔案' },
        ],
    },
    {
        code: 'IMAGE',
        name: '圖片',
        description: '常見圖片格式',
        extensions: [
            { code: 'jpg', name: 'JPEG', description: '常見壓縮圖片' },
            { code: 'jpeg', name: 'JPEG', description: '常見壓縮圖片' },
            { code: 'png', name: 'PNG', description: '無損壓縮圖片' },
            { code: 'gif', name: 'GIF', description: '動態圖片' },
            { code: 'webp', name: 'WebP', description: '現代壓縮圖片' },
            { code: 'svg', name: 'SVG', description: '向量圖' },
        ],
    },
    {
        code: 'DOCUMENT',
        name: '文件',
        description: '常見文件格式',
        extensions: [
            { code: 'pdf', name: 'PDF' },
            { code: 'doc', name: 'Word' },
            { code: 'docx', name: 'Word (新版)' },
            { code: 'xls', name: 'Excel' },
            { code: 'xlsx', name: 'Excel (新版)' },
            { code: 'txt', name: '純文字' },
            { code: 'csv', name: 'CSV' },
        ],
    },
    {
        code: 'VIDEO',
        name: '影片',
        description: '常見影片格式',
        extensions: [
            { code: 'mp4', name: 'MP4' },
            { code: 'mov', name: 'MOV' },
            { code: 'avi', name: 'AVI' },
            { code: 'mkv', name: 'MKV' },
        ],
    },
    {
        code: 'AUDIO',
        name: '音訊',
        description: '常見音訊格式',
        extensions: [
            { code: 'mp3', name: 'MP3' },
            { code: 'wav', name: 'WAV' },
            { code: 'ogg', name: 'OGG' },
        ],
    },
    // ...可依需求擴充
];
