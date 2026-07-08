import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import { useDirtyTracker } from '@shared/hook/useDirtyTracker';
import { chapterAdminGateway, validateChapterInput, type ChapterStatus, type ChapterValidationError, type CreateChapterRequest } from '@entities/chapter';

import useAdminChapterActions from './useAdminChapterActions';

type ChapterFormState = {
    titleId: string;
    title: string;
    number: string;
    displayOrder: string;
    description: string;
    status: Extract<ChapterStatus, 'draft' | 'scheduled' | 'published'>;
    scheduledAt: string;
};

const DEFAULT_FORM: ChapterFormState = {
    titleId: '',
    title: '',
    number: '',
    displayOrder: '',
    description: '',
    status: 'draft',
    scheduledAt: '',
};

/**
 * Estado do formulário de capítulo em MODAL (padrão useTitleFormModalState).
 * Pré-valida com as MESMAS funções puras que o gateway executa — o feedback
 * inline e a rejeição do "servidor" nunca divergem.
 */
const useChapterFormModalState = (chapterId: string | null, isOpen: boolean, presetTitleId?: string) => {
    const isEditing = Boolean(chapterId);
    const { handleCreate, handleUpdate, isSubmitting } = useAdminChapterActions();

    const { data: existing, isLoading: isLoadingDetail } = useQuery({
        queryKey: [QUERY_KEYS.ADMIN_CHAPTER_DETAIL, chapterId],
        queryFn: () => chapterAdminGateway.getById(chapterId!),
        enabled: isEditing && isOpen,
    });

    const [form, setForm] = useState<ChapterFormState>(DEFAULT_FORM);

    const { dirty, reset: resetDirty } = useDirtyTracker(isOpen, form);

    // Números dos irmãos, para validar duplicidade inline (mesma regra do gateway).
    const { data: siblings } = useQuery({
        queryKey: [QUERY_KEYS.ADMIN_CHAPTERS, 'siblings', form.titleId],
        queryFn: () => chapterAdminGateway.list({ page: 0, size: 500, titleId: form.titleId }),
        enabled: isOpen && !!form.titleId,
    });

    useEffect(() => {
        if (!isOpen) return;
        if (!isEditing) {
            setForm({ ...DEFAULT_FORM, titleId: presetTitleId ?? '' });
            resetDirty();
        }
    }, [isOpen, isEditing, presetTitleId, resetDirty]);

    useEffect(() => {
        if (existing) {
            setForm({
                titleId: existing.titleId,
                title: existing.title,
                number: existing.number,
                displayOrder: String(existing.displayOrder),
                description: existing.description ?? '',
                status: existing.status === 'scheduled' ? 'scheduled' : existing.status === 'published' ? 'published' : 'draft',
                scheduledAt: existing.scheduledAt ?? '',
            });
            resetDirty();
        }
    }, [existing, resetDirty]);

    const request: CreateChapterRequest = useMemo(
        () => ({
            titleId: form.titleId,
            title: form.title,
            number: form.number,
            displayOrder: form.displayOrder ? Number(form.displayOrder) : undefined,
            description: form.description || undefined,
            status: form.status,
            // datetime-local não tem timezone — normaliza para ISO completo (o
            // fake compara strings ISO na lazy promotion).
            scheduledAt: form.scheduledAt && !Number.isNaN(Date.parse(form.scheduledAt)) ? new Date(form.scheduledAt).toISOString() : undefined,
        }),
        [form],
    );

    const errors: ChapterValidationError[] = useMemo(() => {
        // Form intocado (título e número vazios) não exibe erros — com
        // presetTitleId o titleId já vem preenchido e não conta como "toque".
        if (!form.title.trim() && !form.number.trim()) return [];
        const siblingNumbers = (siblings?.content ?? []).filter(c => c.id !== chapterId).map(c => c.number);
        return validateChapterInput(request, siblingNumbers);
    }, [request, siblings, form.title, form.number, chapterId]);

    /** Nome da obra selecionada (denormalizado nos capítulos irmãos). */
    const titleName = existing?.titleName ?? siblings?.content[0]?.titleName;

    const valid = form.titleId.trim().length > 0 && form.title.trim().length > 0 && form.number.trim().length > 0 && errors.length === 0;

    const submit = async (): Promise<boolean> => {
        if (!valid) return false;
        const result = isEditing && chapterId ? await handleUpdate(chapterId, request) : await handleCreate(request);
        return Boolean(result);
    };

    return {
        isEditing,
        isLoadingDetail,
        isSubmitting,
        form,
        setForm,
        errors,
        valid,
        dirty,
        titleName,
        submit,
    };
};

export default useChapterFormModalState;
