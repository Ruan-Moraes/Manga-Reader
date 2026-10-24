import { useCallback, useState } from 'react';

import type { Tag } from '@entities/catalog-filter';
import type { Sort } from '@entities/catalog-filter';
import type { PublicationStatus } from '@entities/catalog-filter';
import type { AdultContent } from '@entities/catalog-filter';

const useCatalogFilters = () => {
    const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
    const [selectedSort, setSelectedSort] = useState<Sort>('most_read');
    const [selectedStatus, setSelectedStatus] = useState<PublicationStatus>('all');
    const [selectedAdultContent, setSelectedAdultContent] = useState<AdultContent>('no_adult_content');
    const [page, setPage] = useState(0);

    const handleSelectedTags = useCallback((newValue: Tag[]) => {
        setSelectedTags(newValue as Tag[]);

        setPage(0);
    }, []);

    const handleSortChange = useCallback((newValue: Sort) => {
        setSelectedSort(newValue);

        setPage(0);
    }, []);

    const handleStatusChange = useCallback((newValue: PublicationStatus) => {
        setSelectedStatus(newValue);

        setPage(0);
    }, []);

    const handleAdultContentChange = useCallback((newValue: AdultContent) => {
        setSelectedAdultContent(newValue);

        setPage(0);
    }, []);

    const handlePageChange = useCallback((newPage: number) => {
        setPage(newPage);
    }, []);

    return {
        selectedTags,
        selectedSort,
        selectedStatus,
        selectedAdultContent,
        page,
        handleSelectedTags,
        handleSortChange,
        handleStatusChange,
        handleAdultContentChange,
        handlePageChange,
    };
};

export default useCatalogFilters;
