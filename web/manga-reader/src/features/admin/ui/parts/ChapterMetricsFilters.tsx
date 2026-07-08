import { useTranslation } from 'react-i18next';

import Input from '@ui/Input';
import { Select } from '@ui/Select';
import type { ChapterMetricsFilter, MetricsDevice, MetricsPlatform } from '@entities/chapter';

type ChapterMetricsFiltersProps = {
    filter: ChapterMetricsFilter;
    onChange: (filter: ChapterMetricsFilter) => void;
};

const DEVICES: MetricsDevice[] = ['all', 'mobile', 'desktop', 'tablet'];
const PLATFORMS: MetricsPlatform[] = ['all', 'web', 'android', 'ios'];

/** Filtros de métricas — uma linha acima dos gráficos (período, dispositivo, plataforma). */
const ChapterMetricsFilters = ({ filter, onChange }: ChapterMetricsFiltersProps) => {
    const { t } = useTranslation('admin');

    return (
        <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1.5">
                <span className="text-mr-tiny font-mr-bold text-mr-fg-muted">{t('dashboard.chapters.metrics.filterFrom')}</span>
                <Input type="date" value={filter.from?.slice(0, 10) ?? ''} onChange={e => onChange({ ...filter, from: e.target.value || undefined })} />
            </label>
            <label className="flex flex-col gap-1.5">
                <span className="text-mr-tiny font-mr-bold text-mr-fg-muted">{t('dashboard.chapters.metrics.filterTo')}</span>
                <Input type="date" value={filter.to?.slice(0, 10) ?? ''} onChange={e => onChange({ ...filter, to: e.target.value || undefined })} />
            </label>
            <label className="flex flex-col gap-1.5">
                <span className="text-mr-tiny font-mr-bold text-mr-fg-muted">{t('dashboard.chapters.metrics.filterDevice')}</span>
                <Select
                    value={filter.device ?? 'all'}
                    onChange={e => onChange({ ...filter, device: e.target.value as MetricsDevice })}
                    options={DEVICES.map(device => ({ value: device, label: t(`dashboard.chapters.metrics.device.${device}`) }))}
                    aria-label={t('dashboard.chapters.metrics.filterDevice')}
                    className="min-w-[130px]"
                />
            </label>
            <label className="flex flex-col gap-1.5">
                <span className="text-mr-tiny font-mr-bold text-mr-fg-muted">{t('dashboard.chapters.metrics.filterPlatform')}</span>
                <Select
                    value={filter.platform ?? 'all'}
                    onChange={e => onChange({ ...filter, platform: e.target.value as MetricsPlatform })}
                    options={PLATFORMS.map(platform => ({ value: platform, label: t(`dashboard.chapters.metrics.platform.${platform}`) }))}
                    aria-label={t('dashboard.chapters.metrics.filterPlatform')}
                    className="min-w-[130px]"
                />
            </label>
        </div>
    );
};

export default ChapterMetricsFilters;
