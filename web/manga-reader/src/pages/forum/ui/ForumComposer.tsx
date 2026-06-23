import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Eye, Plus, X } from 'lucide-react';

import { ROUTES } from '@shared/constant/ROUTES';
import useAppNavigate from '@shared/hook/useAppNavigate';
import { Button } from '@ui/Button';

import { FORUM_CATEGORIES, FORUM_TAGS } from './forumData';
import { forumIcon } from './forumIcons';
import { SquareAvatar } from '@ui/SquareAvatar';
import { RichBody } from './parts/RichBody';
import './forum.css';

interface UploadedImage {
    name: string;
    size: number;
}

const ForumComposer = () => {
    const { t } = useTranslation('forum');
    const navigate = useAppNavigate();
    const onClose = () => navigate(ROUTES.FORUM);

    const [step, setStep] = useState<'write' | 'preview'>('write');
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [category, setCategory] = useState('discussao');
    const [tags, setTags] = useState<string[]>(['discussao']);
    const [drag, setDrag] = useState(false);
    const [images, setImages] = useState<UploadedImage[]>([]);

    const toggleTag = (tg: string) => setTags(prev => (prev.includes(tg) ? prev.filter(x => x !== tg) : [...prev, tg]));
    const removeImage = (idx: number) => setImages(prev => prev.filter((_, i) => i !== idx));

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDrag(false);
        const files = [...(e.dataTransfer?.files ?? [])];
        if (files.length) setImages(prev => [...prev, ...files.map(f => ({ name: f.name, size: f.size }))]);
    };

    const composerCats = FORUM_CATEGORIES.filter(c => c.key !== 'home' && c.key !== 'staff').slice(0, 8);
    const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="composer-overlay" onClick={onClose}>
            <div className="composer-shell" onClick={e => e.stopPropagation()}>
                <header className="composer-head">
                    <div>
                        <div className="mr-label" style={{ color: 'var(--mr-accent)', marginBottom: 4, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <Plus size={13} strokeWidth={2} />
                            {t('ui.newTopic')}
                        </div>
                        <h2 className="composer-title">{t('ui.composerTitle')}</h2>
                    </div>
                    <button type="button" onClick={onClose} className="forum-icon-btn" aria-label={t('ui.close')}>
                        <X size={20} strokeWidth={2} />
                    </button>
                </header>

                <div className="composer-steps">
                    <button type="button" onClick={() => setStep('write')} className={`composer-step ${step === 'write' ? 'active' : ''}`}>
                        {t('ui.stepWrite')}
                    </button>
                    <button type="button" onClick={() => setStep('preview')} className={`composer-step ${step === 'preview' ? 'active' : ''}`}>
                        {t('ui.stepPreview')}
                    </button>
                </div>

                <div className="composer-body">
                    {step === 'write' ? (
                        <>
                            <div className="composer-row">
                                <label className="composer-label">
                                    <span className="mr-label">{t('ui.categoryLabel')}</span>
                                    <span style={{ fontSize: 11, color: '#999', marginLeft: 8, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>{t('ui.categoryHint')}</span>
                                </label>
                                <div className="composer-cats">
                                    {composerCats.map(c => {
                                        const Icon = forumIcon[c.icon] ?? forumIcon.forum;
                                        return (
                                            <button key={c.key} type="button" onClick={() => setCategory(c.key)} className={`composer-cat ${category === c.key ? 'active' : ''}`}>
                                                <Icon size={14} strokeWidth={2} />
                                                {c.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="composer-row">
                                <label className="composer-label">
                                    <span className="mr-label">{t('ui.titleLabel')}</span>
                                    <span style={{ fontSize: 11, color: title.length > 120 ? '#FF784F' : '#999', marginLeft: 'auto', fontWeight: 700 }}>{title.length}/120</span>
                                </label>
                                <input className="composer-title-input" placeholder={t('ui.titlePlaceholder')} value={title} onChange={e => setTitle(e.target.value.slice(0, 120))} />
                            </div>

                            <div className="composer-row">
                                <label className="composer-label">
                                    <span className="mr-label">{t('ui.tagsLabel')}</span>
                                    <span style={{ fontSize: 11, color: '#999', marginLeft: 8, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>{t('ui.tagsHint')}</span>
                                </label>
                                <div className="composer-tags">
                                    {Object.entries(FORUM_TAGS).map(([k, tg]) => {
                                        const active = tags.includes(k);
                                        return (
                                            <button key={k} type="button" onClick={() => toggleTag(k)} className={`forum-tag forum-tag-${tg.tone} composer-tag ${active ? 'active' : ''}`}>
                                                {active && <Check size={11} strokeWidth={2} />}
                                                {tg.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="composer-row">
                                <label className="composer-label">
                                    <span className="mr-label">{t('ui.contentLabel')}</span>
                                    <span style={{ fontSize: 11, color: '#999', marginLeft: 8, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                                        {t('ui.contentHintBefore')} <span style={{ color: 'var(--mr-accent)' }}>[spoiler]</span> {t('ui.contentHintAfter')}
                                    </span>
                                </label>
                                <div className="forum-md-toolbar composer-toolbar">
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
                                    <button type="button" title={t('ui.mdLink')}>
                                        ⊕
                                    </button>
                                    <span style={{ width: 1, height: 18, background: '#444', margin: '0 4px' }} />
                                    <button type="button" title={t('ui.spoiler')} className="forum-md-spoiler">
                                        <Eye size={12} strokeWidth={2} />
                                        {t('ui.spoiler')}
                                    </button>
                                    <span style={{ flex: 1 }} />
                                    <span style={{ fontSize: 10, color: '#727273', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>{t('ui.charCount', { count: body.length })}</span>
                                </div>
                                <textarea className="composer-editor" placeholder={t('ui.contentPlaceholder')} value={body} onChange={e => setBody(e.target.value)} rows={9} />

                                <div className={`composer-drop ${drag ? 'dragging' : ''}`} onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={onDrop}>
                                    <Plus size={18} strokeWidth={2} />
                                    <div>
                                        <div style={{ color: '#fff', fontSize: 13, fontWeight: 700, letterSpacing: '.0625rem' }}>{t('ui.dropTitle')}</div>
                                        <div style={{ color: '#999', fontSize: 11, marginTop: 2 }}>{t('ui.dropHint')}</div>
                                    </div>
                                    <Button variant="ghost">{t('ui.selectFiles')}</Button>
                                </div>

                                {images.length > 0 && (
                                    <div className="composer-uploads">
                                        {images.map((img, i) => (
                                            <div key={i} className="composer-upload">
                                                <div className="composer-upload-thumb">
                                                    <Eye size={14} strokeWidth={2} />
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div className="composer-upload-name">{img.name}</div>
                                                    <div className="composer-upload-size">{Math.max(1, Math.round((img.size || 0) / 1024))} KB</div>
                                                </div>
                                                <button type="button" onClick={() => removeImage(i)} className="forum-icon-btn" aria-label={t('ui.close')}>
                                                    <X size={14} strokeWidth={2} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="composer-row">
                                <label className="composer-label">
                                    <span className="mr-label">{t('ui.optionsLabel')}</span>
                                </label>
                                <div className="composer-options">
                                    <label className="composer-check">
                                        <input type="checkbox" defaultChecked />
                                        <span>{t('ui.optionNotify')}</span>
                                    </label>
                                    <label className="composer-check">
                                        <input type="checkbox" />
                                        <span>{t('ui.optionUnverified')}</span>
                                    </label>
                                    <label className="composer-check">
                                        <input type="checkbox" />
                                        <span>{t('ui.optionSpoiler')}</span>
                                    </label>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="composer-preview">
                            <div className="forum-topic-meta">
                                <span className="forum-topic-cat">{FORUM_CATEGORIES.find(c => c.key === category)?.label}</span>
                                <span style={{ flex: 1 }} />
                                <span className="forum-topic-when">{t('ui.fewSecondsAgo')}</span>
                            </div>
                            <h1 className="forum-topic-title">{title || <span style={{ color: '#727273' }}>{t('ui.previewTitlePlaceholder')}</span>}</h1>
                            <div className="forum-topic-tags">
                                {tags.map(tg => {
                                    const tag = FORUM_TAGS[tg];
                                    if (!tag) return null;
                                    return (
                                        <span key={tg} className={`forum-tag forum-tag-${tag.tone}`}>
                                            {tag.label}
                                        </span>
                                    );
                                })}
                            </div>
                            <div className="forum-topic-author">
                                <div className="forum-topic-author-block">
                                    <SquareAvatar initials="RM" color="var(--mr-accent)" size={42} />
                                    <div>
                                        <span style={{ color: '#fff', fontWeight: 800, fontSize: 14, letterSpacing: '.0625rem' }}>Ruan Moraes</span>
                                        <div style={{ color: '#999', fontSize: 11, marginTop: 2 }}>@ruanmoraes · {t('ui.levelShort', { level: 18 })}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="forum-topic-content" style={{ marginTop: 18 }}>
                                {body ? <RichBody text={body} /> : <p style={{ color: '#727273', fontStyle: 'italic' }}>{t('ui.previewBodyPlaceholder')}</p>}
                            </div>
                        </div>
                    )}
                </div>

                <footer className="composer-foot">
                    <div className="composer-meta">
                        <Check size={12} strokeWidth={2} />
                        <span>{t('ui.draftSaved', { time: now })}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <Button variant="ghost" onClick={onClose}>
                            {t('ui.cancel')}
                        </Button>
                        {step === 'write' ? (
                            <Button variant="raised" onClick={() => setStep('preview')}>
                                {t('ui.toPreview')}
                            </Button>
                        ) : (
                            <Button variant="raised" onClick={() => setStep('write')}>
                                {t('ui.toBack')}
                            </Button>
                        )}
                        <Button variant="primary" icon={Check} onClick={onClose}>
                            {t('ui.publishTopic')}
                        </Button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default ForumComposer;
