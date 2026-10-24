import { LanguageDrawerSwitcher } from './language-switcher/LanguageDrawerSwitcher';
import { LanguageFloatingSwitcher } from './language-switcher/LanguageFloatingSwitcher';

export type LanguageSwitcherVariant = 'floating' | 'drawer';

export interface LanguageSwitcherProps {
    variant: LanguageSwitcherVariant;
}

export default function LanguageSwitcher({ variant }: LanguageSwitcherProps) {
    return variant === 'drawer' ? (
        <LanguageDrawerSwitcher />
    ) : (
        <LanguageFloatingSwitcher />
    );
}
