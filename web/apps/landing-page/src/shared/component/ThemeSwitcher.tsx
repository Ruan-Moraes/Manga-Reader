import { ThemeDrawerSwitcher } from './theme-switcher/ThemeDrawerSwitcher';
import { ThemeFloatingSwitcher } from './theme-switcher/ThemeFloatingSwitcher';

export type ThemeSwitcherVariant = 'floating' | 'drawer';

export interface ThemeSwitcherProps {
    variant: ThemeSwitcherVariant;
}

export default function ThemeSwitcher({ variant }: ThemeSwitcherProps) {
    return variant === 'drawer' ? (
        <ThemeDrawerSwitcher />
    ) : (
        <ThemeFloatingSwitcher />
    );
}
