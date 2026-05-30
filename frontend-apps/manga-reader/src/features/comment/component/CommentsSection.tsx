import { useTranslation } from 'react-i18next';

import { getStoredSession } from '@shared/service/session';

import { CommentData } from '../type/comment.types';

import CommentInput from './CommentInput';
import SortComments from './SortComments';
import CommentsList from './CommentsList';

type CommentsSectionProps = {
    titleId: string;
    comments: CommentData[];
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    onCommentCreated?: () => void;
    crossLanguage?: boolean;
    /** Quando definido, renderiza toggle admin de moderação cross-language. */
    onToggleCrossLanguage?: () => void;
};

const CommentsSection = ({
    titleId,
    comments,
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
                    <h3 className="text-xl font-bold">{t('section.title')}</h3>
                    {onToggleCrossLanguage && (
                        <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                            <input type="checkbox" checked={crossLanguage} onChange={onToggleCrossLanguage} className="accent-quaternary-default" />
                            <span>
                                {t('section.crossLanguage', {
                                    defaultValue: 'Todos idiomas (admin)',
                                })}
                            </span>
                        </label>
                    )}
                </div>
                <div className="flex flex-col gap-4">
                    {getStoredSession() ? (
                        <CommentInput placeholder={t('section.placeholder')} titleId={titleId} onCommentCreated={onCommentCreated} />
                    ) : (
                        <p className="p-3 text-xs border rounded-xs border-tertiary bg-secondary text-tertiary">{t('section.loginPrompt')}</p>
                    )}
                    <SortComments title={t('section.sortLabel')} />
                </div>
            </div>
            <CommentsList titleId={titleId} comments={comments} isLoading={isLoading} isError={isError} error={error} />
        </section>
    );
};

export default CommentsSection;
