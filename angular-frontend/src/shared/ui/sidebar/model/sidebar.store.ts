import { computed, InjectionToken, inject } from "@angular/core";
import {
	patchState,
	signalStore,
	withComputed,
	withMethods,
	withState,
} from "@ngrx/signals";

export interface ISidebarState {
	reversed: boolean;
	pinned: boolean;
	collapsed: boolean;
	expanded: boolean;

	controlPanelStyles: Record<string, string>;
	buttonStyles: Record<string, string>;

	baseWidth: string;
	pinnedCollapseWidth: string;
	unpinnedCollapseWidth: string;
	expandedWidth: string;
	controlPanelWidth: string;
}

// 1. 定義一個預設的初始值
const DEFAULT_SIDEBAR_STATE: ISidebarState = {
	reversed: false,
	pinned: true,
	collapsed: false,
	expanded: false,

	baseWidth: "16rem",
	pinnedCollapseWidth: "4.5rem",
	unpinnedCollapseWidth: "0px",
	expandedWidth: "20rem",
	controlPanelWidth: "2rem",

	controlPanelStyles: {},
	buttonStyles: {},
};

// 2. 建立一個 InjectionToken 供外部覆蓋初始值
export const SIDEBAR_INITIAL_STATE = new InjectionToken<Partial<ISidebarState>>(
	"SIDEBAR_INITIAL_STATE",
	{ factory: () => ({}) },
);

export const SidebarStore = signalStore(
	withState<ISidebarState>(() => {
		const initialState = inject(SIDEBAR_INITIAL_STATE);
		return {
			...DEFAULT_SIDEBAR_STATE,
			...initialState,
		};
	}),

	withComputed((store) => ({
		requireOverlay: computed(() => !store.collapsed() && !store.pinned()),
		width: computed(() => {
			let width = store.baseWidth();
			if (store.collapsed()) {
				if (store.pinned()) {
					width = store.pinnedCollapseWidth();
				} else {
					width = store.unpinnedCollapseWidth();
				}
			}

			return width;
		}),
		totalWidth: computed(() => {
			let width = store.baseWidth();
			if (store.collapsed()) {
				if (store.pinned()) {
					width = store.pinnedCollapseWidth();
				} else {
					width = store.unpinnedCollapseWidth();
				}
			}

			return `calc(${width} + ${store.controlPanelWidth()})`;
		}),
		mode: computed(() => {
			if (!store.collapsed() && !store.pinned()) {
				return "over";
			}

			return "side";
		}),
	})),

	withMethods((store) => ({
		updateState(partialState: Partial<ISidebarState>) {
			patchState(store, partialState);
		},

		setPinned(pinned: boolean) {
			patchState(store, { pinned });
		},
		setCollapsed(collapsed: boolean) {
			patchState(store, { collapsed });
		},
		setExpanded(expanded: boolean) {
			patchState(store, { expanded });
		},

		togglePinned() {
			patchState(store, { pinned: !store.pinned() });
		},
		toggleCollapsed() {
			patchState(store, { collapsed: !store.collapsed() });
		},
		toggleExpanded() {
			patchState(store, { expanded: !store.expanded() });
		},

		close() {
			if (!store.pinned()) {
				patchState(store, { collapsed: true, expanded: false });
			}
		},
	})),
);
