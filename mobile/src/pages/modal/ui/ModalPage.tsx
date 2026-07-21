import { useTranslation } from 'react-i18next';

import { EmptyState, PageContainer } from '@/src/shared/ui';

export function ModalPage() {
    const { t } = useTranslation('common');

    return (
        <PageContainer>
            <EmptyState title={t('modal.title')} />
        </PageContainer>
    );
}
