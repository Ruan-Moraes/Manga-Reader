import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';

import { Modal } from '@ui/Modal';
import { Button } from '@ui/Button';
import { Switch } from '@ui/Switch';
import { Input } from '@ui/Input';
import { Select } from '@ui/Select';
import { Textarea } from '@ui/Textarea';
import LocalizedTextInput from '@ui/LocalizedTextInput';
import { SUPPORTED_LANGUAGES } from '@shared/type/i18n';
import { useDomainLabels, LABEL_TYPES } from '@entities/label';

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
};

const NewsFormModal =({ isOpen, onClose, onSubmit, news, isSubmitting, onDelete }: NewsFormModalProps) => {
    const { t } = useTranslation('admin');
    const { data: categoryOptions = [] } = useDomainLabels(LABEL_TYPES.NEWS_CATEGORY);

    const {
        category,
        setCategory,
        coverImage,
        setCoverImage,
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
        contentTab,
        setContentTab,
        ptTitle,
        handleSubmit,
        handleContentChange,
    } = useNewsFormModalState(news, isOpen, onSubmit);

    const isEditing = Boolean(news);

    const save = () => handleSubmit({ preventDefault: () => {} } as React.FormEvent);

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            title={news ? t('newsForm.editTitle', 'Editar Notícia') : t('newsForm.newTitle', 'Nova Notícia')}
            description={t('dashboard.news.form.modalSubtitle')}
            size="lg"
            footer={
                <div className="flex w-full flex-wrap items-center justify-between gap-2.5">
                    <div>
                        {isEditing && onDelete && (
                            <Button variant="ghost" size="sm" danger icon={Trash2} onClick={onDelete}>
                                {t('common.delete')}
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-2.5">
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            {t('common.cancel', 'Cancelar')}
                        </Button>
                        <Button variant="primary" size="sm" disabled={!ptTitle} loading={isSubmitting} onClick={save}>
                            {t('common.save', 'Salvar')}
                        </Button>
                    </div>
                </div>
            }
        >
            <div className="flex flex-col gap-4 p-2">
                <LocalizedTextInput label={t('newsForm.title', 'Título')} value={title} onChange={setTitle} maxLength={300} />

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
                                        isActive ? 'border-b-2 border-mr-accent text-mr-accent' : 'text-mr-fg-subtle hover:text-mr-fg'
                                    }`}
                                >
                                    {lang}
                                    {filled && <span className="text-mr-accent">●</span>}
                                </button>
                            );
                        })}
                    </div>
                    <Textarea rows={6} value={(content[contentTab] ?? []).join('\n\n')} onChange={e => handleContentChange(e.target.value)} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={t('newsForm.coverImage', 'Imagem de capa (URL)')}>
                        <Input type="text" placeholder="https://..." value={coverImage} onChange={e => setCoverImage(e.target.value)} />
                    </Field>
                    <Field label={t('newsForm.source', 'Fonte')}>
                        <Input type="text" value={source} onChange={e => setSource(e.target.value)} />
                    </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={t('newsForm.author', 'Autor')}>
                        <Input type="text" value={authorName} onChange={e => setAuthorName(e.target.value)} />
                    </Field>
                    <Field label={t('newsForm.readTime', 'Tempo de leitura (min)')}>
                        <Input type="number" min="1" value={String(readTime)} onChange={e => setReadTime(parseInt(e.target.value, 10) || 1)} />
                    </Field>
                </div>

                <Field label={t('newsForm.tags', 'Tags (separadas por vírgula)')}>
                    <Input type="text" value={tags} onChange={e => setTags(e.target.value)} />
                </Field>

                <div className="flex flex-wrap gap-x-7 gap-y-3 pt-1">
                    <Switch label={t('newsForm.exclusive', 'Exclusiva')} checked={isExclusive} onChange={setIsExclusive} />
                    <Switch label={t('newsForm.featured', 'Destaque')} checked={isFeatured} onChange={setIsFeatured} />
                </div>
            </div>
        </Modal>
    );
};

export default NewsFormModal;
