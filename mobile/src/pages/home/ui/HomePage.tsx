import { useTranslation } from 'react-i18next';

import { EmptyState, PageContainer } from '@/src/shared/ui';

export function HomePage() {
    const { t } = useTranslation('common');
    return (
        <PageContainer>
            <EmptyState title={t('nav.home')} description={t('home.comingSoon')} />
        </PageContainer>
    );
}
