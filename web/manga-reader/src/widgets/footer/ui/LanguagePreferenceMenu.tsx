import { ChevronDown, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { DropdownMenu, type DropdownMenuItem } from '@ui/DropdownMenu';

import { useAuth } from '@features/auth';
import { useContentLocales } from '@entities/user';
import { SUPPORTED_LANGUAGES } from '@/i18n/config';

const LanguagePreferenceMenu = () => {
    const { t, i18n } = useTranslation('layout');

    const { isLoggedIn } = useAuth();
    const { query, mutation } = useContentLocales(isLoggedIn);

    const langName = (lang: string) => t(`language.${lang}`, { ns: 'common' });

    const currentUi = i18n.language;
    const currentContent = query.data?.contentLocales?.[0] ?? currentUi;

    const items: DropdownMenuItem[] = [
        { type: 'label', label: t('footer.preferences.uiGroup') },
        ...SUPPORTED_LANGUAGES.map(lang => ({
            label: langName(lang),
            selected: lang === currentUi,
            onSelect: () => void i18n.changeLanguage(lang),
        })),
        { type: 'separator' },
        { type: 'label', label: t('footer.preferences.contentGroup') },
        ...(isLoggedIn
            ? SUPPORTED_LANGUAGES.map(lang => ({
                  label: langName(lang),
                  selected: lang === currentContent,
                  onSelect: () => mutation.mutate({ contentLocales: [lang] }),
              }))
            : [{ label: t('footer.preferences.contentLoginHint'), disabled: true } satisfies DropdownMenuItem]),
    ];

    return (
        <DropdownMenu
            trigger={
                <button
                    type="button"
                    aria-label={t('footer.preferences.languageAria')}
                    className="mr-focus-ring inline-flex min-h-[36px] items-center gap-2 rounded-[2px] border border-mr-gray-700 bg-transparent px-3 py-1.5 text-[12px] font-mr-semibold text-mr-fg-muted transition-colors duration-200 hover:border-mr-accent-border hover:text-mr-accent-fg"
                >
                    <Languages className="size-[14px]" aria-hidden="true" />
                    <span>{t('footer.preferences.language')}</span>
                    <span className="text-mr-fg">{langName(currentUi)}</span>
                    <ChevronDown className="size-[14px]" aria-hidden="true" />
                </button>
            }
            items={items}
            side="top"
            align="end"
        />
    );
};

export default LanguagePreferenceMenu;
