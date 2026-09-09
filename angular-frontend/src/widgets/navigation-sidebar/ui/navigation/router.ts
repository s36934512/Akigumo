export interface NavItem {
	label: string;
	routerLink: string;
	icon: string;
	type: string;
	position: "top" | "bottom";
}

export const MENU: NavItem[] = [
	{
		label: "全部漫畫",
		routerLink: "/explorer",
		icon: "dashboard",
		type: "normal",
		position: "top",
	},
	{
		label: "待整理",
		routerLink: "/unsorted",
		icon: "dashboard",
		type: "pending",
		position: "top",
	},
	{
		label: "檔案櫃",
		routerLink: "/cabinet",
		icon: "dashboard",
		type: "normal",
		position: "top",
	},
	{
		label: "垃圾桶",
		routerLink: "/trash",
		icon: "delete",
		type: "normal",
		position: "top",
	},
	{
		label: "統計與紀錄",
		routerLink: "/statistics",
		icon: "dashboard",
		type: "normal",
		position: "top",
	},
	{
		label: "標籤管理",
		routerLink: "/ontology",
		icon: "tag",
		type: "normal",
		position: "top",
	},
	{
		label: "設定",
		routerLink: "/settings",
		icon: "settings",
		type: "normal",
		position: "bottom",
	},
];
