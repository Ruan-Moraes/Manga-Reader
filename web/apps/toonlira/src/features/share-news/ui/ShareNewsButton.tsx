import { Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@ui/Button';
import { showSuccessToast } from '@shared/service/util/toastService';
import { shareNews } from '../model/shareNews';

export const ShareNewsButton = ({ title, url = window.location.href }: { title: string; url?: string }) => {
    const { t } = useTranslation('news');
    return <Button variant="ghost" icon={Share2} onClick={async () => {
        try {
            const result = await shareNews(title, url);
            if (result === 'copied') showSuccessToast(t('details.linkCopied'));
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') return;
        }
    }}>{t('details.share')}</Button>;
};
