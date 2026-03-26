// import { hc } from 'hono/client';
// // import { UIItem } from '@schemas/item.schema'; // 直接引用後端的型別定義檔案
// import { Injectable } from '@angular/core';
// // import { AppType } from '@index'; // 引入後端定義的 AppType

// @Injectable({ providedIn: 'root' })
// export class ItemService {
//     private client = hc<AppType>('http://localhost:3000');

//     // 這裡的返回型別直接用共享的 Zod Type
//     // async fetchItems(): Promise<UIItem[]> {
//     //     const res = await this.client.api.v1.items.$get();
//     //     return res.ok ? await res.json() : [];
//     // }
// }