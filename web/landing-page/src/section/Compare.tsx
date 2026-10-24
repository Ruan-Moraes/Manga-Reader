import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import MarketingSection, {
    SectionHeading,
} from '@/shared/component/MarketingSection';
import { CompareTable } from './compare/CompareTable';

export default function Compare() {
    const { t } = useTranslation();
    const features = useMemo(
        () => t('compare.features', { returnObjects: true }) as string[],
        [t],
    );

    return (
        <MarketingSection id="compare">
            <SectionHeading
                eyebrow={t('compare.eyebrow')}
                title={t('compare.title')}
            />
            <CompareTable features={features} />
        </MarketingSection>
    );
}
