import { useTranslation } from 'react-i18next';

import { Checkbox } from '@ui/Checkbox';
import { Input } from '@ui/Input';
import { Textarea } from '@ui/Textarea';
import LocalizedTextInput from '@ui/LocalizedTextInput';
import { SUPPORTED_LANGUAGES } from '@shared/type/i18n';
import useNewsFormModalState from '../../model/useNewsFormModalState';
import FormModal from './FormModal';

import type { AdminNews, CreateNewsRequest, UpdateNewsRequest } from '../../model/admin.types';

type NewsFormModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateNewsRequest | UpdateNewsRequest) => void;
    news?: AdminNews | null;
    isSubmitting: boolean;
};

const NewsFormModal = ({ isOpen, onClose, onSubmit, news, isSubmitting }: NewsFormModalProps) => {
    const { t } = useTranslation('admin');
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

    return (
        <FormModal
            isOpen={isOpen}
            onClose={onClose}
            title={news ? t('newsForm.editTitle', 'Editar Notícia') : t('newsForm.newTitle', 'Nova Notícia')}
            onSubmit={handleSubmit}
            submitLabel={t('common.save', 'Salvar')}
            submittingLabel={t('common.saving', 'Salvando...')}
            cancelLabel={t('common.cancel', 'Cancelar')}
            isSubmitting={isSubmitting}
            submitDisabled={!ptTitle}
        >
            <LocalizedTextInput label={t('newsForm.title', 'Título')} value={title} onChange={setTitle} maxLength={300} />

            <LocalizedTextInput label={t('newsForm.subtitle', 'Subtítulo')} value={subtitle} onChange={setSubtitle} requiredLanguages={[]} maxLength={500} />

            <LocalizedTextInput label={t('newsForm.excerpt', 'Resumo')} value={excerpt} onChange={setExcerpt} multiline rows={3} requiredLanguages={[]} />

            <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold">{t('newsForm.content')}</span>
                <div className="flex gap-1 border-b border-tertiary">
                    {SUPPORTED_LANGUAGES.map(lang => {
                        const filled = (content[lang] ?? []).length > 0;
                        const isActive = contentTab === lang;
                        return (
                            <button
                                key={lang}
                                type="button"
                                onClick={() => setContentTab(lang)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                                    isActive ? 'border-b-2 border-quaternary-default text-quaternary-default' : 'text-tertiary hover:text-primary'
                                }`}
                            >
                                {lang}
                                {filled && <span className="text-quaternary-default">●</span>}
                            </button>
                        );
                    })}
                </div>
                <Textarea rows={6} placeholder="" value={(content[contentTab] ?? []).join('\n\n')} onChange={e => handleContentChange(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold">{t('newsForm.category', 'Categoria')}</span>
                <Input type="text" value={category} onChange={e => setCategory(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold">{t('newsForm.coverImage', 'Imagem de capa (URL)')}</span>
                <Input type="text" value={coverImage} onChange={e => setCoverImage(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold">{t('newsForm.tags', 'Tags (separadas por vírgula)')}</span>
                <Input type="text" value={tags} onChange={e => setTags(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold">{t('newsForm.author', 'Autor')}</span>
                <Input type="text" value={authorName} onChange={e => setAuthorName(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold">{t('newsForm.source', 'Fonte')}</span>
                <Input type="text" value={source} onChange={e => setSource(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold">{t('newsForm.readTime', 'Tempo de leitura (min)')}</span>
                <Input type="number" min="1" value={String(readTime)} onChange={e => setReadTime(parseInt(e.target.value, 10) || 1)} />
            </div>

            <Checkbox label={t('newsForm.exclusive', 'Exclusiva')} checked={isExclusive} onChange={e => setIsExclusive(e.target.checked)} />

            <Checkbox label={t('newsForm.featured', 'Destaque')} checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} />
        </FormModal>
    );
};

export default NewsFormModal;
