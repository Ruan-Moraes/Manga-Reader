import { useTranslation } from 'react-i18next';

import { PageContainer } from '@ui/PageContainer';
import { SectionHeader } from '@ui/SectionHeader';
import { Card } from '@ui/Card';

const AboutUs = () => {
    const { t } = useTranslation('common');

    return (
        <PageContainer asMain size="narrow" paddingY="md">
            <SectionHeader eyebrow={t('aboutUs.eyebrow')} title={t('aboutUs.title')} className="mb-8" />

            <div className="flex flex-col gap-4">
                <Card variant="default" className="p-6">
                    <h2 className="mb-3 text-mr-small font-mr-bold text-mr-fg">{t('aboutUs.missionTitle')}</h2>
                    <p className="leading-relaxed text-mr-small text-mr-fg-muted">{t('aboutUs.missionContent')}</p>
                </Card>

                <Card variant="default" className="p-6">
                    <h2 className="mb-3 text-mr-small font-mr-bold text-mr-fg">{t('aboutUs.offerTitle')}</h2>
                    <p className="leading-relaxed text-mr-small text-mr-fg-muted">{t('aboutUs.offerContent')}</p>
                </Card>

                <Card variant="default" className="p-6">
                    <h2 className="mb-3 text-mr-small font-mr-bold text-mr-fg">{t('aboutUs.communityTitle')}</h2>
                    <p className="leading-relaxed text-mr-small text-mr-fg-muted">{t('aboutUs.communityContent')}</p>
                </Card>
            </div>
        </PageContainer>
    );
};

export default AboutUs;
