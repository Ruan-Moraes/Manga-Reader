import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ROUTES } from '@shared/constant/ROUTES';
import useAppNavigate from '@shared/hook/useAppNavigate';

import { EVENTS, eventStatus } from './eventsData';
import { EventNormalCard } from './parts/EventNormalCard';
import { EventSpecialCard } from './parts/EventSpecialCard';
import './events.css';

type Filter = 'all' | 'special' | 'normal' | 'active' | 'ended';

const SectionHeader = ({ glyph, label, count }: { glyph: string; label: string; count: number }) => (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #222' }}>
        <span style={{ color: 'var(--mr-accent)', fontSize: 14 }}>{glyph}</span>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '.08em', textTransform: 'uppercase' }}>{label}</h2>
        <span style={{ fontSize: 12, color: '#666', marginLeft: 'auto' }}>{count}</span>
    </div>
);

const Events = () => {
    const { t } = useTranslation('event');
    const navigate = useAppNavigate();

    const [filter, setFilter] = useState<Filter>('all');
    const [query, setQuery] = useState('');

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return EVENTS.filter(ev => {
            const status = eventStatus(ev);
            if (filter === 'special' && ev.type !== 'special') return false;
            if (filter === 'normal' && ev.type !== 'normal') return false;
            if (filter === 'active' && status !== 'active') return false;
            if (filter === 'ended' && status !== 'ended') return false;
            if (q && !ev.name.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [filter, query]);

    const specials = filtered.filter(e => e.type === 'special');
    const normals = filtered.filter(e => e.type === 'normal');

    const open = (id: string) => navigate(ROUTES.EVENT_DETAIL(id));

    const filters: Array<[Filter, string]> = [
        ['all', t('ui.filterAll')],
        ['special', t('ui.filterSpecial')],
        ['normal', t('ui.filterNormal')],
        ['active', t('ui.filterActive')],
        ['ended', t('ui.filterEnded')],
    ];

    return (
        <main className="events-page">
            <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--mr-accent)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 6 }}>{t('page.eyebrow')}</div>
                <h1 style={{ fontSize: 'clamp(24px,5vw,32px)', color: '#fff', margin: '0 0 8px', letterSpacing: '.0625rem', fontWeight: 800 }}>{t('page.title')}</h1>
                <p style={{ color: '#999', fontSize: 14, margin: 0, maxWidth: 540, lineHeight: 1.5 }}>{t('ui.sub')}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#666', fontSize: 14 }}>⌕</span>
                    <input
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder={t('ui.searchPlaceholder')}
                        aria-label={t('ui.searchPlaceholder')}
                        style={{ width: '100%', padding: '12px 16px 12px 38px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 2, color: '#fff', fontSize: 14, letterSpacing: '.0625rem', outline: 'none', transition: 'border-color .15s', boxSizing: 'border-box' }}
                        onFocus={e => (e.target.style.borderColor = 'var(--mr-accent)')}
                        onBlur={e => (e.target.style.borderColor = '#2a2a2a')}
                    />
                </div>
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginLeft: -12, paddingLeft: 12, marginRight: -12, paddingRight: 12 }}>
                    {filters.map(([id, label]) => {
                        const active = filter === id;
                        return (
                            <button
                                key={id}
                                type="button"
                                onClick={() => setFilter(id)}
                                style={{
                                    flexShrink: 0, padding: '8px 16px', background: active ? 'var(--mr-accent)' : 'transparent', color: active ? '#161616' : '#bbb',
                                    border: `1px solid ${active ? 'var(--mr-accent)' : '#2a2a2a'}`, borderRadius: 2, fontSize: 12, fontWeight: 700, letterSpacing: '.08em',
                                    textTransform: 'uppercase', cursor: 'pointer', transition: 'all .15s', fontFamily: 'inherit',
                                }}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {specials.length > 0 && (
                <section style={{ marginBottom: 36 }}>
                    <SectionHeader glyph="✦" label={t('ui.specialEvents')} count={specials.length} />
                    <div className="events-special-grid">
                        {specials.map(ev => (
                            <EventSpecialCard key={ev.id} event={ev} onOpen={open} />
                        ))}
                    </div>
                </section>
            )}

            {normals.length > 0 && (
                <section>
                    <SectionHeader glyph="●" label={t('ui.normalEvents')} count={normals.length} />
                    <div className="events-normal-grid">
                        {normals.map(ev => (
                            <EventNormalCard key={ev.id} event={ev} onOpen={open} />
                        ))}
                    </div>
                </section>
            )}

            {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>⚐</div>
                    <div style={{ fontSize: 14, color: '#999' }}>{t('ui.empty')}</div>
                </div>
            )}
        </main>
    );
};

export default Events;
