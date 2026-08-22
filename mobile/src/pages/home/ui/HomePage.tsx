import { useTranslation } from 'react-i18next';

import { navigateBackOrReplace, ROUTES } from '@/src/shared/navigation';
import { EmptyState, ScreenScaffold } from '@/src/shared/ui';

export function HomePage() {
    const { t } = useTranslation('common');
    return (
        <ScreenScaffold compact backLabel={t('navigation.back')} onBack={() => navigateBackOrReplace(ROUTES.ROOT)} title={t('nav.home')}>
            <EmptyState title={t('nav.home')} description={t('home.comingSoon')} />
        </ScreenScaffold>
    );
}
