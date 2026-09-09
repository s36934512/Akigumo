import { computed, Injectable, signal } from "@angular/core";

export interface InfoItemData {
	keyId: string;
	valueId: string[];
}

export interface inputComponent {
	id: string;
	value: InfoItemData;
}

@Injectable()
export class InfoItemStore {
	private registry = signal<Record<string, InfoItemData>>({});

	// 提供一個唯讀的 Signal 給父元件訂閱，自動轉回陣列格式
	readonly allData = computed(() =>
		Object.entries(this.registry()).map(([id, value]) => ({ id, value })),
	);

	// 讓子元件回報、更新資料
	updateValue(id: string, value: InfoItemData) {
		this.registry.update((current) => ({
			...current,
			[id]: value,
		}));
	}

	// 當子元件被銷毀時，移除該筆資料
	unregister(id: string) {
		this.registry.update((current) => {
			const copy = { ...current };
			delete copy[id];
			return copy;
		});
	}
}
