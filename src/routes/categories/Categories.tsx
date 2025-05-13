import { useState, useCallback } from 'react';

import { TagsTypes } from '../../types/TagsTypes';
import { SortTypes } from '../../types/SortTypes';
import { StatusTypes } from '../../types/StatusTypes';
import { AdultContentTypes } from '../../types/AdultContentTypes';

import Header from '../../layouts/Header';
import Main from '../../layouts/Main';
import Footer from '../../layouts/Footer';

import useFetchTags from '../../hooks/fetch/useFetchTags';

import SectionTitle from '../../components/titles/SectionTitle';
import Paragraph from '../../components/paragraph/Paragraph';
import FiltersForm from '../../components/forms/FiltersForm';
import SelectInput from '../../components/inputs/SelectInput';
import RadioInput from '../../components/inputs/RadioInput';
import RaisedButton from '../../components/buttons/RaisedButton';

const Categories = () => {
  const { data } = useFetchTags(
    'tags',
    'https://db-json-ten.vercel.app/tags',
    16
  );
  const tags = Array.isArray(data) ? data : undefined;

  const [selectedTags, setSelectedTags] = useState<TagsTypes[]>([]);
  const [selectedSort, setSelectedSort] = useState<SortTypes>('most_read');
  const [selectedStatus, setSelectedStatus] = useState<StatusTypes>('ongoing');
  const [selectedAdultContent, setSelectedAdultContent] =
    useState<AdultContentTypes>('no_adult_content');

  const handleSelectedTags = useCallback((newValue: TagsTypes[]) => {
    setSelectedTags(newValue as TagsTypes[]);
  }, []);

  const handleSortChange = useCallback((newValue: SortTypes) => {
    setSelectedSort(newValue);
  }, []);

  const handleStatusChange = useCallback((newValue: StatusTypes) => {
    setSelectedStatus(newValue);
  }, []);

  const handleAdultContentChange = useCallback(
    (newValue: AdultContentTypes) => {
      setSelectedAdultContent(newValue);
    },
    []
  );

  console.log(selectedTags);
  console.log(selectedSort);
  console.log(selectedStatus);
  console.log(selectedAdultContent);

  const createUrl = () => {
    const params = new URLSearchParams();

    if (selectedTags.length > 0) {
      selectedTags.forEach((tag) => {
        params.append('tags', tag.value.toString());
      });
    }

    if (selectedSort) {
      params.set('sort', selectedSort);
    }

    if (selectedStatus) {
      params.set('status', selectedStatus);
    }

    if (selectedAdultContent) {
      params.set('adult_content', selectedAdultContent);
    }

    return `http://localhost:5000/search_title_by?${params.toString()}`;
  };

  console.log(createUrl());

  return (
    <>
      <Header />
      <Main>
        <SectionTitle title="Filtros">
          <Paragraph
            paragraphContent={[
              {
                text: 'Aplique filtros para encontrar as obras que você deseja ler. Você pode filtrar por categorias, ordenar por mais lidos, maior nota, ordem alfabética, entre outros. Além disso, você pode filtrar por status da obra e se deseja exibir conteúdo maior de 18 anos.',
              },
            ]}
          />
        </SectionTitle>
        <FiltersForm title="Categorias">
          <SelectInput
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
            labelText="Ancensão"
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
        <RaisedButton text="Aplicar Filtros" />
      </Main>
      <Footer />
    </>
  );
};

export default Categories;
