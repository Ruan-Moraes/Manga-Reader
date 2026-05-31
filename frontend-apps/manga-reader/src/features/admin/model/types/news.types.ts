import type { LocalizedString, LocalizedStringList } from '@shared/type/i18n';

export type AdminNews = {
    id: string;
    title: LocalizedString;
    subtitle: LocalizedString;
    excerpt: LocalizedString;
    content: LocalizedStringList;
    coverImage: string | null;
    category: string;
    tags: string[];
    authorName: string | null;
    source: string | null;
    readTime: number;
    views: number;
    isExclusive: boolean;
    isFeatured: boolean;
    publishedAt: string;
    updatedAt: string | null;
};

export type CreateNewsRequest = {
    title: LocalizedString;
    category: string;
    subtitle?: LocalizedString;
    excerpt?: LocalizedString;
    content?: LocalizedStringList;
    coverImage?: string;
    tags?: string[];
    authorName?: string;
    authorAvatar?: string;
    source?: string;
    readTime: number;
    isExclusive: boolean;
    isFeatured: boolean;
};

export type UpdateNewsRequest = Partial<CreateNewsRequest>;
