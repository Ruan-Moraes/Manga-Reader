import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { ROUTES } from '@shared/constant/ROUTES';
import useAppNavigate from '@shared/hook/useAppNavigate';

import { eventStatus, findEvent, fmtRange, type EventLiveStatus } from './eventsData';
import { CountdownBox } from './parts/CountdownBox';
import { StatusPill } from './parts/StatusPill';
import './events.css';

const Stat = ({ label, value, accent }: { label: string; value: string | number; accent?: string }) => (
    <div style={{ padding: '12px 14px', background: 'var(--mr-surface-muted)', border: '1px solid var(--mr-border)', borderRadius: 4 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--mr-fg-subtle)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: accent || 'var(--mr-fg)', letterSpacing: '.0625rem' }}>{value}</div>
    </div>
);

const EventDetails = () => {
    const { eventId } = useParams();
    const { t } = useTranslation('event');
    const navigate = useAppNavigate();
    const back = () => navigate(ROUTES.EVENTS);

    const event = findEvent(eventId);

    if (!event) {
        return (
            <div className="events-page" style={{ textAlign: 'center', padding: '80px 20px' }}>
                <div style={{ color: 'var(--mr-fg-subtle)' }}>{t('notFound')}</div>
                <button type="button" onClick={back} style={{ marginTop: 16, padding: '10px 18px', background: 'var(--mr-accent)', color: 'var(--mr-on-accent)', border: 'none', borderRadius: 2, fontWeight: 800, cursor: 'pointer' }}>
                    {t('backToEventsShort')}
                </button>
            </div>
        );
    }

    const status = eventStatus(event);
    const accent = event.accent || (event.type === 'special' ? 'var(--mr-accent)' : 'var(--mr-fg-disabled)');
    const isSpecial = event.type === 'special';
    const statusLabel: Record<EventLiveStatus, string> = {
        active: t('ui.statusActive'),
        upcoming: t('ui.statusUpcoming'),
        ended: t('ui.statusEnded'),
    };

    return (
        <main>
            <div style={{ position: 'relative', height: 'min(280px, 40vw)', minHeight: 200, background: event.cover, overflow: 'hidden' }}>
                <div aria-hidden style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.2) 0%, transparent 60%)', mixBlendMode: 'overlay' }} />
                <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(0,0,0,0.2) 0%,rgba(22,22,22,1) 100%)' }} />
                <button
                    type="button"
                    onClick={back}
                    aria-label={t('backToEventsShort')}
                    style={{ position: 'absolute', top: 16, left: 16, zIndex: 2, width: 40, height: 40, borderRadius: 2, background: 'var(--mr-overlay)', border: '1px solid var(--mr-border-subtle)', color: 'var(--mr-on-overlay)', fontSize: 18, cursor: 'pointer', backdropFilter: 'blur(8px)' }}
                >
                    ‹
                </button>
            </div>

            <div className="events-page" style={{ marginTop: -60, position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
                    {isSpecial && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--mr-overlay-strong)', color: accent, padding: '6px 12px', borderRadius: 2, fontSize: 11, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', border: `1px solid ${accent}`, boxShadow: `0 0 12px ${accent}66` }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: accent }} />
                            {t('ui.special')}
                        </span>
                    )}
                    <StatusPill status={status} />
                </div>

                {event.tagline && <div style={{ fontSize: 12, fontWeight: 700, color: accent, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 8 }}>{event.tagline}</div>}
                <h1 style={{ fontSize: 'clamp(24px,5vw,36px)', fontWeight: 800, color: 'var(--mr-fg)', margin: '0 0 12px', letterSpacing: '.0625rem', lineHeight: 1.15 }}>{event.name}</h1>
                <p style={{ fontSize: 15, color: 'var(--mr-fg-muted)', lineHeight: 1.65, margin: '0 0 24px', letterSpacing: '.0625rem', maxWidth: 680 }}>{event.description}</p>

                <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', marginBottom: 24 }}>
                    <Stat label={t('ui.statPeriod')} value={fmtRange(event.start, event.end)} />
                    {!!event.chapters && event.chapters > 0 && <Stat label={t('ui.statChapters')} value={event.chapters} />}
                    {!!event.participants && event.participants > 0 && <Stat label={t('ui.statParticipants')} value={event.participants.toLocaleString('pt-BR')} />}
                    <Stat label={t('ui.statStatus')} value={statusLabel[status]} accent={accent} />
                </div>

                {(status === 'active' || status === 'upcoming') && (
                    <div style={{ marginBottom: 24 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--mr-fg-disabled)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8 }}>{status === 'active' ? t('ui.endsIn') : t('ui.startsIn')}</div>
                        <CountdownBox targetIso={status === 'active' ? event.end : event.start} accent={accent} />
                    </div>
                )}

                {event.rewards && event.rewards.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--mr-fg)', margin: '0 0 12px', letterSpacing: '.08em', textTransform: 'uppercase' }}>{t('ui.rewards')}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {event.rewards.map((r, i) => (
                                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 14px', background: 'var(--mr-surface-muted)', border: '1px solid var(--mr-border)', borderRadius: 4 }}>
                                    <span style={{ color: accent, fontSize: 14 }}>◆</span>
                                    <span style={{ fontSize: 13, color: 'var(--mr-fg-muted)', letterSpacing: '.0625rem' }}>{r}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <button
                    type="button"
                    disabled={status === 'ended'}
                    style={{
                        width: '100%', maxWidth: 320, padding: '14px 20px', background: status === 'ended' ? 'var(--mr-surface-elevated)' : accent, color: status === 'ended' ? 'var(--mr-fg-disabled)' : 'var(--mr-on-accent)',
                        border: 'none', borderRadius: 2, fontWeight: 800, fontSize: 13, letterSpacing: '.12em', textTransform: 'uppercase',
                        cursor: status === 'ended' ? 'not-allowed' : 'pointer', boxShadow: status === 'active' ? `0 4px 16px ${accent}44` : 'none', fontFamily: 'inherit',
                    }}
                >
                    {status === 'active' ? t('ui.ctaActive') : status === 'upcoming' ? t('ui.ctaUpcoming') : t('ui.ctaEnded')}
                </button>
            </div>
        </main>
    );
};

export default EventDetails;
