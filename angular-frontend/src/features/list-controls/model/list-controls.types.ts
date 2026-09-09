export interface ListFilterState {
    searchQuery: string;
    category: string;
    selectedTags: string[];
    sortBy: 'name' | 'date' | 'size';
    sortOrder: 'asc' | 'desc';
}

export const initialFilterState: ListFilterState = {
    searchQuery: '',
    category: 'all',
    selectedTags: [],
    sortBy: 'date',
    sortOrder: 'desc'
};
