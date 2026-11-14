import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { DEFAULT_LANGUAGE, type LanguageTag, type LocalizedString, type LocalizedStringList } from '@shared/type/i18n';

import type { AdminNews, CreateNewsRequest, UpdateNewsRequest } from '../model/admin.types';
import { slugify } from './slugify';

const localizedStringSchema = z.record(z.string());
const localizedListSchema = z.record(z.array(z.string()));
const formSchema = z.object({
    category: z.string().min(1),
    coverImage: z.string().refine(value => !value || /^https?:\/\/[^\s]+$/i.test(value)),
    coverAlt: localizedStringSchema,
    slug: z.string().refine(value => !value || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)),
    tags: z.string(),
    authorName: z.string(),
    source: z.string(),
    readTime: z.number().int().min(1).max(120),
    isExclusive: z.boolean(),
    isFeatured: z.boolean(),
    title: localizedStringSchema.refine(value => Boolean(value[DEFAULT_LANGUAGE]?.trim())),
    subtitle: localizedStringSchema,
    excerpt: localizedStringSchema,
    content: localizedListSchema,
    seoTitle: localizedStringSchema.refine(value => Object.values(value).every(text => text.length <= 70)),
    seoDescription: localizedStringSchema.refine(value => Object.values(value).every(text => text.length <= 170)),
    seoKeywords: localizedListSchema,
});

type NewsFormValues = z.infer<typeof formSchema>;

const splitContent = (text: string): string[] => text.split('\n\n').map(value => value.trim()).filter(Boolean);

const initialValues = (news?: AdminNews | null): NewsFormValues => ({
    category: news?.category ?? 'Principais',
    coverImage: news?.coverImage ?? '',
    coverAlt: news?.coverAlt ?? {},
    slug: news?.slug ?? '',
    tags: (news?.tags ?? []).join(', '),
    authorName: news?.authorName ?? '',
    source: news?.source ?? '',
    readTime: news?.readTime ?? 3,
    isExclusive: news?.isExclusive ?? false,
    isFeatured: news?.isFeatured ?? false,
    title: news?.title ?? {},
    subtitle: news?.subtitle ?? {},
    excerpt: news?.excerpt ?? {},
    content: news?.content ?? {},
    seoTitle: news?.seoTitle ?? {},
    seoDescription: news?.seoDescription ?? {},
    seoKeywords: news?.seoKeywords ?? {},
});

const useNewsFormModalState = (
    news: AdminNews | null | undefined,
    isOpen: boolean,
    onSubmit: (data: CreateNewsRequest | UpdateNewsRequest) => void,
) => {
    const [contentTab, setContentTab] = useState<LanguageTag>(DEFAULT_LANGUAGE);
    const form = useForm<NewsFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: initialValues(news),
        mode: 'onChange',
    });

    useEffect(() => {
        if (!isOpen) return;
        form.reset(initialValues(news));
        setContentTab(DEFAULT_LANGUAGE);
    }, [form, isOpen, news]);

    const values = form.watch();
    const setField = <K extends keyof NewsFormValues>(field: K) => (value: NewsFormValues[K]) =>
        form.setValue(field, value as never, { shouldDirty: true, shouldValidate: true });

    const handleSubmit = form.handleSubmit(data => {
        const ptTitle = data.title[DEFAULT_LANGUAGE].trim();
        const payload: CreateNewsRequest = {
            title: data.title,
            category: data.category,
            readTime: data.readTime,
            isExclusive: data.isExclusive,
            isFeatured: data.isFeatured,
            slug: data.slug || slugify(ptTitle),
            ...(Object.keys(data.subtitle).length ? { subtitle: data.subtitle } : {}),
            ...(Object.keys(data.excerpt).length ? { excerpt: data.excerpt } : {}),
            ...(Object.keys(data.content).length ? { content: data.content } : {}),
            ...(data.coverImage ? { coverImage: data.coverImage } : {}),
            ...(Object.keys(data.coverAlt).length ? { coverAlt: data.coverAlt } : {}),
            ...(Object.keys(data.seoTitle).length ? { seoTitle: data.seoTitle } : {}),
            ...(Object.keys(data.seoDescription).length ? { seoDescription: data.seoDescription } : {}),
            ...(Object.keys(data.seoKeywords).length ? { seoKeywords: data.seoKeywords } : {}),
            ...(data.tags ? { tags: data.tags.split(',').map(value => value.trim()).filter(Boolean) } : {}),
            ...(data.authorName ? { authorName: data.authorName } : {}),
            ...(data.source ? { source: data.source } : {}),
        };
        onSubmit(payload);
    });

    return {
        category: values.category, setCategory: setField('category'),
        coverImage: values.coverImage, setCoverImage: setField('coverImage'),
        coverAlt: values.coverAlt as LocalizedString, setCoverAlt: setField('coverAlt'),
        slug: values.slug, setSlug: setField('slug'),
        tags: values.tags, setTags: setField('tags'),
        authorName: values.authorName, setAuthorName: setField('authorName'),
        source: values.source, setSource: setField('source'),
        readTime: values.readTime, setReadTime: setField('readTime'),
        isExclusive: values.isExclusive, setIsExclusive: setField('isExclusive'),
        isFeatured: values.isFeatured, setIsFeatured: setField('isFeatured'),
        title: values.title as LocalizedString, setTitle: setField('title'),
        subtitle: values.subtitle as LocalizedString, setSubtitle: setField('subtitle'),
        excerpt: values.excerpt as LocalizedString, setExcerpt: setField('excerpt'),
        content: values.content as LocalizedStringList,
        seoTitle: values.seoTitle as LocalizedString, setSeoTitle: setField('seoTitle'),
        seoDescription: values.seoDescription as LocalizedString, setSeoDescription: setField('seoDescription'),
        seoKeywords: values.seoKeywords as LocalizedStringList, setSeoKeywords: setField('seoKeywords'),
        contentTab, setContentTab,
        ptTitle: values.title[DEFAULT_LANGUAGE]?.trim() ?? '',
        dirty: form.formState.isDirty,
        valid: form.formState.isValid,
        coverImageInvalid: Boolean(form.formState.errors.coverImage),
        slugInvalid: Boolean(form.formState.errors.slug),
        handleSubmit,
        handleContentChange: (value: string) => form.setValue(
            'content', { ...values.content, [contentTab]: splitContent(value) },
            { shouldDirty: true, shouldValidate: true },
        ),
    };
};

export default useNewsFormModalState;
