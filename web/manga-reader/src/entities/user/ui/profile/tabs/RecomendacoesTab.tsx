import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';

import { showErrorToast, showSuccessToast } from '@shared/service/util/toastService';

import { removeRecommendation } from '../../../api/userService';
import { type EnrichedProfile, type RecommendedTitle } from '../../../model/user.types';
import { PE, peIntro } from './peShared';

const MAX = 6;

type Props = { profile: EnrichedProfile; onSaved: () => void };

const RecomendacoesTab = ({ profile, onSaved }: Props) => {
    const { t } = useTranslation('user');
    const [items, setItems] = useState<RecommendedTitle[]>(profile.recommendations ?? []);

    const removeMany = async (ids: string[], rollback: RecommendedTitle[]) => {
        try {
            await Promise.all(ids.map(id => removeRecommendation(id)));
            showSuccessToast(t('profile.edit.saved'));
            onSaved();
        } catch {
            setItems(rollback);
            showErrorToast(t('profile.edit.saveError'));
        }
    };

    const toggleOff = (titleId: string) => {
        const previous = items;
        setItems(prev => prev.filter(r => r.titleId !== titleId));
        removeMany([titleId], previous);
    };

    const clearAll = () => {
        const previous = items;
        setItems([]);
        removeMany(previous.map(r => r.titleId), previous);
    };

    return (
        <div>
            <p style={{ ...peIntro, marginBottom: 14 }}>{t('profile.edit.recommendations.intro')}</p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '8px 12px', background: PE.cardBg, border: `1px solid ${PE.cardBorder}`, borderRadius: 2 }}>
                <span style={{ fontSize: 12, color: PE.fg, fontWeight: 700 }}>{t('profile.edit.recommendations.counter', { count: items.length, max: MAX })}</span>
                {items.length > 0 && (
                    <button type="button" onClick={clearAll} style={{ background: 'none', border: 0, color: PE.danger, fontSize: 11, fontWeight: 700, cursor: 'pointer', padding: 0, fontFamily: 'inherit', letterSpacing: '.0625rem' }}>
                        {t('profile.edit.recommendations.clear')}
                    </button>
                )}
            </div>

            {items.length === 0 ? (
                <p style={{ fontSize: 12, color: PE.hint, textAlign: 'center', padding: '24px 0' }}>{t('profile.edit.recommendations.empty')}</p>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 10 }}>
                    {items.map(rec => (
                        <button
                            key={rec.titleId}
                            type="button"
                            onClick={() => toggleOff(rec.titleId)}
                            aria-label={t('profile.edit.recommendations.remove')}
                            style={{
                                position: 'relative',
                                padding: 0,
                                cursor: 'pointer',
                                background: 'linear-gradient(135deg,#2a1f0f,#161616)',
                                border: `1px solid ${PE.accent}`,
                                borderRadius: 4,
                                aspectRatio: '2/3',
                                overflow: 'hidden',
                                boxShadow: '-0.25rem 0.25rem 0 0 rgba(221,218,42,0.25)',
                                transition: 'all .2s',
                            }}
                        >
                            {rec.titleCover ? (
                                <img src={rec.titleCover} alt={rec.titleName} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'clamp(20px,5vw,32px)', fontWeight: 800, color: 'rgba(221,218,42,0.4)' }}>
                                    {rec.titleName?.charAt(0) ?? '?'}
                                </div>
                            )}
                            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%', background: 'linear-gradient(180deg, transparent 0%, rgba(22,22,22,0.95) 80%)' }} />
                            <div style={{ position: 'absolute', left: 6, right: 6, bottom: 6, color: '#fff', fontSize: 10, fontWeight: 700, lineHeight: 1.2, textAlign: 'left', letterSpacing: '.05em', textShadow: '0 1px 2px rgba(0,0,0,0.8)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {rec.titleName}
                            </div>
                            <div style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, background: PE.accent, color: '#161616', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Check size={14} />
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RecomendacoesTab;
