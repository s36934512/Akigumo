import { BaseImageViewModel, ImageDTO, ImageWithSizeViewModel } from "./image.types";

export interface PageItem {
  id: number;
  url: string;
  thumbnail: string;
  selected: boolean;
}

export interface EditInfo {
  title: string;
  author: string;
  group: string;
  type: string;
  language: string;
  series: string;
  category: string;
  characters: string;
  tags: string;
  status: string;
  releaseDate: string;
  isPublic: boolean;
  description: string;
  editorNote: string;
  ai_generated: boolean;
}

export interface ComicFile {
  id: string;
  coverUrl: string;
  pages: ImageWithSizeViewModel[];
  editInfo: EditInfo;
}


export interface SortableComicFile extends ComicFile {
  serialNumber: number;
  selected: boolean;
}



export interface UploadFile {
  id: string;
  name: string;
  progress: number;
  size: string;
  previewUrl?: string;
  pages?: PageItem[];
  editInfo?: EditInfo;
}

export interface ComicFileDTO {
  comic_id: string;
  cover_path: string;
  imageFiles: ImageDTO[];
  title: string;
  author: string[];
  group: string;
  type: string;
  language: string;
  series: string;
  category: string;
  characters: string[];
  tags: string[];
  status: string;
  releaseDate: string;
  isPublic: boolean;
  description: string;
  editorNote: string;
  ai_generated: boolean;
}


export const INITIAL_PAGE_ITEM: PageItem = {
  id: 0,
  url: '',
  thumbnail: '',
  selected: false
}

export const INITIAL_EDIT_INFO: EditInfo = {
  title: '',
  author: '',
  group: '',
  type: '',
  language: '',
  series: '',
  category: '',
  characters: '',
  tags: '',
  status: '',
  releaseDate: '',
  isPublic: false,
  description: '',
  editorNote: '',
  ai_generated: false
};

export const INITIAL_COMICFILE: ComicFile = {
  id: '',
  coverUrl: '',
  pages: [],
  editInfo: INITIAL_EDIT_INFO
}

export const INITIAL_UPLOAD_FILE: UploadFile = {
  id: '',
  name: '',
  progress: 0,
  size: '',
  previewUrl: '',
  pages: [],
  editInfo: INITIAL_EDIT_INFO
}

export const INITIAL_SORTABLE_COMIC_FILE: SortableComicFile = {
  serialNumber: 0,
  id: '',
  selected: false,
  coverUrl: '',
  pages: [],
  editInfo: INITIAL_EDIT_INFO
}

export const INITIAL_COMICFILEDTO: ComicFileDTO = {
  comic_id: '',
  cover_path: '',
  imageFiles: [],
  title: '',
  author: [],
  group: '',
  type: '',
  language: '',
  series: '',
  category: '',
  characters: [],
  tags: [],
  status: '',
  releaseDate: '',
  isPublic: false,
  description: '',
  editorNote: '',
  ai_generated: false
}

//     {
//       comic_id: 1,
//       title: '(C99) [らいげきたい (河内和泉)] あさしおちゃんききいっぱつ (艦隊これくしょん -艦これ-)',
//       author: [Array],
//       group: 'らいげきたい',
//       type: '同人誌',
//       language: '日文',
//       series: '艦隊これくしょん -艦これ-',
//       category: 'R-18',
//       characters: [],
//       tags: [Array],
//       description: '',
//       file_path: '/workspaces/kpptrproject/tmp/uploads/(C99) [らいげきたい (河内和泉)] あさしおちゃんききいっぱつ (艦隊これくしょん -艦これ-).zip',
//       cover_path: '/uploads/extracted/mFUdnTIZS/01.webp',
//       page_count: 18,
//       created_date: '2025-12-01T14:50:57.502Z',
//       upload_date: '2025-12-01T14:50:57.502Z',
//       status: 'active',
//       imageFiles: [Array]
//     }

