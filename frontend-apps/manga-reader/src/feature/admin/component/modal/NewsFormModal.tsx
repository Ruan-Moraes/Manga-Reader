import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import BaseCheckbox from '@shared/component/input/BaseCheckbox';
import BaseInput from '@shared/component/input/BaseInput';
import BaseTextArea from '@shared/component/input/BaseTextArea';
import LocalizedTextInput from '@shared/component/form/LocalizedTextInput';
import AdminModal from './AdminModal';
import {
    DEFAULT_LANGUAGE,
    SUPPORTED_LANGUAGES,
    type LanguageTag,
    type LocalizedString,
    type LocalizedStringList,
} from '@shared/type/i18n';

import type {
    AdminNews,
    CreateNewsRequest,
    UpdateNewsRequest,
} from '../../type/admin.types';

type NewsFormModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateNewsRequest | UpdateNewsRequest) => void;
    news?: AdminNews | null;
    isSubmitting: boolean;
};

const splitContent = (text: string): string[] =>
    text.split('\n\n').map(s => s.trim()).filter(Boolean);

const NewsFormModal = ({
    isOpen,
    onClose,
    onSubmit,
    news,
    isSubmitting,
}: NewsFormModalProps) => {
    const { t } = useTranslation('admin');

    const [category, setCategory] = useState('PRINCIPAIS');
    const [coverImage, setCoverImage] = useState('');
    const [tags, setTags] = useState('');
    const [authorName, setAuthorName] = useState('');
    const [source, setSource] = useState('');
    const [readTime, setReadTime] = useState(3);
    const [isExclusive, setIsExclusive] = useState(false);
    const [isFeatured, setIsFeatured] = useState(false);

    const [title, setTitle] = useState<LocalizedString>({});
    const [subtitle, setSubtitle] = useState<LocalizedString>({});
    const [excerpt, setExcerpt] = useState<LocalizedString>({});
    const [content, setContent] = useState<LocalizedStringList>({});
    const [contentTab, setContentTab] = useState<LanguageTag>(DEFAULT_LANGUAGE);

    useEffect(() => {
        if (news) {
            setCategory(news.category);
            setCoverImage(news.coverImage ?? '');
            setTags((news.tags ?? []).join(', '));
            setAuthorName(news.authorName ?? '');
            setSource(news.source ?? '');
            setReadTime(news.readTime);
            setIsExclusive(news.isExclusive);
            setIsFeatured(news.isFeatured);
            setTitle(news.title ?? {});
            setSubtitle(news.subtitle ?? {});
            setExcerpt(news.excerpt ?? {});
            setContent(news.content ?? {});
        } else {
            setCategory('PRINCIPAIS');
            setCoverImage('');
            setTags('');
            setAuthorName('');
            setSource('');
            setReadTime(3);
            setIsExclusive(false);
            setIsFeatured(false);
            setTitle({});
            setSubtitle({});
            setExcerpt({});
            setContent({});
        }
        setContentTab(DEFAULT_LANGUAGE);
    }, [news, isOpen]);

    const ptTitle = (title[DEFAULT_LANGUAGE] ?? '').trim();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!ptTitle) return;

        const payload: CreateNewsRequest = {
            title,
            category,
            readTime,
            isExclusive,
            isFeatured,
            ...(Object.keys(subtitle).length ? { subtitle } : {}),
            ...(Object.keys(excerpt).length ? { excerpt } : {}),
            ...(Object.keys(content).length ? { content } : {}),
            ...(coverImage ? { coverImage } : {}),
            ...(tags
                ? {
                      tags: tags
                          .split(',')
                          .map(s => s.trim())
                          .filter(Boolean),
                  }
                : {}),
            ...(authorName ? { authorName } : {}),
            ...(source ? { source } : {}),
        };

        onSubmit(payload);
    };

    return (
        <AdminModal isOpen={isOpen} onClose={onClose}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-2">
                <h3 className="text-sm font-bold">
                    {news
                        ? t('newsForm.editTitle', 'Editar Notícia')
                        : t('newsForm.newTitle', 'Nova Notícia')}
                </h3>

                <LocalizedTextInput
                    label={t('newsForm.title', 'Título')}
                    value={title}
                    onChange={setTitle}
                    maxLength={300}
                />

                <LocalizedTextInput
                    label={t('newsForm.subtitle', 'Subtítulo')}
                    value={subtitle}
                    onChange={setSubtitle}
                    requiredLanguages={[]}
                    maxLength={500}
                />

                <LocalizedTextInput
                    label={t('newsForm.excerpt', 'Resumo')}
                    value={excerpt}
                    onChange={setExcerpt}
                    multiline
                    rows={3}
                    requiredLanguages={[]}
                />

                <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold">
                        {t('newsForm.content')}
                    </span>
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
                                        isActive
                                            ? 'border-b-2 border-quaternary-default text-quaternary-default'
                                            : 'text-tertiary hover:text-primary'
                                    }`}
                                >
                                    {lang}
                                    {filled && (
                                        <span className="text-quaternary-default">●</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    <BaseTextArea
                        variant="outlined"
                        rows={6}
                        placeholder=""
                        value={(content[contentTab] ?? []).join('\n\n')}
                        onChange={e =>
                            setContent({
                                ...content,
                                [contentTab]: splitContent(e.target.value),
                            })
                        }
                    />
                </div>

                <BaseInput
                    label={t('newsForm.category', 'Categoria')}
                    variant="outlined"
                    type="text"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                />

                <BaseInput
                    label={t('newsForm.coverImage', 'Imagem de capa (URL)')}
                    variant="outlined"
                    type="text"
                    value={coverImage}
                    onChange={e => setCoverImage(e.target.value)}
                />

                <BaseInput
                    label={t('newsForm.tags', 'Tags (separadas por vírgula)')}
                    variant="outlined"
                    type="text"
                    value={tags}
                    onChange={e => setTags(e.target.value)}
                />

                <BaseInput
                    label={t('newsForm.author', 'Autor')}
                    variant="outlined"
                    type="text"
                    value={authorName}
                    onChange={e => setAuthorName(e.target.value)}
                />

                <BaseInput
                    label={t('newsForm.source', 'Fonte')}
                    variant="outlined"
                    type="text"
                    value={source}
                    onChange={e => setSource(e.target.value)}
                />

                <BaseInput
                    label={t('newsForm.readTime', 'Tempo de leitura (min)')}
                    variant="outlined"
                    type="number"
                    min="1"
                    value={String(readTime)}
                    onChange={e => setReadTime(parseInt(e.target.value, 10) || 1)}
                />

                <BaseCheckbox
                    label={t('newsForm.exclusive', 'Exclusiva')}
                    checked={isExclusive}
                    onChange={setIsExclusive}
                />

                <BaseCheckbox
                    label={t('newsForm.featured', 'Destaque')}
                    checked={isFeatured}
                    onChange={setIsFeatured}
                />

                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3 py-1.5 text-sm rounded-xs hover:bg-tertiary/30"
                    >
                        {t('common.cancel', 'Cancelar')}
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || !ptTitle}
                        className="px-3 py-1.5 text-sm font-semibold rounded-xs bg-quaternary-default hover:bg-quaternary-default/80 disabled:opacity-50"
                    >
                        {isSubmitting
                            ? t('common.saving', 'Salvando...')
                            : t('common.save', 'Salvar')}
                    </button>
                </div>
            </form>
        </AdminModal>
    );
};

export default NewsFormModal;
