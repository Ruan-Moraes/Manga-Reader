import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Check } from 'lucide-react';

import { Button } from '@ui/Button';
import Illustration from '@ui/Illustration';

import type { Store } from '../model/store.types';
import StoreCard from './StoreCard';

interface StoresContainerProps {
    stores: Store[];
    isLoading?: boolean;
    title?: string;
    onVisit?: (store: Store) => void;
}

function StoresEmpty() {
    const { t } = useTranslation('store');
    const [notified, setNotified] = useState(false);
    return (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
            <Illustration type="triste" alt="" width={150} height={150} />
            <div>
                <h2 className="text-[20px] font-mr-extrabold text-mr-fg">{t('empty.title')}</h2>
                <p className="mt-1 max-w-[360px] text-[14px] text-mr-fg-muted">{t('empty.desc')}</p>
            </div>
            {notified ? (
                <span className="flex items-center gap-2 text-[14px] font-mr-bold text-mr-accent-fg">
                    <Check className="size-4" aria-hidden="true" />
                    {t('empty.notified')}
                </span>
            ) : (
                <Button variant="primary" icon={Bell} onClick={() => setNotified(true)}>
                    {t('empty.notify')}
                </Button>
            )}
        </div>
    );
}

const StoresContainer = ({ stores, isLoading = false, onVisit }: StoresContainerProps) => {
    const { t } = useTranslation('store');

    if (isLoading) {
        return (
            <div className="flex flex-col gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <StoreCard key={i} store={{} as Store} isLoading />
                ))}
            </div>
        );
    }

    if (!stores.length) return <StoresEmpty />;

    return (
        <div>
            <div className="mb-4 flex items-baseline gap-2">
                <h2 className="text-[18px] font-mr-extrabold text-mr-fg">{t('container.title')}</h2>
                <span className="text-[13px] text-mr-fg-subtle">{t('container.count', { count: stores.length })}</span>
            </div>
            <div className="flex flex-col gap-3">
                {stores.map(s => (
                    <StoreCard key={s.id} store={s} onVisit={onVisit} />
                ))}
            </div>
        </div>
    );
};

export default StoresContainer;
