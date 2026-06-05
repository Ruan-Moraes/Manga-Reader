import { useTranslation } from 'react-i18next';

import { PageContainer } from '@ui/PageContainer';
import { SectionHeader } from '@ui/SectionHeader';
import { Card } from '@ui/Card';

import { ContactForm } from '@features/contact';

const PublishWork = () => {
    const { t } = useTranslation('common');

    return (
        <PageContainer asMain size="narrow" paddingY="md">
            <SectionHeader eyebrow={t('publishWork.eyebrow')} title={t('publishWork.title')} className="mb-6" />

            <Card variant="default" className="mb-6 p-6">
                <p className="mb-3 leading-relaxed text-mr-small text-mr-fg-muted">{t('publishWork.description1')}</p>
                <p className="leading-relaxed text-mr-small text-mr-fg-muted">{t('publishWork.description2')}</p>
            </Card>

            <ContactForm />
        </PageContainer>
    );
};

export default PublishWork;
