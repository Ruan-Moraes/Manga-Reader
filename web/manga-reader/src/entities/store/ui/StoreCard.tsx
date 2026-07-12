import { useTranslation } from 'react-i18next';
import { ExternalLink } from 'lucide-react';

import { cn } from '@shared/lib/cn';
import { Button } from '@ui/Button';

import type { Store } from '../model/store.types';

interface StoreCardProps {
    store: Store;
    isLoading?: boolean;
}

function StoreLogo({ store, size = 48 }: { store: Store; size?: number }) {
    if (store.logo) {
        return <img src={store.logo} alt={store.name} width={size} height={size} className="rounded-mr-sm object-contain" />;
    }
    return (
        <span
            className="inline-flex shrink-0 items-center justify-center rounded-mr-sm text-[14px] font-mr-extrabold text-white"
            style={{ width: size, height: size, background: store.color ?? 'var(--mr-tertiary)' }}
            aria-hidden="true"
        >
            {store.mono ?? store.name.slice(0, 2).toUpperCase()}
        </span>
    );
}

const StoreCard = ({ store, isLoading = false }: StoreCardProps) => {
    const { t } = useTranslation('store');

    if (isLoading) {
        return (
            <div className="animate-pulse flex items-center gap-3 rounded-mr-xs border border-[#333] bg-[#1c1c1d] p-4">
                <div className="size-12 rounded-mr-sm bg-mr-gray-700 shrink-0" />
                <div className="flex-1">
                    <div className="mb-2 h-3 w-1/2 rounded bg-mr-gray-700" />
                    <div className="h-3 w-1/4 rounded bg-mr-gray-700" />
                </div>
                <div className="h-8 w-20 rounded bg-mr-gray-700" />
            </div>
        );
    }

    return (
        <article
            className={cn(
                'flex items-center gap-3 rounded-mr-xs border bg-[#1c1c1d] p-4 transition-colors duration-200',
                store.official ? 'border-mr-accent' : 'border-[#333]',
            )}
        >
            <StoreLogo store={store} size={48} />

            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-[14px] font-mr-bold text-mr-fg">{store.name}</p>
                    {store.official && (
                        <span
                            className="inline-flex items-center gap-0.5 rounded-xs px-1 py-0.5 text-[10px] font-mr-bold uppercase tracking-mr-label text-mr-accent"
                            style={{ background: 'rgba(221,218,42,.15)' }}
                        >
                            ✓ {t('card.official')}
                        </span>
                    )}
                </div>
                {store.description && <p className="mt-0.5 text-[12px] text-mr-fg-subtle line-clamp-1">{store.description}</p>}
            </div>

            <Button
                variant="primary"
                size="sm"
                icon={ExternalLink}
                onClick={() => window.open(store.purchaseUrl ?? store.website, '_blank', 'noopener,noreferrer')}
                className="shrink-0"
            >
                {t('card.goToStore')}
            </Button>
        </article>
    );
};

export default StoreCard;
