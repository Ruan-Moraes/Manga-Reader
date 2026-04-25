import { useTranslation } from 'react-i18next';

import Header from '@app/layout/Header';
import MainContent from '@/app/layout/Main';
import Footer from '@app/layout/Footer';

import SectionTitle from '@shared/component/title/SectionTitle';
import TextBlock from '@shared/component/paragraph/TextBlock';
import FiltersForm from '@shared/component/form/FiltersForm';
import RadioInput from '@shared/component/input/RadioInput';
import Pagination from '@shared/component/navigation/Pagination';

import {
    useTagsFetch,
    useCategoryFilters,
    useFilterResults,
    TagSelectInput,
} from '@feature/category';

import VerticalCard from '@feature/manga/component/card/vertical/VerticalCard';

const CategoryFilters = () => {
    const { t } = useTranslation('category');
    const { data: tags } = useTagsFetch();

    const {
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
    } = useCategoryFilters();

    const {
        data: results,
        isLoading,
        isError,
    } = useFilterResults({
        genres: selectedTags,
        sort: selectedSort,
        status: selectedStatus,
        adultContent: selectedAdultContent,
        page,
    });

    return (
        <>
            <Header />
            <MainContent>
                <SectionTitle title={t('filters.title')}>
                    <TextBlock
                        paragraphContent={[
                            { text: t('filters.description') },
                        ]}
                    />
                </SectionTitle>
                <FiltersForm title={t('filters.categoriesTitle')}>
                    <TagSelectInput
                        urlParameterName="tags"
                        options={tags}
                        onChange={handleSelectedTags}
                        placeholder={t('filters.categoriesPlaceholder')}
                    />
                </FiltersForm>
                <FiltersForm isGrid={true} title={t('filters.sortTitle')}>
                    <RadioInput
                        fieldName="sort"
                        onChange={handleSortChange}
                        defaultValue={true}
                        value="most_read"
                        labelText={t('filters.sort.mostRead')}
                    />
                    <RadioInput
                        fieldName="sort"
                        onChange={handleSortChange}
                        value="most_rated"
                        labelText={t('filters.sort.mostRated')}
                    />
                    <RadioInput
                        fieldName="sort"
                        onChange={handleSortChange}
                        value="ascension"
                        labelText={t('filters.sort.ascension')}
                    />
                    <RadioInput
                        fieldName="sort"
                        onChange={handleSortChange}
                        value="most_recent"
                        labelText={t('filters.sort.mostRecent')}
                    />
                    <RadioInput
                        fieldName="sort"
                        onChange={handleSortChange}
                        value="random"
                        labelText={t('filters.sort.random')}
                    />
                    <RadioInput
                        fieldName="sort"
                        onChange={handleSortChange}
                        value="alphabetical"
                        labelText={t('filters.sort.alphabetical')}
                    />
                </FiltersForm>
                <FiltersForm isGrid={true} title={t('filters.statusTitle')}>
                    <RadioInput
                        fieldName="status"
                        onChange={handleStatusChange}
                        value="complete"
                        labelText={t('filters.status.complete')}
                    />
                    <RadioInput
                        fieldName="status"
                        onChange={handleStatusChange}
                        value="ongoing"
                        labelText={t('filters.status.ongoing')}
                    />
                    <RadioInput
                        fieldName="status"
                        onChange={handleStatusChange}
                        value="hiatus"
                        labelText={t('filters.status.hiatus')}
                    />
                    <RadioInput
                        fieldName="status"
                        onChange={handleStatusChange}
                        value="cancelled"
                        labelText={t('filters.status.cancelled')}
                    />
                    <RadioInput
                        className="col-span-full"
                        fieldName="status"
                        defaultValue={true}
                        onChange={handleStatusChange}
                        value="all"
                        labelText={t('filters.status.all')}
                    />
                </FiltersForm>
                <FiltersForm isGrid={true} title={t('filters.adultTitle')}>
                    <RadioInput
                        fieldName="adult_content"
                        onChange={handleAdultContentChange}
                        value="adult_content"
                        labelText={t('filters.adult.yes')}
                    />
                    <RadioInput
                        defaultValue={true}
                        fieldName="adult_content"
                        onChange={handleAdultContentChange}
                        value="no_adult_content"
                        labelText={t('filters.adult.no')}
                    />
                </FiltersForm>

                <section className="flex flex-col gap-4 mt-4">
                    {results && (
                        <span className="text-sm text-secondary">
                            {t('filters.resultsCount', {
                                count: results.totalElements,
                            })}
                        </span>
                    )}

                    {isLoading && (
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-5">
                            {Array.from({ length: 10 }).map((_, i) => (
                                <VerticalCard
                                    key={i}
                                    isLoading={true}
                                    isError={false}
                                />
                            ))}
                        </div>
                    )}

                    {isError && (
                        <p className="py-8 text-sm text-center text-secondary">
                            {t('filters.errorMessage')}
                        </p>
                    )}

                    {results && results.content.length === 0 && (
                        <p className="py-8 text-sm text-center text-secondary">
                            {t('filters.emptyResults')}
                        </p>
                    )}

                    {results && results.content.length > 0 && (
                        <>
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-5">
                                {results.content.map(title => (
                                    <VerticalCard
                                        key={title.id}
                                        isLoading={false}
                                        isError={false}
                                        id={title.id}
                                        type={title.type}
                                        cover={title.cover}
                                        name={title.name}
                                        ratingAverage={title.ratingAverage}
                                        chapters={title.chapters}
                                    />
                                ))}
                            </div>
                            <Pagination
                                page={page + 1}
                                totalPages={results.totalPages}
                                onPageChange={p => handlePageChange(p - 1)}
                            />
                        </>
                    )}
                </section>
            </MainContent>
            <Footer />
        </>
    );
};

export default CategoryFilters;
