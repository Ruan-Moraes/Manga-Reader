import { useTranslation } from 'react-i18next';

import { useCountdown } from '@shared/hook/useCountdown';

const Cell = ({ value, label, accent }: { value: number; label: string; accent: string }) => (
    <div style={{ textAlign: 'center', minWidth: 44 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums', letterSpacing: '.0625rem' }}>{String(value).padStart(2, '0')}</div>
        <div style={{ fontSize: 9, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '.12em', marginTop: 2 }}>{label}</div>
    </div>
);

export const CountdownBox = ({ targetIso, accent }: { targetIso: string; accent: string }) => {
    const { t } = useTranslation('event');
    const c = useCountdown(targetIso);
    if (!c) return null;

    const sep = <div style={{ color: '#444', alignSelf: 'center' }}>:</div>;

    return (
        <div style={{ display: 'inline-flex', gap: 4, padding: '10px 12px', background: 'rgba(0,0,0,0.35)', border: `1px solid ${accent}33`, borderRadius: 4, backdropFilter: 'blur(8px)' }}>
            <Cell value={c.d} label={t('ui.cdDays')} accent={accent} />
            {sep}
            <Cell value={c.h} label={t('ui.cdHours')} accent={accent} />
            {sep}
            <Cell value={c.m} label={t('ui.cdMin')} accent={accent} />
            {sep}
            <Cell value={c.s} label={t('ui.cdSec')} accent={accent} />
        </div>
    );
};
