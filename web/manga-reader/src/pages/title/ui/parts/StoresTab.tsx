import { useQuery } from '@tanstack/react-query';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import { StoresContainer, getStoresByTitleId } from '@entities/store';
import { MOCK_STORES } from '@mock';

type StoresTabProps = {
    titleId: string;
};

/**
 * Aba de lojas onde a obra está à venda. Usa a API quando disponível;
 * enquanto os campos de preço/categoria ainda não vierem do api,
 * mescla com dados de @mock para demonstrar o novo design.
 */
const StoresTab = ({ titleId }: StoresTabProps) => {
    const { data, isLoading } = useQuery({
        queryKey: [QUERY_KEYS.STORES_BY_TITLE, titleId],
        queryFn: () => getStoresByTitleId(titleId),
        enabled: Boolean(titleId),
    });

    // Usa dados reais da API; se ainda não têm os campos novos (price, category…),
    // cai no mock para exibir o design completo em desenvolvimento.
    const stores = data?.content?.length ? data.content : MOCK_STORES;

    return <StoresContainer stores={stores} isLoading={isLoading} />;
};

export default StoresTab;
