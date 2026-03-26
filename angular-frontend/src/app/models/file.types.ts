import { ComicFileDTO } from "./comic.types";

export interface FolderInfo {
    name: string;
    size: string;
    createdAt: string;
    updatedAt: string;
    accessedAt: string;
    owner: string;
    attributes: {
        [key: string]: any;
    };
    tags: string[];
}

export interface FileInfo extends FolderInfo {
    ext: string;
    type: 'pdf' | 'excel' | 'image' | 'word';
}

export interface FileItem {
    serialNumber: number;
    type: 'file' | 'folder' | 'comic';
    url: string;
    info: FolderInfo | FileInfo | ComicFileDTO;
}

export interface FileDTO {
    files: FileItem[];
    nextCursor: number;
}

export interface PartialFileInfo {
    i: number; // serial number
    r: string; // rank
    n: string; // name
    t: string; // type
    p: number | null; // pages
    s: string | null; // size
    cAt: string; // createdAt
    uAt: string; // updatedAt
}