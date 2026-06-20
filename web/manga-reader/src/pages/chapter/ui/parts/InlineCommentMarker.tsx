import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, MessageSquare, X } from 'lucide-react';

import { Avatar } from '@ui/Avatar';
import { Button } from '@ui/Button';
import type { InlineMarker } from '../../model/readerData';

interface InlineCommentMarkerProps {
    n: number;
    info: InlineMarker;
}

export const InlineCommentMarker = ({ n, info }: InlineCommentMarkerProps) => {
    const { t } = useTranslation('manga');
    const [open, setOpen] = useState(false);

    return (
        <>
            <button type="button" className="reader-pg-marker" onClick={() => setOpen(v => !v)}>
                <span className="reader-pg-marker-chip">
                    <MessageSquare size={12} strokeWidth={2} />
                    {t('reader.markerLabel', { count: info.count, n })}
                    {open ? <X size={12} strokeWidth={2} /> : <ChevronDown size={12} strokeWidth={2} />}
                </span>
            </button>
            {open && (
                <div className="reader-pg-thread">
                    <div className="reader-pg-thread-head">
                        <MessageSquare size={12} strokeWidth={2} />
                        <strong>{t('reader.threadCount', { count: info.count })}</strong>
                        <span>{t('reader.threadMarking', { n })}</span>
                    </div>
                    <div className="reader-pg-comment">
                        <Avatar initials={info.top.initials} color={info.top.color} size={32} />
                        <div className="reader-pg-comment-body">
                            <div className="reader-pg-comment-meta">
                                <strong>{info.top.user}</strong>
                                <span>{info.top.when}</span>
                            </div>
                            <div className="reader-pg-comment-text">{info.top.text}</div>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" icon={MessageSquare}>
                        {t('reader.seeOthers', { count: info.count - 1 })}
                    </Button>
                </div>
            )}
        </>
    );
};
