import { useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Select, { SelectInstance, SingleValue } from 'react-select';

import { COLORS } from '../../constants/COLORS';

import Header from './../../layouts/Header';
import Main from './../../layouts/Main';
import Footer from './../../layouts/Footer';

import Warning from '../../components/notifications/Warning';

const Chapter = () => {
  const navigate = useNavigate();

  const titleId = useParams().title;
  const chapterId = useParams().chapter;

  const selectRef =
    useRef<SelectInstance<{ value: string; label: string }>>(null);

  // Todo: Implement a way to check if the chapter exists
  if (isNaN(Number(chapterId))) {
    return (
      <Main>
        <Warning
          title="Capítulo não encontrado"
          message="O capítulo que você está tentando acessar não existe."
          color={COLORS.QUINARY}
          linkText="Voltar para página do título"
          href={`/titles/${titleId}`}
        />
      </Main>
    );
  }

  const handleChange = (
    newValue: SingleValue<{ value: string; label: string }>
  ) => {
    navigate(`/Manga-Reader/titles/${titleId}/${newValue?.value}`);
  };

  return (
    <>
      <Header disabledAuth={true} disabledSearch={true} />
      <Main className="gap-4 ">
        <section>
          <div className="flex flex-col gap-2">
            <div>
              <h2
                className="overflow-hidden text-xl font-bold"
                style={{
                  display: '-webkit-box',
                  WebkitBoxOrient: 'vertical',
                  WebkitLineClamp: 3,
                }}
              >
                Naruto Clássico Lorem ipsum dolor sit amet consectetur,
                adipisicing elit. Quasi, nam velit? Nesciunt autem, ut illum
                maxime atque ullam quo eum quod eius ducimus iure fugiat harum
                maiores nostrum, molestias molestiae.
              </h2>
            </div>
            <div className="flex flex-col gap-2">
              <div>
                <form>
                  <Select
                    name="chapter"
                    ref={selectRef}
                    onChange={handleChange}
                    defaultValue={{
                      value: chapterId,
                      label: `Capítulo ${chapterId}`,
                    }}
                    isClearable={false}
                    isSearchable={true}
                    noOptionsMessage={() => 'Carregando...'}
                    options={[
                      { value: '1', label: 'Capítulo 1' },
                      { value: '2', label: 'Capítulo 2' },
                      { value: '3', label: 'Capítulo 3' },
                      { value: '4', label: 'Capítulo 4' },
                      { value: '5', label: 'Capítulo 5' },
                      { value: '6', label: 'Capítulo 6' },
                      { value: '7', label: 'Capítulo 7' },
                      { value: '8', label: 'Capítulo 8' },
                      { value: '9', label: 'Capítulo 9' },
                      { value: '10', label: 'Capítulo 10' },
                    ]}
                    styles={{
                      control: (baseStyles, state) => ({
                        ...baseStyles,
                        padding: '0.5rem',
                        backgroundColor: '#252526',
                        borderRadius: '0.125rem',
                        border: state.isFocused
                          ? '0.0625rem solid #ddda2a'
                          : '0.0625rem solid #727273',
                        boxShadow: state.isFocused ? '0 0 0 0' : '0 0 0 0',
                        cursor: 'text',
                        transition: 'border 0.3s',
                        '&:hover': {
                          border: state.isFocused ? 0 : 0,
                        },
                      }),
                      placeholder: (baseStyles) => ({
                        ...baseStyles,
                        fontSize: '0.875rem',
                        lineHeight: '1rem',
                        color: '#FFFFFF',
                      }),
                      valueContainer: (baseStyles) => ({
                        ...baseStyles,
                        padding: '0',
                      }),
                      input: (baseStyles) => ({
                        ...baseStyles,
                        margin: '0 0 0 0.25rem',
                        padding: '0',
                        color: '#FFFFFF',
                      }),
                      singleValue: (baseStyles) => ({
                        ...baseStyles,
                        color: '#FFFFFF',
                      }),
                      multiValue: (baseStyles) => ({
                        ...baseStyles,
                        margin: '0.125rem',
                        padding: '0.25rem',
                        borderRadius: '0.125rem',
                        backgroundColor: '#161616',
                        transition: 'background-color 0.3s',
                        ':hover': {
                          backgroundColor: '#161616bf',
                        },
                      }),
                      multiValueLabel: (baseStyles) => ({
                        ...baseStyles,
                        fontSize: '0.875rem',
                        lineHeight: '1rem',
                        color: '#FFFFFF',
                      }),
                      menu: (baseStyles) => ({
                        ...baseStyles,
                        borderRadius: '0.125rem',
                        border: '0.125rem solid #727273',
                        backgroundColor: '#161616',
                      }),
                      menuList: (baseStyles) => ({
                        ...baseStyles,
                        padding: '0',
                        overflowX: 'hidden',
                      }),
                      option: (baseStyles, state) => ({
                        ...baseStyles,
                        backgroundColor: state.isSelected
                          ? '#ddda2a'
                          : '#161616',
                        color: state.isSelected ? '#161616' : '#FFFFFF',
                        ':hover': {
                          backgroundColor: '#ddda2a',
                          color: '#161616',
                        },
                      }),
                      dropdownIndicator: (baseStyles) => ({
                        ...baseStyles,
                        padding: '0.125rem',
                        margin: '0 0 0 6px',
                        cursor: 'pointer',
                        transition: 'background-color 0.3s',
                        ':hover': {
                          backgroundColor: '#ddda2a80',
                        },
                      }),
                      indicatorSeparator: (baseStyles) => ({
                        ...baseStyles,
                        margin: '0',
                        backgroundColor: '#727273',
                      }),
                    }}
                  />
                </form>
              </div>
              <div className="flex gap-2">
                <button className="p-2 border rounded-sm bg-secondary border-tertiary grow">
                  Anterior
                </button>
                <button className="p-2 border rounded-sm bg-secondary border-tertiary grow">
                  Próximo
                </button>
              </div>
            </div>
          </div>
        </section>
        <section>
          <div className="flex flex-col justify-center gap-0.5">
            <div>
              <img src="https://fakeimg.pl/1024x1024?text=Capítulo" alt="" />
            </div>
            <div>
              <img src="https://fakeimg.pl/1024x1024?text=Capítulo" alt="" />
            </div>
            <div>
              <img src="https://fakeimg.pl/1024x1024?text=Capítulo" alt="" />
            </div>
            <div>
              <img src="https://fakeimg.pl/1024x1024?text=Capítulo" alt="" />
            </div>
            <div>
              <img src="https://fakeimg.pl/1024x1024?text=Capítulo" alt="" />
            </div>
            <div>
              <img src="https://fakeimg.pl/1024x1024?text=Capítulo" alt="" />
            </div>
            <div>
              <img src="https://fakeimg.pl/1024x1024?text=Capítulo" alt="" />
            </div>
            <div>
              <img src="https://fakeimg.pl/1024x1024?text=Capítulo" alt="" />
            </div>
            <div>
              <img src="https://fakeimg.pl/1024x1024?text=Capítulo" alt="" />
            </div>
            <div>
              <img src="https://fakeimg.pl/1024x1024?text=Capítulo" alt="" />
            </div>
          </div>
        </section>
      </Main>
      <Footer />
    </>
  );
};

export default Chapter;
