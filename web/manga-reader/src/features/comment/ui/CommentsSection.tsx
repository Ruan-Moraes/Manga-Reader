import { useTranslation } from 'react-i18next';
import { LogIn } from 'lucide-react';

import { getStoredSession } from '@shared/service/session';
import { ROUTES } from '@shared/constant/ROUTES';
import useAppNavigate from '@shared/hook/useAppNavigate';
import { Button } from '@ui/Button';

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
    const navigate = useAppNavigate();

    return (
        <section className="flex flex-col gap-4">
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
                <div className="flex min-w-0 flex-col gap-4">
                    {getStoredSession() ? (
                        <CommentInput placeholder={t('section.placeholder')} targetId={targetId} targetType={targetType} onCommentCreated={onCommentCreated} />
                    ) : (
                        <div className="flex min-w-0 flex-col items-stretch gap-4 rounded-mr-md border border-mr-chip-border bg-mr-chip p-4 md:flex-row md:items-center md:justify-between md:gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                                <span className="flex size-9 shrink-0 items-center justify-center rounded-mr-full bg-mr-accent-25 text-mr-accent-fg">
                                    <LogIn className="size-4" aria-hidden="true" />
                                </span>
                                <p className="min-w-0 text-mr-small leading-relaxed text-mr-fg-subtle">{t('section.loginPrompt')}</p>
                            </div>
                            <Button variant="primary" size="sm" className="w-full md:w-auto" onClick={() => navigate(ROUTES.LOGIN)}>
                                {t('section.signIn')}
                            </Button>
                        </div>
                    )}
                    <SortComments title={t('section.sortLabel')} />
                </div>
            </div>
            <CommentsList targetId={targetId} targetType={targetType} comments={comments} isLoading={isLoading} isError={isError} error={error} />
        </section>
    );
};

export default CommentsSection;
