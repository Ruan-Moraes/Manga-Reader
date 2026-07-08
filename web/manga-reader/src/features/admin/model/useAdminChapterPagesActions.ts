import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { showErrorToast, showSuccessToast } from '@shared/service/util/toastService';
import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import { ChapterDomainError, chapterAdminGateway, type NewPageInput } from '@entities/chapter';

/** Ações sobre as páginas de um capítulo (adicionar/remover/reordenar/substituir/retry). */
const useAdminChapterPagesActions = (chapterId: string) => {
    const { t } = useTranslation('admin');
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const invalidatePages = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_CHAPTER_PAGES, chapterId] });
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_CHAPTER_DETAIL, chapterId] });
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_CHAPTERS] });
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.READER_PAGES] });
    }, [chapterId, queryClient]);

    const run = useCallback(
        async <T>(action: () => Promise<T>, successKey: string | null, errorKey: string): Promise<T | null> => {
            setIsSubmitting(true);
            try {
                const result = await action();
                if (successKey) showSuccessToast(t(successKey));
                invalidatePages();
                return result;
            } catch (error) {
                const message =
                    error instanceof ChapterDomainError
                        ? t(`dashboard.chapters.errors.${error.violation.code}`, { defaultValue: t(errorKey), ...error.violation })
                        : t(errorKey);
                showErrorToast(message);
                return null;
            } finally {
                setIsSubmitting(false);
            }
        },
        [invalidatePages, t],
    );

    return {
        isSubmitting,
        addPages: (files: NewPageInput[]) =>
            run(() => chapterAdminGateway.addPages(chapterId, files), 'dashboard.chapters.pages.toasts.added', 'dashboard.chapters.pages.toasts.addError'),
        removePage: (pageId: string) =>
            run(() => chapterAdminGateway.removePage(chapterId, pageId), 'dashboard.chapters.pages.toasts.removed', 'dashboard.chapters.pages.toasts.removeError'),
        removePages: (pageIds: string[]) =>
            run(() => chapterAdminGateway.removePages(chapterId, pageIds), 'dashboard.chapters.pages.toasts.removedMany', 'dashboard.chapters.pages.toasts.removeError'),
        replacePage: (pageId: string, file: NewPageInput) =>
            run(() => chapterAdminGateway.replacePage(chapterId, pageId, file), 'dashboard.chapters.pages.toasts.replaced', 'dashboard.chapters.pages.toasts.replaceError'),
        reorderPages: (orderedIds: string[]) =>
            run(() => chapterAdminGateway.reorderPages(chapterId, orderedIds), null, 'dashboard.chapters.pages.toasts.reorderError'),
        movePage: (pageId: string, toPosition: number) =>
            run(() => chapterAdminGateway.movePage(chapterId, pageId, toPosition), null, 'dashboard.chapters.pages.toasts.reorderError'),
        retryPage: (pageId: string) =>
            run(() => chapterAdminGateway.retryPageProcessing(chapterId, pageId), 'dashboard.chapters.pages.toasts.retrying', 'dashboard.chapters.pages.toasts.replaceError'),
    };
};

export default useAdminChapterPagesActions;
