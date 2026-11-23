import { useTranslation } from 'react-i18next';

import Icon from '@/shared/component/Icon';
import type { ThemePreference } from '@/shared/config/theme';
import { useDropdownMenu } from '@/shared/hook/useDropdownMenu';
import useThemePreference from '@/shared/hook/useThemePreference';
import { THEME_META, THEME_ORDER } from './ThemeDrawerSwitcher';

export function ThemeFloatingSwitcher() {
    const { t } = useTranslation();
    const [theme, setTheme] = useThemePreference();
    const selectedMeta = THEME_META[theme];
    const selectedLabel = t(selectedMeta.labelKey);

    const {
        open,
        toggleMenu,
        closeMenu,
        rootRef,
        triggerRef,
        optionRefs,
        handleKeyDown,
        closeAfterFocusLeaves,
    } = useDropdownMenu({
        itemCount: THEME_ORDER.length,
        enabled: true,
    });

    function selectTheme(nextTheme: ThemePreference) {
        closeMenu(true);
        setTheme(nextTheme);
    }

    return (
        <div
            ref={rootRef}
            className="relative block"
            onBlur={closeAfterFocusLeaves}
            onKeyDown={handleKeyDown}
        >
            <button
                ref={triggerRef}
                type="button"
                className={`relative inline-flex h-[52px] w-[78px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-[14px] border border-accent-border/40 bg-floating text-fg shadow-[var(--shadow-floating)] backdrop-blur-[14px] transition-[border-color,background-color,translate,scale,box-shadow] duration-[180ms] before:absolute before:left-0 before:h-6 before:w-[3px] before:rounded-r-full before:bg-accent before:opacity-80 hover:-translate-x-[3px] hover:border-accent-border hover:bg-floating-hover active:-translate-x-px active:scale-[0.98] ${open ? '-translate-x-[3px] border-accent-border bg-floating-hover' : ''}`}
                aria-label={t('nav.changeTheme', { theme: selectedLabel })}
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={toggleMenu}
            >
                <span className="inline-flex size-[29px] items-center justify-center rounded-full border border-border bg-surface-muted text-accent-fg">
                    <Icon name={selectedMeta.icon} size={17} stroke={2.2} />
                </span>
                <span
                    className="inline-flex size-[19px] shrink-0 items-center justify-center rounded-full border border-border bg-surface-muted"
                    aria-hidden="true"
                >
                    <Icon
                        name="chevronD"
                        size={11}
                        stroke={2.6}
                        className={`opacity-80 transition-[opacity,rotate] duration-[180ms] ${open ? 'rotate-180 opacity-100' : ''}`}
                    />
                </span>
            </button>

            {open ? (
                <div
                    className="absolute top-1/2 right-[calc(100%+10px)] grid w-[208px] -translate-y-1/2 gap-1 rounded-[14px] border border-border-strong bg-floating p-2 text-fg shadow-[var(--shadow-menu)] backdrop-blur-[18px] animate-language-menu-in"
                    role="menu"
                    aria-label={t('nav.theme')}
                >
                    {THEME_ORDER.map((option, index) => {
                        const meta = THEME_META[option];
                        const label = t(meta.labelKey);
                        const active = option === theme;

                        return (
                            <button
                                ref={element => {
                                    optionRefs.current[index] = element;
                                }}
                                type="button"
                                role="menuitemradio"
                                aria-checked={active}
                                key={option}
                                onClick={() => selectTheme(option)}
                                className={`relative grid min-h-12 w-full cursor-pointer grid-cols-[30px_minmax(0,1fr)_24px] items-center gap-[9px] rounded-[10px] border px-3 text-left text-[0.875rem] font-extrabold transition-[border-color,background-color,color] duration-150 ${active ? 'border-accent-border/50 bg-accent-subtle text-accent-fg before:absolute before:left-0 before:h-6 before:w-[3px] before:rounded-r-full before:bg-accent' : 'border-transparent bg-transparent text-copy hover:bg-surface-hover hover:text-fg'}`}
                            >
                                <span className="inline-flex size-[27px] items-center justify-center rounded-full border border-border bg-surface-muted text-accent-fg">
                                    <Icon name={meta.icon} size={16} />
                                </span>
                                <span>{label}</span>
                                <span
                                    className={`inline-flex size-[22px] items-center justify-center rounded-full text-[0.6875rem] text-on-accent ${active ? 'bg-accent opacity-100' : 'opacity-0'}`}
                                    aria-hidden="true"
                                >
                                    ✓
                                </span>
                            </button>
                        );
                    })}
                </div>
            ) : null}
        </div>
    );
}

export default ThemeFloatingSwitcher;
