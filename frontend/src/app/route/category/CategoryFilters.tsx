import Header from '@app/layout/Header';
import MainContent from '@/app/layout/Main';
import Footer from '@app/layout/Footer';

import SectionTitle from '@shared/component/title/SectionTitle';
import TextBlock from '@shared/component/paragraph/TextBlock';
import FiltersForm from '@shared/component/form/FiltersForm';
import RadioInput from '@shared/component/input/RadioInput';
import RaisedButton from '@shared/component/button/RaisedButton';
import Pagination from '@shared/component/navigation/Pagination';

import {
    useTagsFetch,
    useCategoryFilters,
    useFilterResults,
    TagSelectInput,
} from '@feature/category';

import VerticalCard from '@feature/manga/component/card/vertical/VerticalCard';

const CategoryFilters = () => {
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
                <SectionTitle title="Filtrar Obras">
                    <TextBlock
                        paragraphContent={[
                            {
                                text: 'Aplique filtros para encontrar as obras que você deseja ler. Você pode filtrar por categorias, ordenar por mais lidos, maior nota, ordem alfabética, entre outros.',
                            },
                        ]}
                    />
                </SectionTitle>
                <FiltersForm title="Categorias">
                    <TagSelectInput
                        urlParameterName="tags"
                        options={tags}
                        onChange={handleSelectedTags}
                        placeholder="Seleciona uma ou mais categorias"
                    />
                </FiltersForm>
                <FiltersForm isGrid={true} title="Ordenar por">
                    <RadioInput
                        fieldName="sort"
                        onChange={handleSortChange}
                        defaultValue={true}
                        value="most_read"
                        labelText="Mais lidos"
                    />
                    <RadioInput
                        fieldName="sort"
                        onChange={handleSortChange}
                        value="most_rated"
                        labelText="Maior Nota"
                    />
                    <RadioInput
                        fieldName="sort"
                        onChange={handleSortChange}
                        value="ascension"
                        labelText="Ascensão"
                    />
                    <RadioInput
                        fieldName="sort"
                        onChange={handleSortChange}
                        value="most_recent"
                        labelText="Mais Recente"
                    />
                    <RadioInput
                        fieldName="sort"
                        onChange={handleSortChange}
                        value="random"
                        labelText="Aleatório"
                    />
                    <RadioInput
                        fieldName="sort"
                        onChange={handleSortChange}
                        value="alphabetical"
                        labelText="Alfabética"
                    />
                </FiltersForm>
                <FiltersForm isGrid={true} title="Status">
                    <RadioInput
                        fieldName="status"
                        onChange={handleStatusChange}
                        value="complete"
                        labelText="Completo"
                    />
                    <RadioInput
                        fieldName="status"
                        onChange={handleStatusChange}
                        value="ongoing"
                        labelText="Em andamento"
                    />
                    <RadioInput
                        fieldName="status"
                        onChange={handleStatusChange}
                        value="hiatus"
                        labelText="Hiato"
                    />
                    <RadioInput
                        fieldName="status"
                        onChange={handleStatusChange}
                        value="cancelled"
                        labelText="Cancelado"
                    />
                    <RadioInput
                        className="col-span-full"
                        fieldName="status"
                        defaultValue={true}
                        onChange={handleStatusChange}
                        value="all"
                        labelText="Todos"
                    />
                </FiltersForm>
                <FiltersForm isGrid={true} title="Exibir conteúdo +18">
                    <RadioInput
                        fieldName="adult_content"
                        onChange={handleAdultContentChange}
                        value="adult_content"
                        labelText="Sim"
                    />
                    <RadioInput
                        defaultValue={true}
                        fieldName="adult_content"
                        onChange={handleAdultContentChange}
                        value="no_adult_content"
                        labelText="Não"
                    />
                </FiltersForm>

                <section className="flex flex-col gap-4 mt-4">
                    {results && (
                        <span className="text-sm text-secondary">
                            {results.totalElements} resultado(s)
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
                            Erro ao carregar resultados. Tente novamente.
                        </p>
                    )}

                    {results && results.content.length === 0 && (
                        <p className="py-8 text-sm text-center text-secondary">
                            Nenhuma obra encontrada com os filtros selecionados.
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
