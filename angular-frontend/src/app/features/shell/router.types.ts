export interface NavItem {
    label: string,
    routerLink: string,
    icon: string,
    type: string,
}

export const MENU: NavItem[] = [
    {
        label: '全部漫畫',
        routerLink: '/content-explorer',
        icon: 'dashboard',
        type: 'normal'
    },
    {
        label: '待整理',
        routerLink: '/unsorted',
        icon: 'dashboard',
        type: 'pending'
    },
    {
        label: '檔案櫃',
        routerLink: '/cabinet',
        icon: 'dashboard',
        type: 'normal'
    },
    {
        label: '垃圾桶',
        routerLink: '/trash',
        icon: 'dashboard',
        type: 'normal'
    },
    {
        label: '統計與紀錄',
        routerLink: '/statistics',
        icon: 'dashboard',
        type: 'normal'
    },
    {
        label: '設定',
        routerLink: '/settings',
        icon: 'dashboard',
        type: 'normal'
    },
    {
        label: '測試',
        routerLink: '/test',
        icon: 'dashboard',
        type: 'normal'
    },
];