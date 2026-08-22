import { useTranslation } from 'react-i18next';

import { navigateBackOrReplace, ROUTES } from '@/src/shared/navigation';
import { EmptyState, ScreenScaffold } from '@/src/shared/ui';

export function ModalPage() {
    const { t } = useTranslation('common');

    return (
        <ScreenScaffold compact backLabel={t('navigation.dismiss')} onBack={() => navigateBackOrReplace(ROUTES.ROOT)} title={t('modal.title')}>
            <EmptyState title={t('modal.title')} />
        </ScreenScaffold>
    );
}
