import { useTranslation } from 'react-i18next';

import Header from '@app/layout/Header';
import MainContent from '@/app/layout/Main';
import Footer from '@app/layout/Footer';

const Loading = () => {
    const { t } = useTranslation('common');

    return (
        <>
            <Header />
            <MainContent className="my-auto">
                <div className="flex flex-col items-center justify-start h-full gap-4">
                    <div className="relative">
                        <span className="loader"></span>
                    </div>
                    <div className="text-center">
                        <h2 className="text-xl font-bold">
                            {t('label.loading')}
                        </h2>
                        <p className="text-sm">{t('label.loadingMessage')}</p>
                    </div>
                </div>
            </MainContent>
            <Footer styles={{ marginTop: 0 }} />
        </>
    );
};

export default Loading;
