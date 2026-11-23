import { useTranslation } from 'react-i18next';

import Icon, { type IconName } from '@/shared/component/Icon';
import type { ThemePreference } from '@/shared/config/theme';
import useThemePreference from '@/shared/hook/useThemePreference';

export const THEME_META: Record<
    ThemePreference,
    { icon: IconName; labelKey: string }
> = {
    SYSTEM: { icon: 'monitor', labelKey: 'nav.themeSystem' },
    DARK: { icon: 'moon', labelKey: 'nav.themeDark' },
    LIGHT: { icon: 'sun', labelKey: 'nav.themeLight' },
};

export const THEME_ORDER: ThemePreference[] = ['SYSTEM', 'DARK', 'LIGHT'];

export function ThemeDrawerSwitcher() {
    const { t } = useTranslation();
    const [theme, setTheme] = useThemePreference();

    return (
        <div
            role="group"
            aria-label={t('nav.theme')}
            className="grid min-h-12 w-full grid-cols-3 gap-1 rounded-xl border border-border-strong bg-surface-muted p-1"
        >
            {THEME_ORDER.map(option => {
                const meta = THEME_META[option];
                const label = t(meta.labelKey);
                const active = option === theme;

                return (
                    <button
                        type="button"
                        key={option}
                        onClick={() => setTheme(option)}
                        aria-label={t('nav.selectTheme', { theme: label })}
                        aria-pressed={active}
                        className={`inline-flex min-h-11 min-w-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-0 px-1 text-[0.6875rem] font-extrabold transition-[color,background-color,scale] duration-[180ms] active:scale-[0.97] ${active ? 'bg-accent text-on-accent hover:text-on-accent' : 'bg-transparent text-copy-muted hover:bg-surface-hover hover:text-fg'}`}
                    >
                        <Icon name={meta.icon} size={17} />
                        <span>{label}</span>
                    </button>
                );
            })}
        </div>
    );
}

export default ThemeDrawerSwitcher;
