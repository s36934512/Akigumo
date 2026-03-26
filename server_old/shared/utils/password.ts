import * as argon2 from "argon2";

// TODO
export async function hashPassword(password: string): Promise<string> {
    // 這裡使用 argon2 來加密密碼
    const hash = await argon2.hash(password);
    return hash;
}