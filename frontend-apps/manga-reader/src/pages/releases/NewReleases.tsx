import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PageContainer } from '@ui/PageContainer';
import { SectionHeader } from '@ui/SectionHeader';
import { SearchField } from '@ui/SearchField';
import { Select } from '@ui/Select';
import { Switch } from '@ui/Switch';

import ReleasesGrid, { RELEASE_GROUPS } from './parts/ReleasesGrid';

const NewReleases = () => {
    const { t } = useTranslation('manga');
    const [query, setQuery] = useState('');
    const [lang, setLang] = useState('all');
    const [libraryOnly, setLibraryOnly] = useState(false);

    const totalToday = RELEASE_GROUPS[0]?.items.length ?? 0;

    const LANG_OPTIONS = [
        { value: 'all', label: t('releases.allLanguages') },
        { value: 'PT-BR', label: 'PT-BR' },
        { value: 'EN', label: 'EN' },
        { value: 'JP', label: 'JP' },
    ];

    const filtered = RELEASE_GROUPS.map(g => ({
        ...g,
        items: g.items.filter(item => {
            if (lang !== 'all' && item.lang !== lang) return false;
            if (query && !item.title.toLowerCase().includes(query.toLowerCase())) return false;
            return true;
        }),
    })).filter(g => g.items.length > 0);

    return (
        <PageContainer asMain size="default" paddingY="md">
            <SectionHeader eyebrow={t('releases.eyebrow')} title={t('releases.title')} meta={t('releases.todayMeta', { count: totalToday })} className="mb-6" />

            <div className="mb-6 flex flex-wrap items-center gap-3">
                <SearchField value={query} onChange={setQuery} placeholder={t('releases.filterPlaceholder')} className="flex-1 min-w-[180px]" />
                <Select value={lang} onChange={e => setLang(e.target.value)} options={LANG_OPTIONS} className="w-40" />
                <Switch checked={libraryOnly} onChange={setLibraryOnly} label={t('releases.libraryOnly')} />
            </div>

            <ReleasesGrid groups={filtered} libraryOnly={libraryOnly} />
        </PageContainer>
    );
};

export default NewReleases;
