import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { PageContainer } from '@ui/PageContainer';
import { SectionHeader } from '@ui/SectionHeader';
import { Input } from '@ui/Input';
import { Switch } from '@ui/Switch';
import { Label } from '@ui/Label';

import useComposerFormState from './hook/useComposerFormState';
import ComposerCategoryPicker from './parts/ComposerCategoryPicker';
import ComposerEditor from './parts/ComposerEditor';
import ComposerActions from './parts/ComposerActions';

const ForumComposer = () => {
    const { t } = useTranslation('forum');
    const {
        category,
        setCategory,
        title,
        setTitle,
        content,
        setContent,
        isSpoiler,
        setIsSpoiler,
        preview,
        setPreview,
        submitting,
        errors,
        setErrors,
        handleSubmit,
        navigate,
    } = useComposerFormState();

    // ⌘+Enter submit
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSubmit();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    });

    return (
        <PageContainer asMain size="narrow" paddingY="md">
            <SectionHeader eyebrow={t('page.title')} title={t('page.newTopic')} className="mb-6" />

            <ComposerCategoryPicker
                value={category}
                onChange={v => {
                    setCategory(v);
                    setErrors(p => ({ ...p, category: '' }));
                }}
                error={errors.category}
            />

            <div className="mb-5">
                <div className="mb-1 flex items-center justify-between">
                    <Label htmlFor="forum-title">{t('composer.titleLabel')}</Label>
                    <span className="text-mr-tiny text-mr-fg-subtle">{title.length}/120</span>
                </div>
                <Input
                    id="forum-title"
                    placeholder={t('composer.titlePlaceholder')}
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    error={errors.title}
                />
            </div>

            <ComposerEditor content={content} onChange={setContent} preview={preview} onTogglePreview={() => setPreview(p => !p)} error={errors.content} />

            <div className="mb-6">
                <Switch checked={isSpoiler} onChange={setIsSpoiler} label={t('composer.spoilerLabel')} description={t('composer.spoilerDescription')} />
            </div>

            <ComposerActions submitting={submitting} onCancel={() => navigate('/forum')} onSubmit={handleSubmit} />
        </PageContainer>
    );
};

export default ForumComposer;
