import { useLocation } from 'react-router-dom';

import Header from '../../layouts/Header';
import Main from '../../layouts/Main';
import Footer from '../../layouts/Footer';

import Section_Title from '../../components/titles/SectionTitle';

import Select from 'react-select';

const options = [
  { value: 'manga', label: 'Mangá' },
  { value: 'hq', label: 'HQ' },
  { value: 'lightNovel', label: 'Light Novel' },
  { value: 'manhwa', label: 'Manhwa ' },
  { value: 'webtoon', label: 'Webtoon' },
  { value: 'comic', label: 'Comic' },
  { value: 'graphicNovel', label: 'Graphic Novel' },
  { value: 'novel', label: 'Novel' },
  { value: 'webcomic', label: 'Webcomic' },
  { value: 'webnovel', label: 'Webnovel' },
  { value: 'webmanga', label: 'Webmanga' },
  { value: 'webmanhwa', label: 'Webmanhwa' },
];

const Categories = () => {
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const query = queryParams.get('q');

  console.log(query);

  return (
    <>
      <Header disabledBreadcrumb={true} />
      <Main>
        <section className="flex flex-col gap-4">
          <Section_Title title={'Categorias'} />
          <div>
            <form>
              <Select
                noOptionsMessage={() => null}
                blurInputOnSelect={false}
                closeMenuOnSelect={false}
                isMulti
                placeholder="Selecione as categorias"
                options={options}
                styles={{
                  control: (baseStyles, state) => ({
                    ...baseStyles,
                    padding: '0.5rem',
                    backgroundColor: state.isFocused ? '#727273' : '#727273',
                    borderRadius: '0.125rem',
                    border: 'none',

                    boxShadow: state.isFocused
                      ? '0 0 0.075rem 0.25rem #ddda2a40'
                      : '0.25rem 0.25rem 0 0 #ddda2a40',
                    ':hover': {
                      boxShadow: '0 0 0.075rem 0.25rem #ddda2a40',
                    },

                    color: '#FFFFFF',
                    cursor: 'text',
                    transition: 'box-shadow 0.5s',
                  }),
                  placeholder: (baseStyles) => ({
                    ...baseStyles,
                    color: '#161616',
                    fontSize: '0.875rem',
                    lineHeight: '1rem',
                  }),
                  valueContainer: (baseStyles) => ({
                    ...baseStyles,
                    padding: '0',
                  }),
                  input: (baseStyles) => ({
                    ...baseStyles,
                    color: '#FFFFFF',
                    margin: '0',
                    padding: '0',
                  }),
                  multiValue: (baseStyles) => ({
                    ...baseStyles,
                    backgroundColor: '#161616',
                    borderRadius: '0.125rem',
                    padding: '0.25rem',
                    margin: '0.125rem',

                    ':hover': {
                      backgroundColor: '#161616bf',
                    },
                  }),
                  multiValueLabel: (baseStyles) => ({
                    ...baseStyles,
                    color: '#FFFFFF',
                    fontSize: '0.875rem',
                    lineHeight: '1rem',
                  }),
                  multiValueRemove: (baseStyles) => ({
                    ...baseStyles,
                    color: '#FFFFFF',
                    fontSize: '0.875rem',
                    lineHeight: '1rem',
                    padding: '0 0.25rem',

                    ':hover': {
                      backgroundColor: '#ddda2a',
                    },
                  }),
                  menu: (baseStyles) => ({
                    ...baseStyles,
                    backgroundColor: '#161616',
                    borderRadius: '0.125rem',
                    border: '0.125rem solid #727273',
                  }),
                  menuList: (baseStyles) => ({
                    ...baseStyles,
                    padding: '0',
                    overflowX: 'hidden',
                  }),
                  option: (baseStyles, state) => ({
                    ...baseStyles,
                    backgroundColor: state.isSelected ? '#ddda2a' : '#161616',
                    color: state.isSelected ? '#161616' : '#FFFFFF',

                    ':hover': {
                      backgroundColor: '#ddda2a',
                      color: '#161616',
                    },
                  }),
                  clearIndicator: (baseStyles) => ({
                    ...baseStyles,
                    cursor: 'pointer',
                  }),
                  dropdownIndicator: (baseStyles) => ({
                    ...baseStyles,
                    cursor: 'pointer',
                  }),
                }}
              />
            </form>
          </div>
        </section>
      </Main>
      <Footer />
    </>
  );
};

export default Categories;
