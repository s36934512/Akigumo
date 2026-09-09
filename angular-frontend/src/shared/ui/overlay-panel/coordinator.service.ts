import { Injectable } from "@angular/core";
import type { ActorRef } from "xstate";

@Injectable({
	providedIn: "root",
})
export class OverlayCoordinatorService {
	// 記錄當前正在「開啟」或「準備開啟」的那個狀態機
	private activeActor: ActorRef<any, any> | null = null;

	registerAndOpen(currentActor: ActorRef<any, any>) {
		// 🌟 核心邏輯：如果新來的人跟原本的人不同，強制讓原本的人關閉
		if (this.activeActor && this.activeActor !== currentActor) {
			this.activeActor.send({ type: "FORCE_CLOSE" }); // 或是自訂的 'FORCE_CLOSE' 事件
		}

		// 登記目前主導畫面的人是誰
		this.activeActor = currentActor;
		this.activeActor.send({ type: "MOUSE_ENTER" });
	}

	deregister(currentActor: ActorRef<any, any>) {
		if (this.activeActor === currentActor) {
			this.activeActor = null;
		}
	}
}
