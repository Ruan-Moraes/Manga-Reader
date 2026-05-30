import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Checkbox } from '@ui/Checkbox';
import { Switch } from '@ui/Switch';
import { Badge } from '@ui/Badge';
import { Label } from '@ui/Label';
import { Card } from '@ui/Card';

const GENRES_ALL = ['Shounen', 'Seinen', 'Shoujo', 'Josei', 'Isekai', 'Romance', 'Ação', 'Fantasia', 'Terror', 'Comédia', 'Histórico', 'Sci-Fi'];

const SettingCard = ({ children }: { children: React.ReactNode }) => (
    <Card variant="default" className="p-5">
        {children}
    </Card>
);

const RecommendationsTab = () => {
    const { t } = useTranslation('user');
    const [favGenres, setFavGenres] = useState<string[]>(['Seinen', 'Dark Fantasy', 'Ação']);
    const [ptbr, setPtbr] = useState(true);
    const [en, setEn] = useState(false);
    const [adultContent, setAdultContent] = useState(false);

    const toggleGenre = (g: string) => setFavGenres(prev => (prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]));

    return (
        <div className="flex flex-col gap-4">
            <SettingCard>
                <Label className="mb-3 block">{t('profile.recommendations.genresLabel')}</Label>
                <div className="flex flex-wrap gap-2">
                    {GENRES_ALL.map(g => (
                        <button
                            key={g}
                            type="button"
                            onClick={() => toggleGenre(g)}
                            className={`rounded-mr-full border px-3 py-1 text-mr-tiny font-mr-bold transition-colors ${
                                favGenres.includes(g)
                                    ? 'border-mr-accent bg-mr-accent text-mr-primary'
                                    : 'border-mr-border text-mr-fg-muted hover:border-mr-accent hover:text-mr-accent'
                            }`}
                        >
                            {g}
                        </button>
                    ))}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                    {favGenres.map(g => (
                        <Badge key={g}>{g}</Badge>
                    ))}
                </div>
            </SettingCard>

            <SettingCard>
                <Label className="mb-3 block">{t('profile.recommendations.languagesLabel')}</Label>
                <div className="flex flex-col gap-2">
                    <Checkbox label={t('settings.language.checkboxPtBR')} checked={ptbr} onChange={e => setPtbr(e.target.checked)} />
                    <Checkbox label={t('settings.language.checkboxEn')} checked={en} onChange={e => setEn(e.target.checked)} />
                </div>
            </SettingCard>

            <SettingCard>
                <Switch
                    checked={adultContent}
                    onChange={setAdultContent}
                    label={t('profile.recommendations.adultContentLabel')}
                    description={t('profile.recommendations.adultContentDesc')}
                />
            </SettingCard>
        </div>
    );
};

export default RecommendationsTab;
