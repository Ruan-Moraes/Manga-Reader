// import { useParams } from 'react-router-dom';

import Header from '../../layouts/Header';
import Main from '../../layouts/Main';
import Footer from '../../layouts/Footer';

import { BsBookmark } from 'react-icons/bs';
import { AiOutlineLike } from 'react-icons/ai';
import { MdGroups } from 'react-icons/md';
import { MdOutlineShoppingCart } from 'react-icons/md';
import { FaSortNumericDown } from 'react-icons/fa';
// import { FaSortNumericDownAlt } from 'react-icons/fa';

// import BaseButton from './../../components/buttons/BaseButton';

const Titles = () => {
  // const { title } = useParams<{ title: string }>();

  return (
    <>
      <Header />
      <Main>
        <div>
          <div className="flex gap-2">
            <div className="flex flex-col w-[calc(50%_-_0.25rem)] border rounded-t-sm border-tertiary border-b-0">
              <div className="w-full h-64 border-b border-b-tertiary">
                <img
                  src="https://wallpapers.com/images/high/naruto-manga-e86faunm0r96om1e.webp"
                  alt=""
                  className="object-cover w-full h-full"
                />
              </div>
              <div>
                <div className="px-2 py-1 text-sm font-bold text-center bg-tertiary">
                  <h3 className="truncate text-shadow-default">
                    Naruto Clássico
                  </h3>
                </div>
                <div className="flex flex-col w-full gap-1 p-2 text-xs">
                  <div>
                    <p className="truncate">
                      <span className="font-bold">Tipo:</span>{' '}
                      <span>Manga</span>
                    </p>
                  </div>
                  <div>
                    <p className="truncate">
                      <span className="font-bold">Popularidade:</span>{' '}
                      <span>4º</span>
                    </p>
                  </div>
                  <div>
                    <p>
                      <span className="font-bold">Nota:</span> <span>8.5</span>
                    </p>
                  </div>
                  <div>
                    <p>
                      <span className="font-bold">Capítulos:</span>{' '}
                      <span>700</span>
                    </p>
                  </div>
                  <div>
                    <p className="truncate">
                      <span className="font-bold">Autor:</span>{' '}
                      <span>Masashi Kishimoto</span>
                    </p>
                  </div>
                  <div>
                    <p className="truncate">
                      <span className="font-bold">Artista:</span>{' '}
                      <span>Masashi Kishimoto</span>
                    </p>
                  </div>
                  <div>
                    <p className="truncate">
                      <span className="font-bold">Editora:</span>{' '}
                      <span>Shueisha</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-between w-[calc(50%_-_0.25rem)] gap-4 pb-2">
              <div className="flex flex-col gap-2">
                <h3 className="px-2 py-1 text-sm font-bold text-center rounded-sm bg-tertiary text-shadow-default">
                  Sinopse
                </h3>
                <p className="text-xs text-justify">
                  {/* Naruto Uzumaki é um jovem ninja que possui uma besta com cauda
                  dentro de si, a Kyuubi, a Raposa de Nove Caudas. Ele é
                  ambicioso e quer se tornar o Hokage, o líder da Vila da Folha.
                  Ele é um membro da equipe 7, composta por ele, Sasuke Uchiha,
                  Sakura Haruno e seu sensei, Kakashi Hatake. */}
                  Lorem ipsum dolor sit amet consectetur adipisicing elit. Nulla
                  qui ut cupiditate! Commodi, dolore consequuntur quam tempore
                  autem assumenda non ipsum ducimus, ipsam eos quis et quisquam
                  officiis laboriosam. Numquam. Lorem ipsum dolor sit, amet
                  consectetur adipisicing elit. Ut accusantium expedita fugit
                  consequatur? Fugiat voluptatem maxime pariatur culpa, ipsa
                  minima voluptate commodi ea, est saepe quidem repudiandae
                  nulla! Dolores, voluptate? Lorem ipsum dolor sit amet
                  consectetur adipisicing elit. Vel numquam earum tempore
                  veniam, dolorum commodi. Accusamus quas ut officia similique
                  corrupti ipsum quae. Nam facilis eveniet nulla quasi natus
                  laudantium.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="px-2 py-1 text-sm font-bold text-center rounded-sm bg-tertiary text-shadow-default">
                  Gêneros
                </h3>
                <ul className="flex flex-wrap gap-1 text-xs">
                  <li className="p-1 text-white border rounded-sm bg-secondary border-tertiary">
                    Shounen
                  </li>
                  <li className="p-1 text-white border rounded-sm bg-secondary border-tertiary">
                    Aventura
                  </li>
                  <li className="p-1 text-white border rounded-sm bg-secondary border-tertiary">
                    Ação
                  </li>
                  <li className="p-1 text-white border rounded-sm bg-secondary border-tertiary">
                    Comédia
                  </li>
                  <li className="p-1 text-white border rounded-sm bg-secondary border-tertiary">
                    Drama
                  </li>
                  <li className="p-1 text-white border rounded-sm bg-secondary border-tertiary">
                    Fantasia
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between h-full py-2 border rounded-r-sm rounded-bl-sm border-tertiary bg-tertiary">
            <div className="flex items-center justify-center grow">
              <BsBookmark className="text-2xl" />
            </div>
            <div className="h-8 mx-2 border rounded-sm border-secondary"></div>
            <div className="flex items-center justify-center grow">
              <AiOutlineLike className="text-2xl" />
            </div>
            <div className="h-8 mx-2 border rounded-sm border-secondary"></div>
            <div className="flex items-center justify-center grow">
              <MdGroups className="text-2xl" />
            </div>
            <div className="h-8 mx-2 border rounded-sm border-secondary"></div>
            <div className="flex items-center justify-center grow">
              <MdOutlineShoppingCart className="text-2xl" />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div>
              <h3 className="text-xl font-bold leading-none text-shadow-default">
                Capítulos:
              </h3>
            </div>
            <div className="flex items-stretch gap-2">
              <div>
                <button className="flex items-center h-full gap-2 px-2 py-1 border rounded-sm border-tertiary bg-secondary">
                  <span className="text-xs font-bold">Ordenar por:</span>
                  <span>
                    <FaSortNumericDown className="text-lg" />
                  </span>
                </button>
              </div>
              <div className="grow">
                <div>
                  <input
                    type="search"
                    name=""
                    id=""
                    placeholder="Pesquisar Capítulo"
                    className="w-full px-2 py-1 border rounded-sm appearance-none border-tertiary bg-secondary"
                  />
                </div>
                <div></div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1 text-xs">
            <div className="flex justify-between pb-2 border-b-2 border-b-tertiary">
              <div className="flex flex-col gap-1">
                <p>
                  <span className="font-bold">Capítulo:</span> <span>1</span>
                </p>
                <p>
                  <span className="font-bold">Título:</span>{' '}
                  <span>Naruto Uzumaki</span>
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <p>
                  <span className="font-bold">Data:</span>{' '}
                  <span>03/10/2002</span>
                </p>
                <p>
                  <span className="font-bold">Páginas:</span> <span>54</span>
                </p>
              </div>
            </div>
            <div className="flex justify-between py-2 border-b-2 border-b-tertiary">
              <div className="flex flex-col gap-1">
                <p>
                  <span className="font-bold">Capítulo:</span> <span>2</span>
                </p>
                <p>
                  <span className="font-bold">Título:</span>{' '}
                  <span>Conhecendo os colegas</span>
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <p>
                  <span className="font-bold">Data:</span>{' '}
                  <span>10/10/2002</span>
                </p>
                <p>
                  <span className="font-bold">Páginas:</span> <span>54</span>
                </p>
              </div>
            </div>
            <div className="flex justify-between py-2 border-b-2 border-b-tertiary">
              <div className="flex flex-col gap-1">
                <p>
                  <span className="font-bold">Capítulo:</span> <span>3</span>
                </p>
                <p>
                  <span className="font-bold">Título:</span> <span>Time 7</span>
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <p>
                  <span className="font-bold">Data:</span>{' '}
                  <span>17/10/2002</span>
                </p>
                <p>
                  <span className="font-bold">Páginas:</span> <span>54</span>
                </p>
              </div>
            </div>
            <div className="flex justify-between py-2 border-b-2 border-b-tertiary">
              <div className="flex flex-col gap-1">
                <p>
                  <span className="font-bold">Capítulo:</span> <span>4</span>
                </p>
                <p>
                  <span className="font-bold">Título:</span>{' '}
                  <span>Os rivais</span>
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <p>
                  <span className="font-bold">Data:</span>{' '}
                  <span>24/10/2002</span>
                </p>
                <p>
                  <span className="font-bold">Páginas:</span> <span>54</span>
                </p>
              </div>
            </div>
            <div className="flex justify-between py-2 border-b-2 border-b-tertiary">
              <div className="flex flex-col gap-1">
                <p>
                  <span className="font-bold">Capítulo:</span> <span>5</span>
                </p>
                <p>
                  <span className="font-bold">Título:</span>{' '}
                  <span>Exame de Graduação</span>
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <p>
                  <span className="font-bold">Data:</span>{' '}
                  <span>31/10/2002</span>
                </p>
                <p>
                  <span className="font-bold">Páginas:</span> <span>54</span>
                </p>
              </div>
            </div>
            <div className="flex justify-between py-2 border-b-2 border-b-tertiary">
              <div className="flex flex-col gap-1">
                <p>
                  <span className="font-bold">Capítulo:</span> <span>6</span>
                </p>
                <p>
                  <span className="font-bold">Título:</span>{' '}
                  <span>Decisão</span>
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <p>
                  <span className="font-bold">Data:</span>{' '}
                  <span>07/11/2002</span>
                </p>
                <p>
                  <span className="font-bold">Páginas:</span> <span>54</span>
                </p>
              </div>
            </div>
            <div className="flex justify-between py-2 border-b-2 border-b-tertiary">
              <div className="flex flex-col gap-1">
                <p>
                  <span className="font-bold">Capítulo:</span> <span>7</span>
                </p>
                <p>
                  <span className="font-bold">Título:</span>{' '}
                  <span>Os rivais de Konoha</span>
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <p>
                  <span className="font-bold">Data:</span>{' '}
                  <span>14/11/2002</span>
                </p>
                <p>
                  <span className="font-bold">Páginas:</span> <span>54</span>
                </p>
              </div>
            </div>
            <div className="flex justify-between py-2 border-b-2 border-b-tertiary">
              <div className="flex flex-col gap-1">
                <p>
                  <span className="font-bold">Capítulo:</span> <span>8</span>
                </p>
                <p>
                  <span className="font-bold">Título:</span>{' '}
                  <span>Desafio de vida ou morte</span>
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <p>
                  <span className="font-bold">Data:</span>{' '}
                  <span>21/11/2002</span>
                </p>
                <p>
                  <span className="font-bold">Páginas:</span> <span>54</span>
                </p>
              </div>
            </div>
            <div className="flex justify-between py-2 border-b-2 border-b-tertiary">
              <div className="flex flex-col gap-1">
                <p>
                  <span className="font-bold">Capítulo:</span> <span>9</span>
                </p>
                <p>
                  <span className="font-bold">Título:</span>{' '}
                  <span>Kakashi-sensei</span>
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <p>
                  <span className="font-bold">Data:</span>{' '}
                  <span>28/11/2002</span>
                </p>
                <p>
                  <span className="font-bold">Páginas:</span> <span>54</span>
                </p>
              </div>
            </div>
            <div className="flex justify-between py-2 border-b-2 border-b-tertiary">
              <div className="flex flex-col gap-1">
                <p>
                  <span className="font-bold">Capítulo:</span> <span>10</span>
                </p>
                <p>
                  <span className="font-bold">Título:</span>{' '}
                  <span>O exame chunnin</span>
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <p>
                  <span className="font-bold">Data:</span>{' '}
                  <span>05/12/2002</span>
                </p>
                <p>
                  <span className="font-bold">Páginas:</span> <span>54</span>
                </p>
              </div>
            </div>
            <div className="flex justify-between py-2 border-b-2 border-b-tertiary">
              <div className="flex flex-col gap-1">
                <p>
                  <span className="font-bold">Capítulo:</span> <span>11</span>
                </p>
                <p>
                  <span className="font-bold">Título:</span>{' '}
                  <span>Exame Chunnin, começa!</span>
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <p>
                  <span className="font-bold">Data:</span>{' '}
                  <span>12/12/2002</span>
                </p>
                <p>
                  <span className="font-bold">Páginas:</span> <span>54</span>
                </p>
              </div>
            </div>
            <div className="flex justify-between pt-2">
              <div className="flex flex-col gap-1">
                <p>
                  <span className="font-bold">Capítulo:</span> <span>12</span>
                </p>
                <p>
                  <span className="font-bold">Título:</span>{' '}
                  <span>O desafio de Gaara!!</span>
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <p>
                  <span className="font-bold">Data:</span>{' '}
                  <span>19/12/2002</span>
                </p>
                <p>
                  <span className="font-bold">Páginas:</span> <span>54</span>
                </p>
              </div>
            </div>
          </div>
          <div>
            <ul className="flex text-center rounded-sm bg-secondary">
              <li className="p-1 grow">1</li>
              <li className="h-8 border rounded-sm border-primary-default"></li>
              <li className="p-1 grow">2</li>
              <li className="h-8 border rounded-sm border-primary-default"></li>
              <li className="p-1 grow">3</li>
              <li className="h-8 border rounded-sm border-primary-default"></li>
              <li className="p-1 grow">4</li>
              <li className="h-8 border rounded-sm border-primary-default"></li>
              <li className="p-1 grow">5</li>
              <li className="h-8 border rounded-sm border-primary-default"></li>
              <li className="p-1 grow">6</li>
              <li className="h-8 border rounded-sm border-primary-default"></li>
              <li className="p-1 grow">52</li>
            </ul>
          </div>
        </div>
      </Main>
      <Footer />
    </>
  );
};

export default Titles;
