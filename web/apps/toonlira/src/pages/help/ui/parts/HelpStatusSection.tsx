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
                            className="flex items-center gap-3 rounded-ui-xs border border-ui-border bg-ui-surface px-4 py-3"
                        >
                            <StatusDot status={tile.status} />
                            <span className="flex-1 text-ui-small font-ui-bold text-ui-fg">{label}</span>
                            <span className={`text-ui-tiny font-ui-bold ${tile.status === 'operating' ? 'text-ui-fg-subtle' : 'text-ui-danger'}`}>
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
