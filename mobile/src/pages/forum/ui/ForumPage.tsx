import { useTranslation } from 'react-i18next';

import { navigateBackOrReplace, ROUTES } from '@/shared/navigation';
import { EmptyState, ScreenScaffold } from '@/shared/ui';

export function ForumPage() {
    const { t } = useTranslation('common');
    return (
        <ScreenScaffold compact backLabel={t('navigation.back')} onBack={() => navigateBackOrReplace(ROUTES.ROOT)} title={t('nav.forum')}>
            <EmptyState title={t('nav.forum')} description={t('forum.comingSoon')} />
        </ScreenScaffold>
    );
}
