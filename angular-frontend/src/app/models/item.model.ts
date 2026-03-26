// Data models for two-stage loading list

export interface ItemIndexResponse {
    totalCount: number;
    ids: string[];
}

export interface ItemDetail {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    isLoaded: boolean;
}
