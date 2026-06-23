import { useTranslation } from 'react-i18next';

import { getStoredSession } from '@shared/service/session';

import { CommentData } from '@entities/comment';

import CommentInput from './CommentInput';
import SortComments from './SortComments';
import CommentsList from './CommentsList';

type CommentsSectionProps = {
    targetId: string;
    targetType: string;
    comments: CommentData[];
    totalElements?: number;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    onCommentCreated?: () => void;
    crossLanguage?: boolean;
    onToggleCrossLanguage?: () => void;
};

const CommentsSection = ({
    targetId,
    targetType,
    comments,
    totalElements,
    isLoading,
    isError,
    error,
    onCommentCreated,
    crossLanguage = false,
    onToggleCrossLanguage,
}: CommentsSectionProps) => {
    const { t } = useTranslation('comment');

    return (
        <section className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-[22px] font-mr-bold text-mr-fg">{t('section.title')}</h3>
                        <span className="text-mr-small text-mr-fg-subtle">{t('section.count', { count: totalElements ?? comments.length })}</span>
                    </div>
                    {onToggleCrossLanguage && (
                        <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                            <input type="checkbox" checked={crossLanguage} onChange={onToggleCrossLanguage} className="accent-quaternary-default" />
                            <span>
                                {t('section.crossLanguage')}
                            </span>
                        </label>
                    )}
                </div>
                <div className="flex flex-col gap-4">
                    {getStoredSession() ? (
                        <CommentInput placeholder={t('section.placeholder')} targetId={targetId} targetType={targetType} onCommentCreated={onCommentCreated} />
                    ) : (
                        <p className="p-3 text-xs border rounded-xs border-tertiary bg-secondary text-tertiary">{t('section.loginPrompt')}</p>
                    )}
                    <SortComments title={t('section.sortLabel')} />
                </div>
            </div>
            <CommentsList targetId={targetId} targetType={targetType} comments={comments} isLoading={isLoading} isError={isError} error={error} />
        </section>
    );
};

export default CommentsSection;
