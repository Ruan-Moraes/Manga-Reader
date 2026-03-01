import { useEffect, useMemo, useState } from 'react';

import { clsx } from 'clsx';

import BaseModal from '@shared/component/modal/base/BaseModal';
import { USER_SETTINGS_STORAGE_KEY } from '@shared/constant/USER_SETTINGS_STORAGE_KEY';

export type UserSettings = {
    reading: {
        mode: 'paged' | 'continuous';
        direction: 'ltr' | 'rtl' | 'vertical';
        imageQuality: 'auto' | 'high' | 'data-saver';
        preloadPages: number;
        autoNextChapter: boolean;
        showPageNumber: boolean;
    };
    appearance: {
        theme: 'system' | 'light' | 'dark';
        compactMode: boolean;
        showMatureThumbnailsBlur: boolean;
    };
    language: {
        uiLanguage: 'pt-BR' | 'en-US' | 'es-ES';
        preferredContentLanguage: 'pt-BR' | 'en-US' | 'ja-JP' | 'es-ES';
    };
    notifications: {
        newChapterFromFollowed: boolean;
        recommendations: boolean;
        communityNews: boolean;
        events: boolean;
        email: boolean;
        push: boolean;
    };
    privacy: {
        showReadingHistory: boolean;
        showOnlineStatus: boolean;
        adultContent: 'hide' | 'blur' | 'show';
    };
};

type UserSettingsModalProps = {
    isOpen: boolean;
    onClose: () => void;
    isLoggedIn: boolean;
};

type TabKey =
    | 'reading'
    | 'appearance'
    | 'language'
    | 'notifications'
    | 'privacy';

const defaultSettings: UserSettings = {
    reading: {
        mode: 'continuous',
        direction: 'ltr',
        imageQuality: 'auto',
        preloadPages: 2,
        autoNextChapter: true,
        showPageNumber: true,
    },
    appearance: {
        theme: 'system',
        compactMode: false,
        showMatureThumbnailsBlur: true,
    },
    language: {
        uiLanguage: 'pt-BR',
        preferredContentLanguage: 'pt-BR',
    },
    notifications: {
        newChapterFromFollowed: true,
        recommendations: true,
        communityNews: true,
        events: true,
        email: false,
        push: true,
    },
    privacy: {
        showReadingHistory: true,
        showOnlineStatus: true,
        adultContent: 'blur',
    },
};

const normalizeSettings = (settings: Partial<UserSettings>): UserSettings => ({
    reading: {
        ...defaultSettings.reading,
        ...(settings.reading ?? {}),
    },
    appearance: {
        ...defaultSettings.appearance,
        ...(settings.appearance ?? {}),
    },
    language: {
        ...defaultSettings.language,
        ...(settings.language ?? {}),
    },
    notifications: {
        ...defaultSettings.notifications,
        ...(settings.notifications ?? {}),
    },
    privacy: {
        ...defaultSettings.privacy,
        ...(settings.privacy ?? {}),
    },
});

const getStoredSettings = (): UserSettings => {
    try {
        const raw = localStorage.getItem(USER_SETTINGS_STORAGE_KEY);

        if (!raw) {
            return defaultSettings;
        }

        return normalizeSettings(JSON.parse(raw) as UserSettings);
    } catch {
        return defaultSettings;
    }
};

const sectionTitleClass =
    'text-[0.7rem] font-semibold tracking-[0.14em] uppercase text-quaternary-default';

const fieldClass =
    'w-full h-10 px-3 text-sm border bg-secondary rounded-xs border-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-quaternary-default';

