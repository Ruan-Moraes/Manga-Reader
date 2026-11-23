import { HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { PageContainer } from '@ui/PageContainer';
import { SearchField } from '@ui/SearchField';
import { StatusDot } from '@ui/StatusDot';

type HelpSearchProps = {
    query: string;
    onQueryChange: (q: string) => void;
};

const HelpSearch = ({ query, onQueryChange }: HelpSearchProps) => {
    const { t } = useTranslation('help');

    const popularChips = [t('search.chips.changeLanguage'), t('search.chips.spoiler'), t('search.chips.importMal'), t('search.chips.cancelSupport')];

    return (
        <div className="border-b border-ui-border-subtle bg-ui-secondary py-12 sm:py-16">
            <PageContainer>
                <div className="mx-auto max-w-2xl text-center">
                    <div className="mb-3 flex justify-center">
                        <div className="flex size-12 items-center justify-center rounded-ui-xs bg-ui-accent-25 text-ui-accent-fg">
                            <HelpCircle className="size-6" />
                        </div>
                    </div>
                    <p className="ui-label mb-2 text-ui-accent-fg">{t('search.eyebrow')}</p>
                    <h1 className="text-ui-h1 font-ui-extrabold tracking-mr text-ui-fg">{t('search.title')}</h1>
                    <p className="mt-2 text-ui-body text-ui-fg-muted">{t('search.description')}</p>
                    <div className="mt-6">
                        <label htmlFor="help-search" className="sr-only">
                            {t('search.inputLabel')}
                        </label>
                        <SearchField id="help-search" value={query} onChange={onQueryChange} shortcut="⌘K" placeholder={t('search.placeholder')} size="lg" />
                    </div>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                        {popularChips.map(chip => (
                            <button
                                key={chip}
                                type="button"
                                onClick={() => onQueryChange(chip)}
                                className="rounded-ui-full border border-ui-border px-3 py-1 text-ui-tiny text-ui-fg-muted transition-colors hover:border-ui-accent-border hover:text-ui-accent-fg"
                            >
                                {chip}
                            </button>
                        ))}
                    </div>
                    <div className="mt-4 inline-flex items-center gap-2 text-ui-tiny text-ui-fg-muted">
                        <StatusDot status="operating" size={8} />
                        {t('search.systemStatus')}
                        <button type="button" onClick={() => {}} className="text-ui-accent-fg underline-offset-2 hover:underline">
                            {t('search.viewDetails')}
                        </button>
                    </div>
                </div>
            </PageContainer>
        </div>
    );
};

export default HelpSearch;
