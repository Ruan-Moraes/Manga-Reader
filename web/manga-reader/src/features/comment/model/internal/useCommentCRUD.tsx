import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import { showSuccessToast, showErrorToast } from '@shared/service/util/toastService';
import { requireAuth } from '@shared/service/util/requireAuth';

import { deleteComment as deleteCommentService, updateComment, createComment } from '@entities/comment';

const useCommentCRUD = (targetType: string) => {
    const queryClient = useQueryClient();
    const { t } = useTranslation('comment');

    const deleteCommentMutation = useMutation({
        mutationFn: async (id: string) => {
            await deleteCommentService(id);
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COMMENTS] });
            showSuccessToast(t('toast.deleted'), { toastId: 'delete-comment-success' });
        },
        onError: () => {
            showErrorToast(t('toast.deleteError'), { toastId: 'delete-comment-error' });
        },
    });

    const editCommentMutation = useMutation({
        mutationFn: async ({
            id,
            newTextContent,
            newImageContent,
        }: {
            id: string;
            newTextContent: string | null;
            newImageContent: string | null;
        }) => {
            return await updateComment(id, newTextContent ?? '', newImageContent);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COMMENTS] });
            showSuccessToast(t('toast.edited'), { toastId: 'edit-comment-success' });
        },
        onError: () => {
            showErrorToast(t('toast.editError'), { toastId: 'edit-comment-error' });
        },
    });

    const replyCommentMutation = useMutation({
        mutationFn: async ({
            id,
            targetId,
            textContent,
            imageContent,
        }: {
            id: string;
            targetId: string;
            textContent: string | null;
            imageContent: string | null;
        }) => {
            return await createComment({
                targetType,
                targetId,
                textContent: textContent ?? '',
                imageContent,
                parentCommentId: id,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COMMENTS] });
            showSuccessToast(t('toast.replied'), { toastId: 'reply-comment-success' });
        },
        onError: () => {
            showErrorToast(t('toast.replyError'), { toastId: 'reply-comment-error' });
        },
    });

    const deleteComment = useCallback(
        (id: string) => {
            if (!requireAuth(t('validation.authDelete'))) return;
            deleteCommentMutation.mutate(id);
        },
        [deleteCommentMutation, t],
    );

    const editComment = useCallback(
        (id: string, newTextContent: string | null, newImageContent: string | null) => {
            if (!requireAuth(t('validation.authEdit'))) return;
            editCommentMutation.mutate({ id, newTextContent, newImageContent });
        },
        [editCommentMutation, t],
    );

    const replyComment = useCallback(
        (id: string, targetId: string, textContent: string | null, imageContent: string | null) => {
            if (!requireAuth(t('validation.authReply'))) return;
            replyCommentMutation.mutate({
                id,
                targetId,
                textContent,
                imageContent,
            });
        },
        [replyCommentMutation, t],
    );

    return {
        deleteComment,
        editComment,
        replyComment,
        isDeletingComment: deleteCommentMutation.isPending,
        isEditingComment: editCommentMutation.isPending,
        isReplyingComment: replyCommentMutation.isPending,
        deleteCommentError: deleteCommentMutation.error,
        editCommentError: editCommentMutation.error,
        replyCommentError: replyCommentMutation.error,
    };
};

export default useCommentCRUD;
