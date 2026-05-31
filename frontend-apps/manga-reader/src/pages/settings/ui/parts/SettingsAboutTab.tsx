import { useTranslation } from 'react-i18next';

import { Card } from '@ui/Card';
import { Kbd } from '@ui/Kbd';

import { SettingSection } from './settingsShared';

const SettingsAboutTab = () => {
    const { t } = useTranslation('user');

    const shortcuts = [
        { keys: ['←', '→'], id: 'navigatePages' },
        { keys: ['A', 'D'], id: 'navigateAlt' },
        { keys: ['F'], id: 'fullscreen' },
        { keys: ['B'], id: 'addLibrary' },
        { keys: ['⌘', 'K'], id: 'quickSearch' },
        { keys: ['⌘', 'Enter'], id: 'publish' },
        { keys: ['Esc'], id: 'close' },
    ] as const;

    return (
        <>
            <SettingSection title={t('settings.about.versionSection')}>
                <Card variant="flat" className="p-4">
                    <dl className="flex flex-col gap-1 text-mr-small">
                        <div className="flex gap-2">
                            <dt className="text-mr-fg-muted w-28">{t('settings.about.versionLabel')}</dt>
                            <dd className="font-mono text-mr-fg">3.0.0</dd>
                        </div>
                        <div className="flex gap-2">
                            <dt className="text-mr-fg-muted w-28">{t('settings.about.commitLabel')}</dt>
                            <dd className="font-mono text-mr-fg">7bc0848</dd>
                        </div>
                    </dl>
                </Card>
                <div className="flex gap-4 text-mr-small">
                    <a href="#" className="text-mr-accent hover:underline">
                        {t('settings.about.systemStatus')}
                    </a>
                    <a href="#" className="text-mr-accent hover:underline">
                        {t('settings.about.changelog')}
                    </a>
                </div>
            </SettingSection>

            <SettingSection title={t('settings.about.shortcutsSection')}>
                <table className="w-full text-mr-small" id="shortcuts">
                    <thead>
                        <tr className="text-left text-mr-tiny text-mr-fg-subtle">
                            <th className="pb-2 font-mr-bold">{t('settings.about.keysHeader')}</th>
                            <th className="pb-2 font-mr-bold">{t('settings.about.actionHeader')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-mr-border">
                        {shortcuts.map(({ keys, id }) => (
                            <tr key={id}>
                                <td className="py-2">
                                    <span className="flex flex-wrap items-center gap-1">
                                        {keys.map((k, i) => (
                                            <>
                                                <Kbd key={k}>{k}</Kbd>
                                                {i < keys.length - 1 && <span className="text-mr-fg-subtle">+</span>}
                                            </>
                                        ))}
                                    </span>
                                </td>
                                <td className="py-2 text-mr-fg-muted">{t(`settings.about.shortcuts.${id}`)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </SettingSection>
        </>
    );
};

export default SettingsAboutTab;
