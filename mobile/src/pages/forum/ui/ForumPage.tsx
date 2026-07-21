import { useTranslation } from 'react-i18next';

import { EmptyState, PageContainer } from '@/src/shared/ui';

export function ForumPage() {
    const { t } = useTranslation('common');
    return (
        <PageContainer>
            <EmptyState title={t('nav.forum')} description={t('forum.comingSoon')} />
        </PageContainer>
    );
}
