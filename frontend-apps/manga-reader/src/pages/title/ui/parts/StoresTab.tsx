import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import { StoresContainer, getStoresByTitleId } from '@entities/store';

type StoresTabProps = {
    titleId: string;
};

/**
 * Aba de lojas onde a obra está à venda. Busca as lojas por título e reusa o
 * StoresContainer (grid de StoreCards com loading/empty próprios).
 */
const StoresTab = ({ titleId }: StoresTabProps) => {
    const { data, isLoading } = useQuery({
        queryKey: [QUERY_KEYS.STORES_BY_TITLE, titleId],
        queryFn: () => getStoresByTitleId(titleId),
        enabled: Boolean(titleId),
    });

    return <StoresContainer stores={data?.content ?? []} isLoading={isLoading} />;
};

export default StoresTab;
