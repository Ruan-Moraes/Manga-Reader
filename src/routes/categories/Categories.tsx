import { useRef, useState, useCallback } from 'react';

import Header from '../../layouts/Header';
import Main from '../../layouts/Main';
import Footer from '../../layouts/Footer';

import FiltersForm from '../../components/form/FiltersForm';
import SelectInput from '../../components/inputs/SelectInput';

import useTags from '../../types/TagsTypes';

import { SortTypes } from '../../types/SortTypes';
import { StatusTypes } from '../../types/StatusTypes';
import { AdultContentTypes } from '../../types/AdultContentTypes';

import RadioInput from '../../components/inputs/RadioInput';
import RaisedButton from '../../components/buttons/RaisedButton';
import SectionTitle from '../../components/titles/SectionTitle';

const Categories = () => {
  const {
    data: tags,
    isLoading: tagsLoading,
    isError: tagsIsError,
  } = useTags();

  const selectedSortRefs = useRef<HTMLInputElement[]>([]);
  const selectedStatusRefs = useRef<HTMLInputElement[]>([]);
  const selectedAdultContentRefs = useRef<HTMLInputElement[]>([]);

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedSort, setSelectedSort] = useState<SortTypes>('most_read');
  const [selectedStatus, setSelectedStatus] = useState<StatusTypes>('ongoing');
  const [selectedAdultContent, setSelectedAdultContent] =
    useState<AdultContentTypes>('no_adult_content');

  const changeClasses = useCallback(
    (refs: React.MutableRefObject<HTMLInputElement[]>) => {
      refs.current.forEach((ref) => {
        const parent = ref.parentNode as HTMLElement;

        parent.classList.remove(
          'border-quaternary-default',
          'bg-quaternary-opacity-25'
        );
        parent.classList.add('border-tertiary', 'bg-secondary');

        if (ref.checked) {
          parent.classList.remove('border-tertiary', 'bg-secondary');
          parent.classList.add(
            'border-quaternary-default',
            'bg-quaternary-opacity-25'
          );
        }
      });
    },
    []
  );

  const handleTagsChange = useCallback(
    (newValue): void => {
      if (tagsLoading || tagsIsError) return;

      const tags = selectedTags.map((tag) => {
        return tags.find((t) => t.name === tag);
      });
    },
    [tagsLoading, tagsIsError, selectedTags]
  );

  const handleSortChange = useCallback(
    (
      e: React.ChangeEvent<HTMLInputElement>,
      setter: React.Dispatch<React.SetStateAction<SortTypes>>,
      refs: React.MutableRefObject<HTMLInputElement[]>,
      valueParser: (value: string) => SortTypes
    ) => {
      setter(valueParser(e.target.value));

      changeClasses(refs);
    },
    [changeClasses]
  );

  const handleStatusChange = useCallback(
    (
      e: React.ChangeEvent<HTMLInputElement>,
      setter: React.Dispatch<React.SetStateAction<StatusTypes>>,
      refs: React.MutableRefObject<HTMLInputElement[]>,
      valueParser: (value: string) => StatusTypes
    ) => {
      setter(valueParser(e.target.value));

      changeClasses(refs);
    },
    [changeClasses]
  );

  const handleAdultContentChange = useCallback(
    (
      e: React.ChangeEvent<HTMLInputElement>,
      setter: React.Dispatch<React.SetStateAction<AdultContentTypes>>,
      refs: React.MutableRefObject<HTMLInputElement[]>,
      valueParser: (value: string) => AdultContentTypes
    ) => {
      setter(valueParser(e.target.value));

      changeClasses(refs);
    },
    [changeClasses]
  );

  console.log(selectedTags);
  console.log(selectedSort);
  console.log(selectedStatus);
  console.log(selectedAdultContent);

  return (
    <>
      <Header disabledBreadcrumb={true} />
      <Main>
        <SectionTitle title="Filtros">
          <p className="text-sm text-justify">
            Aplique filtros para encontrar as obras que você deseja ler. Você
            pode filtrar por categorias, ordenar por mais lidos, maior nota,
            ordem alfabética, entre outros. Além disso, você pode filtrar por
            status da obra e se deseja exibir conteúdo maior de 18 anos.
          </p>
        </SectionTitle>
        <FiltersForm title="Categorias">
          <SelectInput
            options={tags}
            onChange={handleTagsChange}
            placeholder={'Filtrar por categorias'}
          />
        </FiltersForm>
        <FiltersForm title="Ordenar por" isGrid={true}>
          <RadioInput
            onChange={(e) =>
              handleSortChange(
                e,
                setSelectedSort,
                selectedSortRefs,
                (value: string) => value as SortTypes
              )
            }
            refElement={selectedSortRefs}
            defaultValue={true}
            index={0}
            fieldName="sort"
            value="most_read"
            labelText="Mais lidos"
          />
          <RadioInput
            onChange={(e) =>
              handleSortChange(
                e,
                setSelectedSort,
                selectedSortRefs,
                (value: string) => value as SortTypes
              )
            }
            refElement={selectedSortRefs}
            index={1}
            fieldName="sort"
            value="most_rated"
            labelText="Maior Nota"
          />
          <RadioInput
            onChange={(e) =>
              handleSortChange(
                e,
                setSelectedSort,
                selectedSortRefs,
                (value: string) => value as SortTypes
              )
            }
            refElement={selectedSortRefs}
            index={2}
            fieldName="sort"
            value="ascension"
            labelText="Ancensão"
          />
          <RadioInput
            onChange={(e) =>
              handleSortChange(
                e,
                setSelectedSort,
                selectedSortRefs,
                (value: string) => value as SortTypes
              )
            }
            refElement={selectedSortRefs}
            index={3}
            fieldName="sort"
            value="most_recent"
            labelText="Mais Recente"
          />
          <RadioInput
            onChange={(e) =>
              handleSortChange(
                e,
                setSelectedSort,
                selectedSortRefs,
                (value: string) => value as SortTypes
              )
            }
            refElement={selectedSortRefs}
            index={4}
            fieldName="sort"
            value="random"
            labelText="Aleatório"
          />
          <RadioInput
            onChange={(e) =>
              handleSortChange(
                e,
                setSelectedSort,
                selectedSortRefs,
                (value: string) => value as SortTypes
              )
            }
            refElement={selectedSortRefs}
            index={5}
            fieldName="sort"
            value="alphabetical"
            labelText="Ordem Alfabética"
          />
        </FiltersForm>
        <FiltersForm title="Status" isGrid={true}>
          <RadioInput
            onChange={(e) =>
              handleStatusChange(
                e,
                setSelectedStatus,
                selectedStatusRefs,
                (value: string) => value as StatusTypes
              )
            }
            refElement={selectedStatusRefs}
            index={0}
            fieldName="status"
            value="complete"
            labelText="Completo"
          />
          <RadioInput
            onChange={(e) =>
              handleStatusChange(
                e,
                setSelectedStatus,
                selectedStatusRefs,
                (value: string) => value as StatusTypes
              )
            }
            refElement={selectedStatusRefs}
            index={1}
            fieldName="status"
            value="ongoing"
            labelText="Em andamento"
          />
          <RadioInput
            onChange={(e) =>
              handleStatusChange(
                e,
                setSelectedStatus,
                selectedStatusRefs,
                (value: string) => value as StatusTypes
              )
            }
            refElement={selectedStatusRefs}
            index={2}
            fieldName="status"
            value="hiatus"
            labelText="Hiato"
          />
          <RadioInput
            onChange={(e) =>
              handleStatusChange(
                e,
                setSelectedStatus,
                selectedStatusRefs,
                (value: string) => value as StatusTypes
              )
            }
            refElement={selectedStatusRefs}
            index={3}
            fieldName="status"
            value="cancelled"
            labelText="Cancelado"
          />
          <RadioInput
            onChange={(e) =>
              handleStatusChange(
                e,
                setSelectedStatus,
                selectedStatusRefs,
                (value: string) => value as StatusTypes
              )
            }
            refElement={selectedStatusRefs}
            defaultValue={true}
            index={2}
            className="col-span-full"
            fieldName="status"
            value="all"
            labelText="Todos"
          />
        </FiltersForm>
        <FiltersForm title="Exibir conteúdo +18" isGrid={true}>
          <RadioInput
            onChange={(e) =>
              handleAdultContentChange(
                e,
                setSelectedAdultContent,
                selectedAdultContentRefs,
                (value: string) => value as AdultContentTypes
              )
            }
            refElement={selectedAdultContentRefs}
            index={0}
            fieldName="adult_content"
            value="adult_content"
            labelText="Sim"
          />
          <RadioInput
            onChange={(e) =>
              handleAdultContentChange(
                e,
                setSelectedAdultContent,
                selectedAdultContentRefs,
                (value: string) => value as AdultContentTypes
              )
            }
            refElement={selectedAdultContentRefs}
            defaultValue={true}
            index={1}
            fieldName="adult_content"
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
