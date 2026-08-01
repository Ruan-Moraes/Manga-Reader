import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import { DEFAULT_LANGUAGE, type LocalizedString } from '@shared/type/i18n';
import { useDirtyTracker } from '@shared/hook/useDirtyTracker';
import { useDomainLabels, LABEL_TYPES } from '@entities/label';
import { useTagsFetch, type Tag } from '@entities/catalog-filter';

import { getAdminTitleDetail } from '../api/adminTitleService';
import { getAdminStores } from '../api/adminStoreService';
import useAdminTitleActions from './useAdminTitleActions';
import type { CreateTitleRequest, TitleAuthorRef, TitlePublisherRef } from './admin.types';
import type { TitleStoreRef } from './admin.types';

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
    const { data: availableStoresPage } = useQuery({ queryKey: [QUERY_KEYS.ADMIN_STORES, 'title-form'], queryFn: () => getAdminStores(0, 100) });
    const availableStores = availableStoresPage?.content ?? [];

    const [form, setForm] = useState<FormState>(DEFAULT_FORM);
    const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
    const [name, setName] = useState<LocalizedString>({});
    const [synopsis, setSynopsis] = useState<LocalizedString>({});
    const [authors, setAuthors] = useState<TitleAuthorRef[]>([]);
    const [publishers, setPublishers] = useState<TitlePublisherRef[]>([]);
    const [stores, setStores] = useState<TitleStoreRef[]>([]);
    const [aliases, setAliases] = useState('');

    const { dirty, reset: resetDirty } = useDirtyTracker(isOpen, { form, selectedTags, name, synopsis, authors, publishers, stores, aliases });

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
            setStores([]);
            setAliases('');
            resetDirty();
        }
    }, [isOpen, isEditing, resetDirty]);

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
            setStores(existing.stores ?? []);
            setAliases(existing.aliases?.map(alias => `${alias.type}|${alias.locale ?? ''}|${alias.name}`).join('\n') ?? '');
            resetDirty();
        }
    }, [existing, allTags, resetDirty]);

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
            stores: stores.map(store => ({ storeId: store.storeId, url: store.url })),
            aliases: aliases
                .split('\n')
                .map(line => line.trim())
                .filter(Boolean)
                .slice(0, 20)
                .map(line => {
                    const [candidateType, candidateLocale, ...nameParts] = line.split('|');
                    const type = candidateType === 'SYNONYM' ? 'SYNONYM' : 'ALTERNATE';
                    const aliasName = nameParts.length > 0 ? nameParts.join('|').trim() : candidateLocale?.trim() || candidateType;
                    const locale = nameParts.length > 0 ? candidateLocale.trim() || undefined : undefined;
                    return { name: aliasName.slice(0, 255), type, locale };
                }),
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
        stores,
        setStores,
        aliases,
        setAliases,
        availableStores,
        allTags,
        statusOptions,
        valid,
        dirty,
        submit,
    };
};

export default useTitleFormModalState;
