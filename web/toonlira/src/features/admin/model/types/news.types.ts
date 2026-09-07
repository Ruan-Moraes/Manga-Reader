import type { LocalizedString, LocalizedStringList } from '@shared/type/i18n';
import type { NewsStatus } from '@entities/news';

export type AdminNews = {
    id: string;
    slug?: string;
    title: LocalizedString;
    subtitle: LocalizedString;
    excerpt: LocalizedString;
    content: LocalizedStringList;
    coverImage: string | null;
    coverAlt?: LocalizedString;
    category: string;
    tags: string[];
    authorName: string | null;
    source: string | null;
    readTime: number;
    views: number;
    isExclusive: boolean;
    isFeatured: boolean;
    status?: NewsStatus;
    createdAt?: string;
    publishedAt: string | null;
    scheduledAt?: string | null;
    updatedAt: string | null;
    seoTitle?: LocalizedString;
    seoDescription?: LocalizedString;
    seoKeywords?: LocalizedStringList;
};

export type CreateNewsRequest = {
    title: LocalizedString;
    category: string;
    slug?: string;
    subtitle?: LocalizedString;
    excerpt?: LocalizedString;
    content?: LocalizedStringList;
    coverImage?: string;
    coverAlt?: LocalizedString;
    tags?: string[];
    authorName?: string;
    authorAvatar?: string;
    source?: string;
    readTime: number;
    isExclusive: boolean;
    isFeatured: boolean;
    seoTitle?: LocalizedString;
    seoDescription?: LocalizedString;
    seoKeywords?: LocalizedStringList;
};

export type UpdateNewsRequest = Partial<CreateNewsRequest>;
