import { useRef, useState, useCallback } from 'react';

import Header from '../../layouts/Header';
import Main from '../../layouts/Main';
import Footer from '../../layouts/Footer';

import { OptionTypes } from '../../types/OptionTypes';
import { tagsList } from '../../constants/TAGS';

import FiltersForm from '../../components/form/FiltersForm';
import SelectInput from '../../components/inputs/SelectInput';

import { SortTypes } from '../../types/SortTypes';
// import { SortList } from '../../constants/SORT';

import RadioInput from '../../components/inputs/RadioInput';
import RaisedButton from '../../components/buttons/RaisedButton';

const Categories = () => {
  const selectedSortRefs = useRef<HTMLInputElement[]>([]);

  const [selectedSort, setSelectedSort] = useState<SortTypes>('most_read');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleTagsChange = useCallback((newValue: OptionTypes[]) => {
    setSelectedTags(newValue.map((tag: OptionTypes) => tag.value));
  }, []);

  const handleSortChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value as SortTypes;

      setSelectedSort(value);

      selectedSortRefs.current.forEach((ref) => {
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

  console.log(selectedTags);
  console.log(selectedSort);

  return (
    <>
      <Header disabledBreadcrumb={true} />
      <Main>
        <FiltersForm title="Categorias">
          <SelectInput
            options={tagsList}
            handleTagsChange={handleTagsChange}
            placeholder={'Filtrar por categorias'}
          />
        </FiltersForm>
        <FiltersForm title="Ordenar por" isGrid={true}>
          <RadioInput
            text="Mais lidos"
            value="most_read"
            index={0}
            handleSortChange={handleSortChange}
            selectedSortRefs={selectedSortRefs}
          />
          <RadioInput
            text="Maior Nota"
            value="most_rated"
            index={1}
            handleSortChange={handleSortChange}
            selectedSortRefs={selectedSortRefs}
          />

          <RadioInput
            text="Ancensão"
            value="ascension"
            index={2}
            handleSortChange={handleSortChange}
            selectedSortRefs={selectedSortRefs}
          />
          <RadioInput
            text="Mais Recente"
            value="most_recent"
            index={3}
            handleSortChange={handleSortChange}
            selectedSortRefs={selectedSortRefs}
          />
          <RadioInput
            text="Aleatório"
            value="random"
            index={4}
            handleSortChange={handleSortChange}
            selectedSortRefs={selectedSortRefs}
          />
          <RadioInput
            text="Ordem Alfabética"
            value="alphabetical"
            index={5}
            handleSortChange={handleSortChange}
            selectedSortRefs={selectedSortRefs}
          />
        </FiltersForm>
        <FiltersForm title="Status" isGrid={true}>
          <RadioInput
            text="Completo"
            value="complete"
            index={0}
            handleSortChange={handleSortChange}
            selectedSortRefs={selectedSortRefs}
          />
          <RadioInput
            text="Em andamento"
            value="ongoing"
            index={1}
            handleSortChange={handleSortChange}
            selectedSortRefs={selectedSortRefs}
          />
          <RadioInput
            text="Hiato"
            value="hiatus"
            index={2}
            handleSortChange={handleSortChange}
            selectedSortRefs={selectedSortRefs}
          />
          <RadioInput
            text="Cancelado"
            value="cancelled"
            index={3}
            handleSortChange={handleSortChange}
            selectedSortRefs={selectedSortRefs}
          />
        </FiltersForm>
        <FiltersForm title="Exibir conteúdo +18" isGrid={true}>
          <RadioInput
            text="Sim"
            value="yes"
            index={0}
            handleSortChange={handleSortChange}
            selectedSortRefs={selectedSortRefs}
          />
          <RadioInput
            text="Não"
            value="no"
            index={1}
            handleSortChange={handleSortChange}
            selectedSortRefs={selectedSortRefs}
          />
        </FiltersForm>
        <RaisedButton text="Aplicar" />
      </Main>
      <Footer />
    </>
  );
};

export default Categories;

{
  /*
          <div className="flex flex-col gap-2">
            <div>
              <h3 className="text-lg font-bold">Status:</h3>
            </div>
            <form className="grid grid-cols-2 gap-4">
              {['complete', 'ongoing', 'hiatus', 'cancelled'].map(
                (value, index) => (
                  <div key={value}>
                    <label className="relative flex items-center justify-center h-12 text-sm text-center transition-colors duration-300 border-2 rounded-sm bg-secondary border-tertiary">
                      <input
                        onChange={handleSortChange}
                        ref={(ref) =>
                          (selectedSortRefs.current[index] =
                            ref as HTMLInputElement)
                        }
                        type="radio"
                        name="sort"
                        value={value}
                        className="absolute top-0 bottom-0 left-0 right-0 appearance-none"
                        checked={selectedSort === value}
                      />
                      <span className="px-2 font-bold text-shadow-default">
                        {value === 'complete'
                          ? 'Completo'
                          : value === 'ongoing'
                          ? 'Em andamento'
                          : value === 'hiatus'
                          ? 'Hiato'
                          : 'Cancelado'}
                      </span>
                    </label>
                  </div>
                )
              )}
            </form>
          </div>
          <div className="flex flex-col gap-2">
            <div>
              <h3 className="text-lg font-bold">Exibir conteúdo +18:</h3>
            </div>
            <div>
              <form className="grid grid-cols-2 gap-4">
                {['yes', 'no'].map((value, index) => (
                  <div key={value}>
                    <label className="relative flex items-center justify-center h-12 text-sm text-center transition-colors duration-300 border-2 rounded-sm bg-secondary border-tertiary">
                      <input
                        onChange={handleSortChange}
                        ref={(ref) =>
                          (selectedSortRefs.current[index] =
                            ref as HTMLInputElement)
                        }
                        type="radio"
                        name="sort"
                        value={value}
                        className="absolute top-0 bottom-0 left-0 right-0 appearance-none"
                        checked={selectedSort === value}
                      />
                      <span className="px-2 font-bold text-shadow-default">
                        {value === 'yes' ? 'Sim' : 'Não'}
                      </span>
                    </label>
                  </div>
                ))}
              </form>
            </div>
          </div>
        </section>*/
}
