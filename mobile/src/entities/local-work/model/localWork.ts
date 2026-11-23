export interface LocalWork {
    id: string;
    name: string;
    coverFilename: string | null;
    createdAt: number;
    updatedAt: number;
}

export interface LocalWorkChapter {
    projectId: string;
    workId: string;
    label: string;
    createdAt: number;
    updatedAt: number;
}
