import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import { DEFAULT_LANGUAGE, type LocalizedString } from '@shared/type/i18n';
import { useDomainLabels, LABEL_TYPES } from '@entities/label';
import { useTagsFetch, type Tag } from '@entities/catalog-filter';

import { getAdminTitleDetail } from '../api/adminTitleService';
import useAdminTitleActions from './useAdminTitleActions';
import type { CreateTitleRequest, TitleAuthorRef, TitlePublisherRef } from './admin.types';

type FormState = {
    type: string;
    cover: string;
    genres: string[];
    status: string;
    adult: boolean;
};

const DEFAULT_FORM: FormState = {
    type: 'manga',
    cover: '',
    genres: [],
    status: '',
    adult: false,
};

/** Estado do formulário de título para uso em MODAL (sem acoplamento a rota). */
const useTitleFormModalState = (titleId: string | null, isOpen: boolean) => {
    const isEditing = Boolean(titleId);
    const { handleCreate, handleUpdate, isSubmitting } = useAdminTitleActions();

    const { data: existing, isLoading: isLoadingDetail } = useQuery({
        queryKey: [QUERY_KEYS.ADMIN_TITLE_DETAIL, titleId],
        queryFn: () => getAdminTitleDetail(titleId!),
        enabled: isEditing && isOpen,
    });

    const { data: statusOptions = [] } = useDomainLabels(LABEL_TYPES.PUBLICATION_STATUS);
    const { data: allTags = [] } = useTagsFetch();

    const [form, setForm] = useState<FormState>(DEFAULT_FORM);
    const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
    const [name, setName] = useState<LocalizedString>({});
    const [synopsis, setSynopsis] = useState<LocalizedString>({});
    const [authors, setAuthors] = useState<TitleAuthorRef[]>([]);
    const [publishers, setPublishers] = useState<TitlePublisherRef[]>([]);

    // Reset ao abrir para criação; preenche ao carregar detalhe na edição.
    useEffect(() => {
        if (!isOpen) return;
        if (!isEditing) {
            setForm(DEFAULT_FORM);
            setSelectedTags([]);
            setName({});
            setSynopsis({});
            setAuthors([]);
            setPublishers([]);
        }
    }, [isOpen, isEditing]);

    useEffect(() => {
        if (existing) {
            setForm({
                type: existing.type,
                cover: existing.cover ?? '',
                genres: existing.genres,
                status: existing.status ?? '',
                adult: existing.adult,
            });
            const matched = existing.genres.map(g => allTags.find(tag => tag.slug === g)).filter((tag): tag is Tag => tag !== undefined);
            setSelectedTags(matched);
            setName(existing.name ?? {});
            setSynopsis(existing.synopsis ?? {});
            setAuthors(existing.authors ?? []);
            setPublishers(existing.publishers ?? []);
        }
    }, [existing, allTags]);

    const valid = (name[DEFAULT_LANGUAGE] ?? '').trim().length > 0;

    const submit = async (): Promise<boolean> => {
        if (!valid) return false;

        const data: CreateTitleRequest = {
            ...form,
            name,
            ...(Object.keys(synopsis).length ? { synopsis } : {}),
            genres: selectedTags.map(tag => tag.slug),
            authors: authors.map(a => ({ authorId: a.authorId, role: a.role })),
            publishers: publishers.map(p => p.id),
        };

        const result = isEditing && titleId ? await handleUpdate(titleId, data) : await handleCreate(data);
        return Boolean(result);
    };

    return {
        isEditing,
        isLoadingDetail,
        isSubmitting,
        form,
        setForm,
        selectedTags,
        setSelectedTags,
        name,
        setName,
        synopsis,
        setSynopsis,
        authors,
        setAuthors,
        publishers,
        setPublishers,
        allTags,
        statusOptions,
        valid,
        submit,
    };
};

export default useTitleFormModalState;
