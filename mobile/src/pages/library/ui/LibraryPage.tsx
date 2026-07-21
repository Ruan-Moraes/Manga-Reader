import { useTranslation } from 'react-i18next';

import { EmptyState, PageContainer } from '@/src/shared/ui';

export function LibraryPage() {
    const { t } = useTranslation('common');
    return (
        <PageContainer>
            <EmptyState title={t('nav.library')} description={t('library.comingSoon')} />
        </PageContainer>
    );
}
