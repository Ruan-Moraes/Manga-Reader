import { useTranslation } from 'react-i18next';

import { SectionHeader } from '@ui/SectionHeader';
import { StatusDot } from '@ui/StatusDot';
import { STATUS_TILES } from './helpData';

const HelpStatusSection = () => {
    const { t } = useTranslation('help');

    return (
        <section>
            <SectionHeader eyebrow={t('status.eyebrow')} title={t('status.title')} meta={t('status.meta')} className="mb-6" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {STATUS_TILES.map(tile => {
                    const label = t(`statusTiles.${tile.key}`);
                    const statusText = t(`statusLabel.${tile.status}`);

                    return (
                        <div
                            key={tile.key}
                            role="status"
                            aria-label={`${label}: ${statusText}`}
                            className="flex items-center gap-3 rounded-mr-xs border border-mr-border bg-mr-surface px-4 py-3"
                        >
                            <StatusDot status={tile.status} />
                            <span className="flex-1 text-mr-small font-mr-bold text-mr-fg">{label}</span>
                            <span className={`text-mr-tiny font-mr-bold ${tile.status === 'operating' ? 'text-mr-fg-subtle' : 'text-mr-danger'}`}>
                                {statusText}
                            </span>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default HelpStatusSection;
