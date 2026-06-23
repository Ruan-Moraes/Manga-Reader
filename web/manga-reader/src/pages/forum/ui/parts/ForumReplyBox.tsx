import { useTranslation } from 'react-i18next';
import { Check, Eye, X } from 'lucide-react';

import { Button } from '@ui/Button';
import { SquareAvatar } from '@ui/SquareAvatar';

interface ForumReplyBoxProps {
    open: boolean;
    onToggle: () => void;
}

export const ForumReplyBox = ({ open, onToggle }: ForumReplyBoxProps) => {
    const { t } = useTranslation('forum');

    return (
        <div className={`forum-reply ${open ? 'open' : ''}`}>
            <div className="forum-reply-head" onClick={onToggle}>
                <SquareAvatar initials="RM" color="var(--mr-accent)" size={36} />
                {!open ? (
                    <div className="forum-reply-placeholder">{t('ui.replyPlaceholderClosed')}</div>
                ) : (
                    <span className="mr-label" style={{ color: 'var(--mr-accent)' }}>
                        {t('ui.yourReply')}
                    </span>
                )}
                {open && (
                    <button
                        type="button"
                        className="forum-icon-btn"
                        onClick={e => {
                            e.stopPropagation();
                            onToggle();
                        }}
                        aria-label={t('ui.close')}
                    >
                        <X size={16} strokeWidth={2} />
                    </button>
                )}
            </div>
            {open && (
                <div className="forum-reply-body">
                    <div className="forum-md-toolbar">
                        <button type="button" title={t('ui.mdBold')}>
                            <strong>B</strong>
                        </button>
                        <button type="button" title={t('ui.mdItalic')}>
                            <em>I</em>
                        </button>
                        <button type="button" title={t('ui.mdQuote')}>
                            &quot;
                        </button>
                        <button type="button" title={t('ui.mdList')}>
                            ≡
                        </button>
                        <button type="button" title={t('ui.mdCode')}>
                            {'</>'}
                        </button>
                        <button type="button" title={t('ui.mdImage')}>
                            IMG
                        </button>
                        <span style={{ width: 1, height: 18, background: '#444', margin: '0 4px' }} />
                        <button type="button" title={t('ui.spoiler')} className="forum-md-spoiler">
                            <Eye size={12} strokeWidth={2} />
                            {t('ui.spoiler')}
                        </button>
                    </div>
                    <textarea className="forum-md-editor" placeholder={t('ui.replyEditorPlaceholder')} rows={5} />
                    <div className="forum-reply-footer">
                        <div className="forum-reply-hints">
                            <Check size={11} strokeWidth={2} />
                            <span>{t('ui.replyHints')}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <Button variant="ghost">{t('ui.preview')}</Button>
                            <Button variant="primary">{t('ui.publishReply')}</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
