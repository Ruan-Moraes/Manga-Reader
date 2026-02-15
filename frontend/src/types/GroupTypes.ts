export type GroupTypes = {
    id: string;
    name: string;
    logo?: string;
    description: string;
    website?: string;
    discord?: string;
    totalTitles: number;
    foundedYear?: number;
    status: 'active' | 'inactive' | 'hiatus';
};