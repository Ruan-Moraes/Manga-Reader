import { useEffect, useState } from 'react';

import { DEFAULT_LANGUAGE, type LanguageTag, type LocalizedString, type LocalizedStringList } from '@shared/type/i18n';

import type { AdminNews, CreateNewsRequest, UpdateNewsRequest } from '../model/admin.types';

const splitContent = (text: string): string[] =>
    text
        .split('\n\n')
        .map(s => s.trim())
        .filter(Boolean);

const useNewsFormModalState = (news: AdminNews | null | undefined, isOpen: boolean, onSubmit: (data: CreateNewsRequest | UpdateNewsRequest) => void) => {
    const [category, setCategory] = useState<string>('Principais');
    const [coverImage, setCoverImage] = useState('');
    const [tags, setTags] = useState('');
    const [authorName, setAuthorName] = useState('');
    const [source, setSource] = useState('');
    const [readTime, setReadTime] = useState(3);
    const [isExclusive, setIsExclusive] = useState(false);
    const [isFeatured, setIsFeatured] = useState(false);

    const [title, setTitle] = useState<LocalizedString>({});
    const [subtitle, setSubtitle] = useState<LocalizedString>({});
    const [excerpt, setExcerpt] = useState<LocalizedString>({});
    const [content, setContent] = useState<LocalizedStringList>({});
    const [contentTab, setContentTab] = useState<LanguageTag>(DEFAULT_LANGUAGE);

    useEffect(() => {
        if (news) {
            setCategory(news.category);
            setCoverImage(news.coverImage ?? '');
            setTags((news.tags ?? []).join(', '));
            setAuthorName(news.authorName ?? '');
            setSource(news.source ?? '');
            setReadTime(news.readTime);
            setIsExclusive(news.isExclusive);
            setIsFeatured(news.isFeatured);
            setTitle(news.title ?? {});
            setSubtitle(news.subtitle ?? {});
            setExcerpt(news.excerpt ?? {});
            setContent(news.content ?? {});
        } else {
            setCategory('Principais');
            setCoverImage('');
            setTags('');
            setAuthorName('');
            setSource('');
            setReadTime(3);
            setIsExclusive(false);
            setIsFeatured(false);
            setTitle({});
            setSubtitle({});
            setExcerpt({});
            setContent({});
        }
        setContentTab(DEFAULT_LANGUAGE);
    }, [news, isOpen]);

    const ptTitle = (title[DEFAULT_LANGUAGE] ?? '').trim();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!ptTitle) return;

        const payload: CreateNewsRequest = {
            title,
            category,
            readTime,
            isExclusive,
            isFeatured,
            ...(Object.keys(subtitle).length ? { subtitle } : {}),
            ...(Object.keys(excerpt).length ? { excerpt } : {}),
            ...(Object.keys(content).length ? { content } : {}),
            ...(coverImage ? { coverImage } : {}),
            ...(tags
                ? {
                      tags: tags
                          .split(',')
                          .map(s => s.trim())
                          .filter(Boolean),
                  }
                : {}),
            ...(authorName ? { authorName } : {}),
            ...(source ? { source } : {}),
        };

        onSubmit(payload);
    };

    const handleContentChange = (value: string) => setContent({ ...content, [contentTab]: splitContent(value) });

    return {
        category,
        setCategory,
        coverImage,
        setCoverImage,
        tags,
        setTags,
        authorName,
        setAuthorName,
        source,
        setSource,
        readTime,
        setReadTime,
        isExclusive,
        setIsExclusive,
        isFeatured,
        setIsFeatured,
        title,
        setTitle,
        subtitle,
        setSubtitle,
        excerpt,
        setExcerpt,
        content,
        contentTab,
        setContentTab,
        ptTitle,
        handleSubmit,
        handleContentChange,
    };
};

export default useNewsFormModalState;
