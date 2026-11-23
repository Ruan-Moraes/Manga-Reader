import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { showErrorToast, showSuccessToast } from '@shared/service/util/toastService';
import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import {
    ChapterDomainError,
    chapterAdminGateway,
    type BulkResult,
    type ChapterStatus,
    type CreateChapterRequest,
    type UpdateChapterRequest,
} from '@entities/chapter';

/**
 * Ações administrativas de capítulos (padrão dos hooks admin: try/catch +
 * toast + invalidateQueries). Erros de domínio chegam como codes e são
 * traduzidos aqui — nunca no domínio.
 */
const useAdminChapterActions = () => {
    const { t } = useTranslation('admin');
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const invalidateChapters = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_CHAPTERS] });
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_CHAPTER_DETAIL] });
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_CHAPTER_PAGES] });
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.READER_PAGES] });
    }, [queryClient]);

    const errorMessage = useCallback(
        (error: unknown, fallbackKey: string): string => {
            if (error instanceof ChapterDomainError) {
                return t(`dashboard.chapters.errors.${error.violation.code}`, {
                    defaultValue: t(fallbackKey),
                    ...error.violation,
                });
            }
            return t(fallbackKey);
        },
        [t],
    );

    const run = useCallback(
        async <T>(action: () => Promise<T>, successKey: string, errorKey: string, onSuccess?: (result: T) => void): Promise<T | null> => {
            setIsSubmitting(true);
            try {
                const result = await action();
                // Ações em lote reportam resultado parcial; as demais, toast simples.
                if (onSuccess) onSuccess(result);
                else showSuccessToast(t(successKey));
                invalidateChapters();
                return result;
            } catch (error) {
                showErrorToast(errorMessage(error, errorKey));
                return null;
            } finally {
                setIsSubmitting(false);
            }
        },
        [errorMessage, invalidateChapters, t],
    );

    const handleCreate = useCallback(
        (data: CreateChapterRequest) => run(() => chapterAdminGateway.create(data), 'dashboard.chapters.toasts.created', 'dashboard.chapters.toasts.createError'),
        [run],
    );

    const handleUpdate = useCallback(
        (chapterId: string, data: UpdateChapterRequest) =>
            run(() => chapterAdminGateway.update(chapterId, data), 'dashboard.chapters.toasts.updated', 'dashboard.chapters.toasts.updateError'),
        [run],
    );

    const handleDuplicate = useCallback(
        (chapterId: string) => run(() => chapterAdminGateway.duplicate(chapterId), 'dashboard.chapters.toasts.duplicated', 'dashboard.chapters.toasts.duplicateError'),
        [run],
    );

    const handleDelete = useCallback(
        (chapterId: string) => run(() => chapterAdminGateway.softDelete(chapterId), 'dashboard.chapters.toasts.deleted', 'dashboard.chapters.toasts.deleteError'),
        [run],
    );

    const handleChangeStatus = useCallback(
        (chapterId: string, status: ChapterStatus, scheduledAt?: string) =>
            run(() => chapterAdminGateway.changeStatus(chapterId, status, { scheduledAt }), 'dashboard.chapters.toasts.statusChanged', 'dashboard.chapters.toasts.statusError'),
        [run],
    );

    const handleReorder = useCallback(
        (titleId: string, orderedIds: string[]) =>
            run(() => chapterAdminGateway.reorderChapters(titleId, orderedIds), 'dashboard.chapters.toasts.reordered', 'dashboard.chapters.toasts.reorderError'),
        [run],
    );

    /** Bulk: reporta resultado parcial (sucessos + falhas por item) num toast só. */
    const reportBulk = useCallback(
        (result: BulkResult | null, successKey: string) => {
            if (!result) return;
            if (result.failed.length === 0) {
                showSuccessToast(t(successKey, { count: result.succeeded.length }));
            } else {
                showErrorToast(t('dashboard.chapters.toasts.bulkPartial', { ok: result.succeeded.length, failed: result.failed.length }));
            }
        },
        [t],
    );

    const handleBulkChangeStatus = useCallback(
        (ids: string[], status: ChapterStatus): Promise<BulkResult | null> =>
            run(
                () => chapterAdminGateway.bulkChangeStatus(ids, status),
                'dashboard.chapters.toasts.bulkStatusChanged',
                'dashboard.chapters.toasts.statusError',
                result => reportBulk(result, 'dashboard.chapters.toasts.bulkStatusChanged'),
            ),
        [reportBulk, run],
    );

    const handleBulkDelete = useCallback(
        (ids: string[]): Promise<BulkResult | null> =>
            run(
                () => chapterAdminGateway.bulkDelete(ids),
                'dashboard.chapters.toasts.bulkDeleted',
                'dashboard.chapters.toasts.deleteError',
                result => reportBulk(result, 'dashboard.chapters.toasts.bulkDeleted'),
            ),
        [reportBulk, run],
    );

    return {
        isSubmitting,
        handleCreate,
        handleUpdate,
        handleDuplicate,
        handleDelete,
        handleChangeStatus,
        handleReorder,
        handleBulkChangeStatus,
        handleBulkDelete,
    };
};

export default useAdminChapterActions;
