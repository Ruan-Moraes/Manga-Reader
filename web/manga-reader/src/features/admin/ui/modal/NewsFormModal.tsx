import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, ImagePlus, Trash2 } from 'lucide-react';

import { Modal } from '@ui/Modal';
import { ModalActions } from '@ui/ModalActions';
import { Button } from '@ui/Button';
import { FormRow } from '@ui/FormRow';
import { Switch } from '@ui/Switch';
import { Input } from '@ui/Input';
import { Select } from '@ui/Select';
import { Textarea } from '@ui/Textarea';
import LocalizedTextInput from '@ui/LocalizedTextInput';
import { SUPPORTED_LANGUAGES } from '@shared/type/i18n';
import { useDomainLabels, LABEL_TYPES } from '@entities/label';
import { buildTemporaryNewsCoverUrl } from '@entities/news';

import useNewsFormModalState from '../../model/useNewsFormModalState';
import Field from '../parts/Field';

import type { AdminNews, CreateNewsRequest, UpdateNewsRequest } from '../../model/admin.types';

type NewsFormModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateNewsRequest | UpdateNewsRequest) => void;
    news?: AdminNews | null;
    isSubmitting: boolean;
    onDelete?: () => void;
    onPublish?: () => void;
    onUnpublish?: () => void;
    onDraft?: () => void;
    onSchedule?: (scheduledAt: string) => void;
};

