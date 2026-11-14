import { useTranslation } from 'react-i18next';

import LanguageSwitcher from '@/shared/component/LanguageSwitcher';
import ThemeSwitcher from '@/shared/component/ThemeSwitcher';

export default function PreferenceRail() {
    const { t } = useTranslation();

    return (
        <aside
            aria-label={t('nav.preferences')}
            className="fixed top-1/2 right-3 z-[90] hidden -translate-y-1/2 flex-col gap-2 min-[940px]:flex"
        >
            <LanguageSwitcher variant="floating" />
            <ThemeSwitcher variant="floating" />
        </aside>
    );
}
