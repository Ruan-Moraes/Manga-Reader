import { useTranslation } from 'react-i18next';
import { MessageSquare, X } from 'lucide-react';

// TODO(backend): O painel de comentários do leitor aguarda integração com o
// endpoint de capítulos. A URL /chapters/:chapterNumber identifica o capítulo
// pelo número na URL, mas o sistema de comentários unificado precisa do ID
// interno do capítulo (ObjectId/UUID do banco). Quando o hook useChapterData
// expor o id do capítulo, passar como targetId aqui e remover o estado vazio.

interface ReaderCommentsPanelProps {
    chapter: number;
    onClose: () => void;
}

export const ReaderCommentsPanel = ({ chapter, onClose }: ReaderCommentsPanelProps) => {
    const { t } = useTranslation('manga');

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

                <div className="reader-comments-list" style={{ alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 13, textAlign: 'center', gap: 12 }}>
                    <MessageSquare size={32} strokeWidth={1.5} style={{ opacity: 0.4 }} />
                    <p>{t('reader.commentsUnavailable', { defaultValue: 'Comentários do capítulo estarão disponíveis em breve.' })}</p>
                </div>
            </aside>
        </>
    );
};
