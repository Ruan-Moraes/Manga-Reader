import { useCallback, useMemo, useState } from 'react';

import type { Tag } from '../type/tag.types';
import type { Sort } from '../type/sort.types';
import type { PublicationStatus } from '../type/publication-status.types';
import type { AdultContent } from '../type/adult-content.types';

const buildFilterUrl = (
    tags: Tag[],
    sort: Sort,
    status: PublicationStatus,
    adultContent: AdultContent,
) => {
    const params = new URLSearchParams();

    if (tags.length > 0) {
        tags.forEach(tag => {
            params.append('tags', tag.value.toString());
        });
    }

    if (sort) {
        params.set('sort', sort);
    }

    if (status) {
        params.set('status', status);
    }

    if (adultContent) {
        params.set('adult_content', adultContent);
    }

    return `http://localhost:5000/search_title_by?${params.toString()}`;
};

const useCategoryFilters = () => {
    const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
    const [selectedSort, setSelectedSort] = useState<Sort>('most_read');
    const [selectedStatus, setSelectedStatus] =
        useState<PublicationStatus>('ongoing');
    const [selectedAdultContent, setSelectedAdultContent] =
        useState<AdultContent>('no_adult_content');

    const handleSelectedTags = useCallback((newValue: Tag[]) => {
        setSelectedTags(newValue as Tag[]);
    }, []);

    const handleSortChange = useCallback((newValue: Sort) => {
        setSelectedSort(newValue);
    }, []);

    const handleStatusChange = useCallback((newValue: PublicationStatus) => {
        setSelectedStatus(newValue);
    }, []);

    const handleAdultContentChange = useCallback((newValue: AdultContent) => {
        setSelectedAdultContent(newValue);
    }, []);

    const filterUrl = useMemo(
        () =>
            buildFilterUrl(
                selectedTags,
                selectedSort,
                selectedStatus,
                selectedAdultContent,
            ),
        [selectedTags, selectedSort, selectedStatus, selectedAdultContent],
    );

    return {
        selectedTags,
        selectedSort,
        selectedStatus,
        selectedAdultContent,
        handleSelectedTags,
        handleSortChange,
        handleStatusChange,
        handleAdultContentChange,
        filterUrl,
    };
};

export default useCategoryFilters;
