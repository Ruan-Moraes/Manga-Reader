import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink } from 'lucide-react';

import { Kbd } from '@ui/Kbd';

import { SettingSection } from './settingsShared';

const LINKS = [
    { id: 'status', href: 'https://status.toonlira.app' },
    { id: 'changelog', href: 'https://github.com/toonlira/releases' },
    { id: 'repo', href: 'https://github.com/toonlira' },
] as const;

const SHORTCUTS = [
    { keys: ['←', '→'], id: 'navigatePages' },
    { keys: ['A', 'D'], id: 'navigateAlt' },
    { keys: ['F'], id: 'fullscreen' },
    { keys: ['B'], id: 'addLibrary' },
    { keys: ['⌘', 'K'], id: 'quickSearch' },
    { keys: ['⌘', 'Enter'], id: 'publish' },
    { keys: ['Esc'], id: 'close' },
] as const;

const SettingsAboutTab = () => {
    const { t } = useTranslation('user');

    return (
        <>
            <SettingSection title={t('settings.system.about.sectionVersion')}>
                <div className="flex items-center gap-3 rounded-ui-xs border border-ui-gray-800 bg-ui-secondary p-4">
                    <img
                        src={`${import.meta.env.BASE_URL}favicon-64x64.png`}
                        alt=""
                        width={40}
                        height={40}
                        className="size-10 shrink-0 rounded-ui-sm object-contain"
                    />
                    <div className="min-w-0">
                        <p className="text-ui-body font-ui-extrabold text-ui-fg">Toonlira</p>
                        <p className="font-ui-mono text-ui-tiny tabular-nums text-ui-fg-subtle">{t('settings.system.about.version')}</p>
                    </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-4 text-ui-small">
                    {LINKS.map(link => (
                        <a
                            key={link.id}
                            href={link.href}
                            target="_blank"
                            rel="noreferrer"
                            className="ui-focus-ring inline-flex items-center gap-1.5 rounded-ui-xs font-ui-bold text-ui-accent-fg hover:underline"
                        >
                            {t(`settings.system.about.link.${link.id}`)}
                            <ExternalLink className="size-3.5" aria-hidden="true" />
                        </a>
                    ))}
                </div>
            </SettingSection>

            <SettingSection title={t('settings.system.about.sectionShortcuts')}>
                <table className="w-full text-ui-small">
                    <thead>
                        <tr className="text-left text-ui-tiny uppercase tracking-ui-label text-ui-fg-subtle">
                            <th className="pb-2 font-ui-bold">{t('settings.system.about.keysHeader')}</th>
                            <th className="pb-2 font-ui-bold">{t('settings.system.about.actionHeader')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-ui-separator">
                        {SHORTCUTS.map(({ keys, id }) => (
                            <tr key={id}>
                                <td className="py-2.5">
                                    <span className="flex flex-wrap items-center gap-1">
                                        {keys.map((k, i) => (
                                            <Fragment key={k}>
                                                <Kbd tone="muted">{k}</Kbd>
                                                {i < keys.length - 1 && <span className="text-ui-fg-subtle">+</span>}
                                            </Fragment>
                                        ))}
                                    </span>
                                </td>
                                <td className="py-2.5 text-ui-fg-muted">{t(`settings.system.about.shortcut.${id}`)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </SettingSection>
        </>
    );
};

export default SettingsAboutTab;
