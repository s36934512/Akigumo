// 根據 prisma/models/user_and_auth.prisma 定義的 TypeScript 使用者角色與權限設定
// 可擴充、型別安全，方便直接用於程式邏輯

export interface UserDefaultConfig {
    name: string;
}

export const USER_DEFAULT: UserDefaultConfig[] = [
    {
        name: "秋雲(あきぐも)",
    },
    {
        name: "一般用戶",
    },
    {
        name: "訪客",
    },
];
