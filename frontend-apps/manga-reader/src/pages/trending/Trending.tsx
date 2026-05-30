import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PageContainer } from '@ui/PageContainer';
import { SectionHeader } from '@ui/SectionHeader';
import { SegmentedControl } from '@ui/SegmentedControl';
import { Select } from '@ui/Select';

import TrendingSection, { MANGA_LIST } from './parts/TrendingSection';

type Period = 'today' | 'week' | 'month' | 'all';

const Trending = () => {
    const { t } = useTranslation('home');
    const [period, setPeriod] = useState<Period>('week');
    const [cat, setCat] = useState('all');

    const PERIOD_ITEMS = [
        { value: 'today', label: t('trending.periodToday') },
        { value: 'week', label: t('trending.periodWeek') },
        { value: 'month', label: t('trending.periodMonth') },
        { value: 'all', label: t('trending.periodAll') },
    ];

    const CAT_OPTIONS = [
        { value: 'all', label: t('trending.categoryAll') },
        { value: 'shounen', label: 'Shounen' },
        { value: 'seinen', label: 'Seinen' },
        { value: 'shoujo', label: 'Shoujo' },
        { value: 'manhwa', label: 'Manhwa' },
        { value: 'webtoon', label: 'Webtoon' },
    ];

    return (
        <PageContainer asMain size="wide" paddingY="md">
            <SectionHeader eyebrow={t('trending.eyebrow')} title={t('trending.title')} meta={t('trending.meta')} className="mb-6" />

            <div className="mb-8 flex flex-wrap gap-3">
                <SegmentedControl items={PERIOD_ITEMS} value={period} onChange={v => setPeriod(v as Period)} size="sm" />
                <Select value={cat} onChange={e => setCat(e.target.value)} options={CAT_OPTIONS} className="w-44" />
            </div>

            <TrendingSection mangas={MANGA_LIST} />
        </PageContainer>
    );
};

export default Trending;
