import { useTranslation } from 'react-i18next';

import PageShell from '@app/layout/PageShell';

const Loading = () => {
    const { t } = useTranslation('common');

    return (
        <PageShell mainClassName="my-auto" footerStyles={{ marginTop: 0 }}>
            <div className="flex flex-col items-center justify-start h-full gap-4">
                <div className="relative">
                    <span className="loader"></span>
                </div>
                <div className="text-center">
                    <h2 className="text-xl font-bold">{t('label.loading')}</h2>
                    <p className="text-sm">{t('label.loadingMessage')}</p>
                </div>
            </div>
        </PageShell>
    );
};

export default Loading;
