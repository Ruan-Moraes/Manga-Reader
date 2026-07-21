import { useTranslation } from 'react-i18next';

import type { EventLiveStatus } from '../eventsData';

/**
 * Pílula de status — **alinhada à paleta do sistema** (decisão do dono): "Ativo"
 * usa o accent amarelo-lima (com glow de "ao vivo"), **não** o verde do protótipo.
 */
const MAP: Record<EventLiveStatus, { key: string; bg: string; fg: string; dot: string; glow: boolean }> = {
    active: { key: 'statusActive', bg: 'var(--mr-accent-10)', fg: 'var(--mr-accent-fg)', dot: 'var(--mr-accent)', glow: true },
    upcoming: { key: 'statusUpcoming', bg: 'var(--mr-surface-elevated)', fg: 'var(--mr-fg-muted)', dot: 'var(--mr-fg-subtle)', glow: false },
    ended: { key: 'statusEnded', bg: 'var(--mr-surface-elevated)', fg: 'var(--mr-fg-disabled)', dot: 'var(--mr-fg-disabled)', glow: false },
};

export const StatusPill = ({ status }: { status: EventLiveStatus }) => {
    const { t } = useTranslation('event');
    const cfg = MAP[status];
    return (
        <span
            style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700,
                padding: '4px 10px', borderRadius: 2, background: cfg.bg, color: cfg.fg,
                letterSpacing: '.08em', textTransform: 'uppercase',
            }}
        >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, boxShadow: cfg.glow ? `0 0 8px ${cfg.dot}` : 'none' }} />
            {t(`ui.${cfg.key}`)}
        </span>
    );
};
