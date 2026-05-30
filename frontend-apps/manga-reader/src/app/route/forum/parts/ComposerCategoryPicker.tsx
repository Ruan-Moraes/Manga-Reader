import { useTranslation } from 'react-i18next';
import { Label } from '@ui/Label';
import type { ComposerCategory } from '../hook/useComposerFormState';

type Props = {
    value: ComposerCategory | null;
    onChange: (v: ComposerCategory) => void;
    error?: string;
};

const ComposerCategoryPicker = ({ value, onChange, error }: Props) => {
    const { t } = useTranslation('forum');

    const CATEGORIES: Array<{ value: ComposerCategory; label: string }> = [
        { value: 'discussion', label: t('composer.categories.discussion') },
        { value: 'spoiler', label: t('composer.categories.spoiler') },
        { value: 'question', label: t('composer.categories.question') },
        { value: 'news', label: t('composer.categories.news') },
        { value: 'other', label: t('composer.categories.other') },
    ];

    return (
        <div className="mb-5">
            <Label className="mb-2 block">{t('composer.categoryLabel')}</Label>
            <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(c => (
                    <button
                        key={c.value}
                        type="button"
                        onClick={() => onChange(c.value)}
                        className={`rounded-mr-full border px-3 py-1 text-mr-tiny font-mr-bold transition-colors ${
                            value === c.value
                                ? 'border-mr-accent bg-mr-accent text-mr-primary'
                                : 'border-mr-border text-mr-fg-muted hover:border-mr-accent hover:text-mr-accent'
                        }`}
                    >
                        {c.label}
                    </button>
                ))}
            </div>
            {error && <p className="mt-1 text-mr-tiny text-mr-danger">{error}</p>}
        </div>
    );
};

export default ComposerCategoryPicker;
