import { useTranslation } from 'react-i18next';

import { PageContainer } from '@ui/PageContainer';
import { SectionHeader } from '@ui/SectionHeader';
import Illustration from '@ui/Illustration';

const Notifications = () => {
    const { t } = useTranslation('layout');

    return (
        <PageContainer asMain size="default" paddingY="md">
            <SectionHeader title={t('notifications.title')} meta={t('notifications.subtitle')} className="mb-6" />

            <div className="flex flex-col items-center gap-4 py-12 text-center">
                <Illustration type="pensando" alt="" width={120} height={120} />
                <div>
                    <h2 className="text-[18px] font-mr-extrabold text-mr-fg">{t('notifications.emptyState')}</h2>
                    <p className="mt-1 text-mr-body text-mr-fg-muted">{t('notifications.emptyDesc')}</p>
                </div>
            </div>
        </PageContainer>
    );
};

export default Notifications;