const UserSettingsModal = ({
    isOpen,
    onClose,
    isLoggedIn,
}: UserSettingsModalProps) => {
    const [activeTab, setActiveTab] = useState<TabKey>('reading');
    const [settings, setSettings] = useState<UserSettings>(getStoredSettings);

    useEffect(() => {
        localStorage.setItem(
            USER_SETTINGS_STORAGE_KEY,
            JSON.stringify(settings),
        );
    }, [settings]);

    const tabs = useMemo(
        () => [
            { key: 'reading' as const, label: 'Leitura' },
            { key: 'appearance' as const, label: 'Aparência' },
            { key: 'language' as const, label: 'Idioma' },
            { key: 'notifications' as const, label: 'Notificações' },
            { key: 'privacy' as const, label: 'Privacidade' },
        ],
        [],
    );

    return (
        <BaseModal isModalOpen={isOpen} closeModal={onClose}>
            <header className="flex items-center justify-between p-2 border rounded-xs border-tertiary bg-secondary/50">
                <div>
                    <p className={sectionTitleClass}>
                        Configurações do usuário
                    </p>
                    <p className="text-xs text-tertiary">
                        Ajuste sua experiência de leitura de mangás.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="h-10 px-4 text-xs font-semibold uppercase border rounded-xs border-tertiary hover:bg-tertiary/20"
                >
                    Fechar
                </button>
            </header>

            <div className="grid gap-2 md:grid-cols-[200px_1fr]">
                <nav className="flex flex-wrap gap-2 p-2 border rounded-xs border-tertiary bg-secondary/40 md:flex-col">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key)}
                            className={clsx(
                                'px-3 py-2 text-xs font-semibold border rounded-xs border-tertiary transition-colors',
                                activeTab === tab.key
                                    ? 'bg-quaternary-default/15 text-quaternary-default'
                                    : 'hover:bg-tertiary/20',
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>

                <section className="p-3 border rounded-xs border-tertiary bg-secondary/30 max-h-[65vh] overflow-y-auto">
                    {activeTab === 'reading' && (
                        <div className="space-y-4">
                            <h3 className={sectionTitleClass}>
                                Modo de leitura
                            </h3>
                            <label className="block text-xs font-semibold">
                                Modo
                            </label>
                            <select
                                className={fieldClass}
                                value={settings.reading.mode}
                                onChange={event =>
                                    setSettings(prev => ({
                                        ...prev,
                                        reading: {
                                            ...prev.reading,
                                            mode: event.target
                                                .value as UserSettings['reading']['mode'],
                                        },
                                    }))
                                }
                            >
                                <option value="continuous">Contínuo</option>
                                <option value="paged">Paginado</option>
                            </select>

                            <label className="block text-xs font-semibold">
                                Direção
                            </label>
                            <select
                                className={fieldClass}
                                value={settings.reading.direction}
                                onChange={event =>
                                    setSettings(prev => ({
                                        ...prev,
                                        reading: {
                                            ...prev.reading,
                                            direction: event.target
                                                .value as UserSettings['reading']['direction'],
                                        },
                                    }))
                                }
                            >
                                <option value="ltr">Esquerda → direita</option>
                                <option value="rtl">Direita → esquerda</option>
                                <option value="vertical">
                                    Rolagem vertical
                                </option>
                            </select>

                            <label className="block text-xs font-semibold">
                                Qualidade de imagem
                            </label>
                            <select
                                className={fieldClass}
                                value={settings.reading.imageQuality}
                                onChange={event =>
                                    setSettings(prev => ({
                                        ...prev,
                                        reading: {
                                            ...prev.reading,
                                            imageQuality: event.target
                                                .value as UserSettings['reading']['imageQuality'],
                                        },
                                    }))
                                }
                            >
                                <option value="auto">Automática</option>
                                <option value="high">Alta</option>
                                <option value="data-saver">
                                    Economia de dados
                                </option>
                            </select>

                            <label className="block text-xs font-semibold">
                                Pré-carregamento de páginas:{' '}
                                {settings.reading.preloadPages}
                            </label>
                            <input
                                type="range"
                                min={0}
                                max={5}
                                value={settings.reading.preloadPages}
                                className="w-full"
                                onChange={event =>
                                    setSettings(prev => ({
                                        ...prev,
                                        reading: {
                                            ...prev.reading,
                                            preloadPages: Number(
                                                event.target.value,
                                            ),
                                        },
                                    }))
                                }
                            />

                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={settings.reading.autoNextChapter}
                                    onChange={event =>
                                        setSettings(prev => ({
                                            ...prev,
                                            reading: {
                                                ...prev.reading,
                                                autoNextChapter:
                                                    event.target.checked,
                                            },
                                        }))
                                    }
                                />
                                Abrir próximo capítulo automaticamente
                            </label>

                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={settings.reading.showPageNumber}
                                    onChange={event =>
                                        setSettings(prev => ({
                                            ...prev,
                                            reading: {
                                                ...prev.reading,
                                                showPageNumber:
                                                    event.target.checked,
                                            },
                                        }))
                                    }
                                />
                                Exibir número da página
                            </label>
                        </div>
                    )}

                    {activeTab === 'appearance' && (
                        <div className="space-y-4">
                            <h3 className={sectionTitleClass}>Aparência</h3>

                            <label className="block text-xs font-semibold">
                                Tema
                            </label>
                            <select
                                className={fieldClass}
                                value={settings.appearance.theme}
                                onChange={event =>
                                    setSettings(prev => ({
                                        ...prev,
                                        appearance: {
                                            ...prev.appearance,
                                            theme: event.target
                                                .value as UserSettings['appearance']['theme'],
                                        },
                                    }))
                                }
                            >
                                <option value="system">Sistema</option>
                                <option value="light">Claro</option>
                                <option value="dark">Escuro</option>
                            </select>

                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={settings.appearance.compactMode}
                                    onChange={event =>
                                        setSettings(prev => ({
                                            ...prev,
                                            appearance: {
                                                ...prev.appearance,
                                                compactMode:
                                                    event.target.checked,
                                            },
                                        }))
                                    }
                                />
                                Layout compacto na biblioteca/listagens
                            </label>

                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={
                                        settings.appearance
                                            .showMatureThumbnailsBlur
                                    }
                                    onChange={event =>
                                        setSettings(prev => ({
                                            ...prev,
                                            appearance: {
                                                ...prev.appearance,
                                                showMatureThumbnailsBlur:
                                                    event.target.checked,
                                            },
                                        }))
                                    }
                                />
                                Aplicar blur em miniaturas maduras
                            </label>
                        </div>
                    )}

                    {activeTab === 'language' && (
                        <div className="space-y-4">
                            <h3 className={sectionTitleClass}>Idioma</h3>

                            <label className="block text-xs font-semibold">
                                Idioma da interface
                            </label>
                            <select
                                className={fieldClass}
                                value={settings.language.uiLanguage}
                                onChange={event =>
                                    setSettings(prev => ({
                                        ...prev,
                                        language: {
                                            ...prev.language,
                                            uiLanguage: event.target
                                                .value as UserSettings['language']['uiLanguage'],
                                        },
                                    }))
                                }
                            >
                                <option value="pt-BR">Português (BR)</option>
                                <option value="en-US">English (US)</option>
                                <option value="es-ES">Español</option>
                            </select>

                            <label className="block text-xs font-semibold">
                                Idioma preferido dos capítulos
                            </label>
                            <select
                                className={fieldClass}
                                value={
                                    settings.language.preferredContentLanguage
                                }
                                onChange={event =>
                                    setSettings(prev => ({
                                        ...prev,
                                        language: {
                                            ...prev.language,
                                            preferredContentLanguage: event
                                                .target
                                                .value as UserSettings['language']['preferredContentLanguage'],
                                        },
                                    }))
                                }
                            >
                                <option value="pt-BR">Português (BR)</option>
                                <option value="en-US">English (US)</option>
                                <option value="ja-JP">日本語</option>
                                <option value="es-ES">Español</option>
                            </select>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="space-y-4">
                            <h3 className={sectionTitleClass}>Notificações</h3>
                            <p className="text-xs text-tertiary">
                                {isLoggedIn
                                    ? 'Defina quais eventos devem gerar alertas na sua conta.'
                                    : 'As opções ficam salvas localmente até você entrar na conta.'}
                            </p>

                            {(
                                [
                                    [
                                        'newChapterFromFollowed',
                                        'Novos capítulos dos mangás seguidos',
                                    ],
                                    [
                                        'recommendations',
                                        'Recomendações personalizadas',
                                    ],
                                    ['communityNews', 'Notícias da comunidade'],
                                    ['events', 'Eventos e lançamentos'],
                                    ['email', 'Notificações por e-mail'],
                                    ['push', 'Notificações push no navegador'],
                                ] as Array<
                                    [
                                        keyof UserSettings['notifications'],
                                        string,
                                    ]
                                >
                            ).map(([key, label]) => (
                                <label
                                    className="flex items-center gap-2 text-sm"
                                    key={key}
                                >
                                    <input
                                        type="checkbox"
                                        checked={settings.notifications[key]}
                                        onChange={event =>
                                            setSettings(prev => ({
                                                ...prev,
                                                notifications: {
                                                    ...prev.notifications,
                                                    [key]: event.target.checked,
                                                },
                                            }))
                                        }
                                    />
                                    {label}
                                </label>
                            ))}
                        </div>
                    )}

                    {activeTab === 'privacy' && (
                        <div className="space-y-4">
                            <h3 className={sectionTitleClass}>
                                Privacidade e conta
                            </h3>

                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={
                                        settings.privacy.showReadingHistory
                                    }
                                    onChange={event =>
                                        setSettings(prev => ({
                                            ...prev,
                                            privacy: {
                                                ...prev.privacy,
                                                showReadingHistory:
                                                    event.target.checked,
                                            },
                                        }))
                                    }
                                />
                                Mostrar histórico de leitura no perfil
                            </label>

                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={settings.privacy.showOnlineStatus}
                                    onChange={event =>
                                        setSettings(prev => ({
                                            ...prev,
                                            privacy: {
                                                ...prev.privacy,
                                                showOnlineStatus:
                                                    event.target.checked,
                                            },
                                        }))
                                    }
                                />
                                Exibir status online para outros usuários
                            </label>

                            <label className="block text-xs font-semibold">
                                Conteúdo adulto
                            </label>
                            <select
                                className={fieldClass}
                                value={settings.privacy.adultContent}
                                onChange={event =>
                                    setSettings(prev => ({
                                        ...prev,
                                        privacy: {
                                            ...prev.privacy,
                                            adultContent: event.target
                                                .value as UserSettings['privacy']['adultContent'],
                                        },
                                    }))
                                }
                            >
                                <option value="hide">Ocultar</option>
                                <option value="blur">Mostrar com blur</option>
                                <option value="show">Mostrar sem blur</option>
                            </select>
                        </div>
                    )}
                </section>
            </div>
        </BaseModal>
    );
};

export default UserSettingsModal;
