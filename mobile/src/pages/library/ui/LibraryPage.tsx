import { useTranslation } from 'react-i18next';

import { navigateBackOrReplace, ROUTES } from '@/shared/navigation';
import { EmptyState, ScreenScaffold } from '@/shared/ui';

export function LibraryPage() {
    const { t } = useTranslation('common');
    return (
        <ScreenScaffold compact backLabel={t('navigation.back')} onBack={() => navigateBackOrReplace(ROUTES.ROOT)} title={t('nav.library')}>
            <EmptyState title={t('nav.library')} description={t('library.comingSoon')} />
        </ScreenScaffold>
    );
}
