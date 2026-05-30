import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Textarea } from '@ui/Textarea';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, type LanguageTag, type LocalizedStringList } from '@shared/type/i18n';

type PlanFormFeaturesInputProps = {
    value: LocalizedStringList;
    onChange: (next: LocalizedStringList) => void;
};

const featuresMapToText = (map: LocalizedStringList, lang: LanguageTag) => (map[lang] ?? []).join('\n');

const featuresTextToList = (text: string): string[] =>
    text
        .split('\n')
        .map(f => f.trim())
        .filter(Boolean);

const PlanFormFeaturesInput = ({ value, onChange }: PlanFormFeaturesInputProps) => {
    const { t } = useTranslation('admin');
    const [tab, setTab] = useState<LanguageTag>(DEFAULT_LANGUAGE);

    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold">
                {t('planForm.featuresLabel')}
                <span className="ml-1 text-red-500">*</span>
            </span>
            <div className="flex gap-1 border-b border-tertiary">
                {SUPPORTED_LANGUAGES.map(lang => {
                    const filled = (value[lang] ?? []).length > 0;
                    const isActive = tab === lang;
                    return (
                        <button
                            key={lang}
                            type="button"
                            onClick={() => setTab(lang)}
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
            <Textarea
                rows={3}
                value={featuresMapToText(value, tab)}
                onChange={e =>
                    onChange({
                        ...value,
                        [tab]: featuresTextToList(e.target.value),
                    })
                }
                placeholder={t('planForm.featuresPlaceholder')}
            />
        </div>
    );
};

export default PlanFormFeaturesInput;
