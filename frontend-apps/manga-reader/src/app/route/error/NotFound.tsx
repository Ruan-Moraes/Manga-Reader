import { useTranslation } from 'react-i18next';

import MainContent from '@/app/layout/Main';

import { THEME_COLORS } from '@shared/constant/THEME_COLORS';
import AlertBanner from '@shared/component/notification/AlertBanner';

const NotFound = () => {
    const { t } = useTranslation('common');

    return (
        <MainContent>
            <AlertBanner
                linkText={t('notFound.linkText')}
                color={THEME_COLORS.QUINARY}
                title={t('notFound.title')}
                message={t('notFound.message')}
                link="/"
            />
        </MainContent>
    );
};

export default NotFound;
