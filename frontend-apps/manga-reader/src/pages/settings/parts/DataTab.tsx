import { useTranslation } from 'react-i18next';

import { Button } from '@ui/Button';
import { Card } from '@ui/Card';

import { SettingSection } from './settingsShared';

const DataTab = () => {
    const { t } = useTranslation('user');

    return (
        <>
            <SettingSection title={t('settings.data.cacheSection')}>
                <Card variant="flat" className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-mr-small font-mr-bold text-mr-fg">{t('settings.data.readerCache')}</p>
                            <p className="text-mr-tiny text-mr-fg-muted">234 MB / 500 MB usados</p>
                        </div>
                        <Button variant="raised" onClick={() => {}}>
                            {t('settings.data.clearCache')}
                        </Button>
                    </div>
                </Card>
            </SettingSection>

            <SettingSection title={t('settings.data.librarySection')}>
                <Button variant="raised" onClick={() => {}}>
                    {t('settings.data.exportLibrary')}
                </Button>
                <Button variant="raised" onClick={() => {}}>
                    {t('settings.data.importList')}
                </Button>
            </SettingSection>

            <SettingSection title={t('settings.data.historySection')}>
                <Button variant="ghost" onClick={() => {}}>
                    {t('settings.data.clearHistory')}
                </Button>
            </SettingSection>
        </>
    );
};

export default DataTab;
