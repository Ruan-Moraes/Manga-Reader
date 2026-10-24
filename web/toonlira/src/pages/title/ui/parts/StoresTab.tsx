import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import { StoresContainer, getStoresByTitleId } from '@entities/store';
import { trackBehavior } from '@features/track-user-behavior';

type StoresTabProps = {
    titleId: string;
};

/**
 * Aba de lojas onde a obra está à venda. Consome a API real (DT-46): preços,
 * categoria e metadados de loja vêm do backend.
 */
const StoresTab = ({ titleId }: StoresTabProps) => {
    const { data, isLoading } = useQuery({
        queryKey: [QUERY_KEYS.STORES_BY_TITLE, titleId],
        queryFn: () => getStoresByTitleId(titleId),
        enabled: Boolean(titleId),
    });

    return (
        <StoresContainer
            stores={data?.content ?? []}
            isLoading={isLoading}
            onVisit={store => {
                void trackBehavior({ type: 'STORE_OUTBOUND_CLICK', titleId, source: store.id });
                window.open(store.purchaseUrl ?? store.website, '_blank', 'noopener,noreferrer');
            }}
        />
    );
};

export default StoresTab;
