import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';

import { getDomainLabels } from '../service/labelService';
import type { DomainLabelOption } from '../type/label.types';

const THREE_DAYS_MS = 1000 * 60 * 60 * 24 * 3;

const useDomainLabels = (type: string): UseQueryResult<DomainLabelOption[]> => {
    const { i18n } = useTranslation();

    return useQuery<DomainLabelOption[]>({
        queryKey: [QUERY_KEYS.DOMAIN_LABELS, type, i18n.language],
        queryFn: () => getDomainLabels(type),
        staleTime: THREE_DAYS_MS,
        gcTime: THREE_DAYS_MS,
    });
};

export default useDomainLabels;
