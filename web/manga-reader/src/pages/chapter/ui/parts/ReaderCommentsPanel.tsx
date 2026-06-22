import { useTranslation } from 'react-i18next';
import { Loader2, X } from 'lucide-react';

import { useComments } from '@entities/comment';
import { CommentsSection } from '@features/comment';

interface ReaderCommentsPanelProps {
    chapter: number;
    /** ObjectId interno do capítulo (targetId dos comentários). */
    chapterId?: string;
    onClose: () => void;
}

/**
 * Painel de comentários do leitor.
 *
 * Decisão arquitetural (resolução do alvo do comentário): a URL do leitor é
 * `/titles/:titleId/chapters/:chapter`, onde `:chapter` é o NÚMERO do capítulo,
 * não o id do banco. O sistema de comentários é unificado e polimórfico por
 * `(targetType, targetId)`, onde `targetId` é SEMPRE o id interno (ObjectId) —
 * idêntico para TITLE/REVIEW/FORUM_TOPIC. Para manter essa superfície única
 * (sem endpoints de comentário específicos de capítulo), resolvemos o número →
 * id interno via `useChapter` (`GET /api/titles/:titleId/chapters/:number`,
 * cacheado) e passamos o id resolvido como `targetId` para a feature genérica de
 * comentários. Assim toda a feature (`CommentsSection`/`CommentInput`/votos/
 * edição) funciona sem fork. Enquanto o id não resolve, o painel mostra um
 * estado de carregamento e não renderiza a caixa de envio (evita POST com
 * `targetId` vazio).
 */
export const ReaderCommentsPanel = ({ chapter, chapterId, onClose }: ReaderCommentsPanelProps) => {
    const { t } = useTranslation('manga');

    const { comments, totalElements, isLoading, isError, error, refetchComments } = useComments(chapterId ?? '', 0, 20, { targetType: 'CHAPTER' });

    return (
        <>
            <div className="reader-overlay" onClick={onClose} aria-hidden="true" />
            <aside className="reader-comments" role="dialog" aria-label={t('reader.commentsAria')}>
                <header className="reader-comments-head">
                    <div>
                        <div className="reader-comments-eyebrow">{t('reader.discussionEyebrow')}</div>
                        <h2 className="reader-comments-title">{t('reader.commentsTitle', { chapter })}</h2>
                    </div>
                    <button type="button" className="reader-icon-btn" onClick={onClose} aria-label={t('reader.closeAria')}>
                        <X size={18} strokeWidth={2} />
                    </button>
                </header>

                <div className="reader-comments-list">
                    {chapterId ? (
                        <CommentsSection
                            targetType="CHAPTER"
                            targetId={chapterId}
                            comments={comments}
                            totalElements={totalElements}
                            isLoading={isLoading}
                            isError={isError}
                            error={error}
                            onCommentCreated={refetchComments}
                        />
                    ) : (
                        <div
                            className="flex flex-1 items-center justify-center gap-2 text-[13px] text-mr-fg-subtle"
                            role="status"
                            aria-live="polite"
                        >
                            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                            <span>{t('reader.commentsLoading', { defaultValue: 'Carregando comentários…' })}</span>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
};