const NewsFormModal =({ isOpen, onClose, onSubmit, news, isSubmitting, onDelete, onPublish, onUnpublish, onDraft, onSchedule }: NewsFormModalProps) => {
    const { t } = useTranslation('admin');
    const [scheduledAt, setScheduledAt] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const { data: categoryOptions = [] } = useDomainLabels(LABEL_TYPES.NEWS_CATEGORY);

    const {
        category,
        setCategory,
        coverImage,
        setCoverImage,
        coverAlt,
        setCoverAlt,
        slug,
        setSlug,
        tags,
        setTags,
        authorName,
        setAuthorName,
        source,
        setSource,
        readTime,
        setReadTime,
        isExclusive,
        setIsExclusive,
        isFeatured,
        setIsFeatured,
        title,
        setTitle,
        subtitle,
        setSubtitle,
        excerpt,
        setExcerpt,
        content,
        seoTitle,
        setSeoTitle,
        seoDescription,
        setSeoDescription,
        seoKeywords,
        setSeoKeywords,
        contentTab,
        setContentTab,
        ptTitle,
        dirty,
        valid,
        coverImageInvalid,
        slugInvalid,
        handleSubmit,
        handleContentChange,
    } = useNewsFormModalState(news, isOpen, onSubmit);

    const isEditing = Boolean(news);

    const save = () => void handleSubmit();

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            title={news ? t('newsForm.editTitle', 'Editar Notícia') : t('newsForm.newTitle', 'Nova Notícia')}
            description={t('dashboard.news.form.modalSubtitle')}
            size="xl"
            loading={isSubmitting}
            confirmClose={dirty && !isSubmitting}
            footer={
                <ModalActions
                    cancelLabel={t('common.cancel', 'Cancelar')}
                    onCancel={onClose}
                    submitLabel={t('common.save', 'Salvar')}
                    onSubmit={save}
                    submitDisabled={!valid}
                    submitting={isSubmitting}
                    leftAction={
                        isEditing &&
                        onDelete && (
                            <Button variant="ghost" size="sm" danger icon={Trash2} onClick={onDelete}>
                                {t('common.delete')}
                            </Button>
                        )
                    }
                />
            }
        >
            <div className="flex flex-col gap-4">
                <div className="flex justify-end">
                    <Button type="button" variant="ghost" size="sm" icon={Eye} onClick={() => setShowPreview(current => !current)}>
                        {t(showPreview ? 'newsForm.closePreview' : 'newsForm.openPreview')}
                    </Button>
                </div>

                {showPreview && (
                    <article className="overflow-hidden rounded-mr-sm border border-mr-border bg-mr-secondary" aria-label={t('newsForm.previewTitle')}>
                        {coverImage && (
                            <img
                                src={coverImage}
                                alt={coverAlt[contentTab] || title[contentTab] || ptTitle}
                                className="aspect-video w-full object-cover"
                            />
                        )}
                        <div className="mx-auto max-w-3xl space-y-4 p-5 sm:p-8">
                            <p className="text-mr-tiny font-mr-bold uppercase tracking-wider text-mr-accent-fg">
                                {categoryOptions.find(option => option.value === category)?.label || category}
                            </p>
                            <h2 className="text-mr-h2 font-mr-extrabold leading-tight text-mr-fg">
                                {title[contentTab] || ptTitle || t('newsForm.previewUntitled')}
                            </h2>
                            {subtitle[contentTab] && <p className="text-mr-body text-mr-fg-muted">{subtitle[contentTab]}</p>}
                            <div className="space-y-4 text-mr-body leading-relaxed text-mr-fg">
                                {(content[contentTab] ?? []).map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>)}
                            </div>
                        </div>
                    </article>
                )}

                {news && <section className="rounded-mr-xs border border-mr-border bg-mr-secondary p-4"><div className="flex flex-wrap items-center gap-2"><span className="rounded-mr-full border border-mr-border px-3 py-1 text-mr-tiny font-mr-bold text-mr-fg">{t(`newsForm.status.${news.status}`)}</span>{news.status !== 'PUBLISHED' && <Button type="button" size="sm" onClick={onPublish} disabled={isSubmitting}>{t('newsForm.publishNow')}</Button>}{news.status === 'PUBLISHED' && <Button type="button" size="sm" variant="ghost" onClick={onUnpublish} disabled={isSubmitting}>{t('newsForm.unpublish')}</Button>}{news.status !== 'DRAFT' && <Button type="button" size="sm" variant="ghost" onClick={onDraft} disabled={isSubmitting}>{t('newsForm.moveToDraft')}</Button>}</div><div className="mt-3 flex flex-col gap-2 sm:flex-row"><Input type="datetime-local" value={scheduledAt} onChange={event => setScheduledAt(event.target.value)} aria-label={t('newsForm.scheduleAt')} /><Button type="button" variant="ghost" disabled={!scheduledAt || isSubmitting} onClick={() => onSchedule?.(new Date(scheduledAt).toISOString())}>{t('newsForm.schedule')}</Button></div></section>}
                <LocalizedTextInput label={t('newsForm.title', 'Título')} value={title} onChange={setTitle} maxLength={300} />

                <Field label={t('newsForm.slug')} hint={slugInvalid ? t('newsForm.slugInvalid') : undefined}>
                    <Input value={slug} onChange={event => setSlug(event.target.value)} placeholder={t('newsForm.slugPlaceholder')} />
                </Field>

                <Field label={t('newsForm.category', 'Categoria')}>
                    <Select value={category} onChange={e => setCategory(e.target.value)} options={categoryOptions} />
                </Field>

                <LocalizedTextInput label={t('newsForm.subtitle', 'Subtítulo')} value={subtitle} onChange={setSubtitle} requiredLanguages={[]} maxLength={500} />
                <LocalizedTextInput label={t('newsForm.excerpt', 'Resumo')} value={excerpt} onChange={setExcerpt} multiline rows={3} requiredLanguages={[]} />

                <div className="flex flex-col gap-1.5">
                    <span className="text-mr-small font-mr-bold text-mr-fg-muted">{t('newsForm.content', 'Conteúdo')}</span>
                    <div className="flex gap-1 border-b border-mr-border-subtle" role="tablist">
                        {SUPPORTED_LANGUAGES.map(lang => {
                            const filled = (content[lang] ?? []).length > 0;
                            const isActive = contentTab === lang;
                            return (
                                <button
                                    key={lang}
                                    type="button"
                                    role="tab"
                                    aria-selected={isActive}
                                    onClick={() => setContentTab(lang)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-mr-tiny font-mr-bold transition-colors ${
                                        isActive ? 'border-b-2 border-mr-accent-border text-mr-accent-fg' : 'text-mr-fg-subtle hover:text-mr-fg'
                                    }`}
                                >
                                    {lang}
                                    {filled && <span className="text-mr-accent-fg">●</span>}
                                </button>
                            );
                        })}
                    </div>
                    <Textarea rows={6} value={(content[contentTab] ?? []).join('\n\n')} onChange={e => handleContentChange(e.target.value)} />
                </div>

                <FormRow columns={2}>
                    <Field label={t('newsForm.coverImage', 'Imagem de capa (URL)')} hint={coverImageInvalid ? t('newsForm.coverUrlInvalid') : undefined}>
                        <Input type="text" placeholder="https://..." value={coverImage} onChange={e => setCoverImage(e.target.value)} />
                    </Field>
                    <Field label={t('newsForm.source', 'Fonte')}>
                        <Input type="text" value={source} onChange={e => setSource(e.target.value)} />
                    </Field>
                </FormRow>

                <div className="rounded-mr-xs border border-mr-border bg-mr-secondary p-4">
                    <p className="mb-3 text-mr-small text-mr-fg-muted">{t('newsForm.coverTemporaryNotice')}</p>
                    {coverImage && <img src={coverImage} alt={coverAlt['pt-BR'] || ptTitle} className="mb-3 aspect-video w-full rounded-mr-xs object-cover" />}
                    <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="ghost" size="sm" icon={ImagePlus} onClick={() => setCoverImage(buildTemporaryNewsCoverUrl(slug || ptTitle))}>{t('newsForm.generateTemporaryCover')}</Button>
                        {coverImage && <Button type="button" variant="ghost" size="sm" danger onClick={() => setCoverImage('')}>{t('newsForm.removeCover')}</Button>}
                    </div>
                </div>

                <LocalizedTextInput label={t('newsForm.coverAlt')} value={coverAlt} onChange={setCoverAlt} requiredLanguages={[]} maxLength={180} />

                <FormRow columns={2}>
                    <Field label={t('newsForm.author', 'Autor')}>
                        <Input type="text" value={authorName} onChange={e => setAuthorName(e.target.value)} />
                    </Field>
                    <Field label={t('newsForm.readTime', 'Tempo de leitura (min)')}>
                        <Input type="number" min="1" value={String(readTime)} onChange={e => setReadTime(parseInt(e.target.value, 10) || 1)} />
                    </Field>
                </FormRow>

                <Field label={t('newsForm.tags', 'Tags (separadas por vírgula)')}>
                    <Input type="text" value={tags} onChange={e => setTags(e.target.value)} />
                </Field>

                <div className="border-t border-mr-border pt-5">
                    <h3 className="mb-4 text-mr-h4 font-mr-extrabold text-mr-fg">{t('newsForm.seoSection')}</h3>
                    <div className="space-y-4">
                        <LocalizedTextInput label={t('newsForm.seoTitle')} value={seoTitle} onChange={setSeoTitle} requiredLanguages={[]} maxLength={70} />
                        <LocalizedTextInput label={t('newsForm.seoDescription')} value={seoDescription} onChange={setSeoDescription} requiredLanguages={[]} multiline rows={3} maxLength={170} />
                        <Field label={t('newsForm.seoKeywords')}>
                            <Input value={(seoKeywords[contentTab] ?? []).join(', ')} onChange={event => setSeoKeywords({ ...seoKeywords, [contentTab]: event.target.value.split(',').map(value => value.trim()).filter(Boolean) })} />
                        </Field>
                        <div className="rounded-mr-xs border border-mr-border bg-mr-secondary p-4">
                            <p className="text-mr-tiny text-mr-accent-fg">{window.location.origin}/news/{slug || 'slug-da-noticia'}</p>
                            <p className="mt-1 text-mr-body font-mr-bold text-mr-fg">{seoTitle[contentTab] || title[contentTab] || ptTitle}</p>
                            <p className="mt-1 text-mr-small text-mr-fg-muted">{seoDescription[contentTab] || excerpt[contentTab]}</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-x-7 gap-y-3 pt-1">
                    <Switch label={t('newsForm.exclusive', 'Exclusiva')} checked={isExclusive} onChange={setIsExclusive} />
                    <Switch label={t('newsForm.featured', 'Destaque')} checked={isFeatured} onChange={setIsFeatured} />
                </div>
            </div>
        </Modal>
    );
};

export default NewsFormModal;
