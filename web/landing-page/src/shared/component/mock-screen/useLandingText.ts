import { useTranslation } from 'react-i18next';
import type { LandingMock, LandingUi } from '@/shared/data/landing';

export function useLandingText() {
    const { t } = useTranslation();
    const ui = t('ui', { returnObjects: true }) as LandingUi;
    const mock = t('mock', { returnObjects: true }) as LandingMock;
    return { ui, mock };
}

export default useLandingText;
