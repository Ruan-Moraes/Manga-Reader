import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink } from 'lucide-react';

import { Kbd } from '@ui/Kbd';

import { SettingSection } from './settingsShared';

const LINKS = [
    { id: 'status', href: 'https://status.mangareader.app' },
    { id: 'changelog', href: 'https://github.com/mangareader/releases' },
    { id: 'repo', href: 'https://github.com/mangareader' },
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
                <div className="flex items-center gap-3 rounded-mr-xs border border-mr-gray-800 bg-mr-secondary p-4">
                    <img
                        src={`${import.meta.env.BASE_URL}/favicon-64x64.png`}
                        alt=""
                        width={40}
                        height={40}
                        className="size-10 shrink-0 rounded-mr-sm object-contain"
                    />
                    <div className="min-w-0">
                        <p className="text-mr-body font-mr-extrabold text-mr-fg">Manga Reader</p>
                        <p className="font-mr-mono text-mr-tiny tabular-nums text-mr-fg-subtle">{t('settings.system.about.version')}</p>
                    </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-4 text-mr-small">
                    {LINKS.map(link => (
                        <a
                            key={link.id}
                            href={link.href}
                            target="_blank"
                            rel="noreferrer"
                            className="mr-focus-ring inline-flex items-center gap-1.5 rounded-mr-xs font-mr-bold text-mr-accent hover:underline"
                        >
                            {t(`settings.system.about.link.${link.id}`)}
                            <ExternalLink className="size-3.5" aria-hidden="true" />
                        </a>
                    ))}
                </div>
            </SettingSection>

            <SettingSection title={t('settings.system.about.sectionShortcuts')}>
                <table className="w-full text-mr-small">
                    <thead>
                        <tr className="text-left text-mr-tiny uppercase tracking-mr-label text-mr-fg-subtle">
                            <th className="pb-2 font-mr-bold">{t('settings.system.about.keysHeader')}</th>
                            <th className="pb-2 font-mr-bold">{t('settings.system.about.actionHeader')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-mr-separator">
                        {SHORTCUTS.map(({ keys, id }) => (
                            <tr key={id}>
                                <td className="py-2.5">
                                    <span className="flex flex-wrap items-center gap-1">
                                        {keys.map((k, i) => (
                                            <Fragment key={k}>
                                                <Kbd tone="muted">{k}</Kbd>
                                                {i < keys.length - 1 && <span className="text-mr-fg-subtle">+</span>}
                                            </Fragment>
                                        ))}
                                    </span>
                                </td>
                                <td className="py-2.5 text-mr-fg-muted">{t(`settings.system.about.shortcut.${id}`)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </SettingSection>
        </>
    );
};

export default SettingsAboutTab;
