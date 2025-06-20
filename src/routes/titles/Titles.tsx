import { useParams } from 'react-router-dom';

import Header from '../../layouts/Header';
import Main from '../../layouts/Main';
import Footer from '../../layouts/Footer';

import useTitles from '../../hooks/titles/useTitles';

import Card from '../../components/cards/title/Card';
import CommentInput from '../../components/inputs/CommentInput';
import FilterComments from '../../components/comments/FilterComments';
import CommentsList from '../../components/comments/CommentsList';

import { BsBookmark } from 'react-icons/bs';
import { AiOutlineLike } from 'react-icons/ai';
import { MdGroups, MdOutlineShoppingCart } from 'react-icons/md';
import { FaSortNumericDown } from 'react-icons/fa';
import { IoSearchSharp } from 'react-icons/io5';

const Titles = () => {
    const id = useParams().title!;

    const { titles, isLoading, isError, error } = useTitles(id);

    const currentTitle =
        titles && titles.length > 0
            ? titles.find(title => title.id === id) || titles[Number(id)]
            : undefined;

    const {
        title,
        type,
        cover,
        synopsis,
        genres,
        chapters,
        popularity,
        score,
        author,
        artist,
        publisher,
    } = currentTitle || {};

    return (
        <>
            <Header />
            <Main>
                <section>
                    <Card
                        id={id}
                        type={type}
                        cover={cover}
                        title={title}
                        synopsis={synopsis}
                        genres={genres}
                        chapters={chapters}
                        popularity={popularity}
                        score={score}
                        author={author}
                        artist={artist}
                        publisher={publisher}
                    />

                    {/* TODO:  Transforma a div abaixo em um componente */}
                    <div className="flex items-center justify-between h-full py-2 border rounded-r-xs rounded-bl-xs border-tertiary bg-tertiary">
                        <div className="flex items-center justify-center grow">
                            <BsBookmark className="text-2xl" />
                        </div>
                        <div className="h-8 mx-2 border rounded-xs border-secondary"></div>
                        <div className="flex items-center justify-center grow">
                            <AiOutlineLike className="text-2xl" />
                        </div>
                        <div className="h-8 mx-2 border rounded-xs border-secondary"></div>
                        <div className="flex items-center justify-center grow">
                            <MdGroups className="text-2xl" />
                        </div>
                        <div className="h-8 mx-2 border rounded-xs border-secondary"></div>
                        <div className="flex items-center justify-center grow">
                            <MdOutlineShoppingCart className="text-2xl" />
                        </div>
                    </div>
                </section>
                <section className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <div>
                            <h3 className="text-xl font-bold leading-none text-shadow-default">
                                Capítulos:
                            </h3>
                        </div>
                        <div className="flex items-stretch gap-2">
                            <div>
                                <button className="flex items-center h-full gap-2 p-2 border rounded-xs border-tertiary bg-secondary">
                                    <span className="text-xs font-bold w-max">
                                        Ordenar por:
                                    </span>
                                    <span>
                                        <FaSortNumericDown className="text-lg" />
                                    </span>
                                </button>
                            </div>
                            <div className="flex grow">
                                <div>
                                    <input
                                        type="search"
                                        name=""
                                        id=""
                                        placeholder="Pesquisar Capítulo"
                                        className="w-full h-full p-2 border rounded-r-none appearance-none rounded-xs 1 border-tertiary bg-secondary"
                                    />
                                </div>
                                <div className="flex items-center px-4 py-2 border border-l-0 rounded-r-xs border-tertiary bg-secondary">
                                    <IoSearchSharp size={20} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 text-xs">
                        <div className="flex justify-between px-2 py-2 border rounded-xs border-tertiary">
                            <div className="flex flex-col gap-1">
                                <p>
                                    <span className="font-bold">Capítulo:</span>{' '}
                                    <span>24</span>
                                </p>
                                <p>
                                    <span className="font-bold">Título:</span>{' '}
                                    <span>O legado dos antigos</span>
                                </p>
                            </div>
                            <div className="flex flex-col gap-1">
                                <p>
                                    <span className="font-bold">Data:</span>{' '}
                                    <span>13/03/2003</span>
                                </p>
                                <p>
                                    <span className="font-bold">Páginas:</span>{' '}
                                    <span>54</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-between px-2 py-2 border rounded-xs border-tertiary">
                            <div className="flex flex-col gap-1">
                                <p>
                                    <span className="font-bold">Capítulo:</span>{' '}
                                    <span>23</span>
                                </p>
                                <p>
                                    <span className="font-bold">Título:</span>{' '}
                                    <span>A verdadeira batalha</span>
                                </p>
                            </div>
                            <div className="flex flex-col gap-1">
                                <p>
                                    <span className="font-bold">Data:</span>{' '}
                                    <span>06/03/2003</span>
                                </p>
                                <p>
                                    <span className="font-bold">Páginas:</span>{' '}
                                    <span>54</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-between px-2 py-2 border rounded-xs border-tertiary">
                            <div className="flex flex-col gap-1">
                                <p>
                                    <span className="font-bold">Capítulo:</span>{' '}
                                    <span>22</span>
                                </p>
                                <p>
                                    <span className="font-bold">Título:</span>{' '}
                                    <span>O destino de Konoha</span>
                                </p>
                            </div>
                            <div className="flex flex-col gap-1">
                                <p>
                                    <span className="font-bold">Data:</span>{' '}
                                    <span>27/02/2003</span>
                                </p>
                                <p>
                                    <span className="font-bold">Páginas:</span>{' '}
                                    <span>54</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-between px-2 py-2 border rounded-xs border-tertiary">
                            <div className="flex flex-col gap-1">
                                <p>
                                    <span className="font-bold">Capítulo:</span>{' '}
                                    <span>21</span>
                                </p>
                                <p>
                                    <span className="font-bold">Título:</span>{' '}
                                    <span>O treino final</span>
                                </p>
                            </div>
                            <div className="flex flex-col gap-1">
                                <p>
                                    <span className="font-bold">Data:</span>{' '}
                                    <span>20/02/2003</span>
                                </p>
                                <p>
                                    <span className="font-bold">Páginas:</span>{' '}
                                    <span>54</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-between px-2 py-2 border rounded-xs border-tertiary">
                            <div className="flex flex-col gap-1">
                                <p>
                                    <span className="font-bold">Capítulo:</span>{' '}
                                    <span>20</span>
                                </p>
                                <p>
                                    <span className="font-bold">Título:</span>{' '}
                                    <span>O guardião de Konoha</span>
                                </p>
                            </div>
                            <div className="flex flex-col gap-1">
                                <p>
                                    <span className="font-bold">Data:</span>{' '}
                                    <span>13/02/2003</span>
                                </p>
                                <p>
                                    <span className="font-bold">Páginas:</span>{' '}
                                    <span>54</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-between px-2 py-2 border rounded-xs border-tertiary">
                            <div className="flex flex-col gap-1">
                                <p>
                                    <span className="font-bold">Capítulo:</span>{' '}
                                    <span>19</span>
                                </p>
                                <p>
                                    <span className="font-bold">Título:</span>{' '}
                                    <span>Reencontro inesperado</span>
                                </p>
                            </div>
                            <div className="flex flex-col gap-1">
                                <p>
                                    <span className="font-bold">Data:</span>{' '}
                                    <span>06/02/2003</span>
                                </p>
                                <p>
                                    <span className="font-bold">Páginas:</span>{' '}
                                    <span>54</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-between px-2 py-2 border rounded-xs border-tertiary">
                            <div className="flex flex-col gap-1">
                                <p>
                                    <span className="font-bold">Capítulo:</span>{' '}
                                    <span>18</span>
                                </p>
                                <p>
                                    <span className="font-bold">Título:</span>{' '}
                                    <span>Os segredos de Orochimaru</span>
                                </p>
                            </div>
                            <div className="flex flex-col gap-1">
                                <p>
                                    <span className="font-bold">Data:</span>{' '}
                                    <span>30/01/2003</span>
                                </p>
                                <p>
                                    <span className="font-bold">Páginas:</span>{' '}
                                    <span>54</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-between px-2 py-2 border rounded-xs border-tertiary">
                            <div className="flex flex-col gap-1">
                                <p>
                                    <span className="font-bold">Capítulo:</span>{' '}
                                    <span>17</span>
                                </p>
                                <p>
                                    <span className="font-bold">Título:</span>{' '}
                                    <span>Choque de forças</span>
                                </p>
                            </div>
                            <div className="flex flex-col gap-1">
                                <p>
                                    <span className="font-bold">Data:</span>{' '}
                                    <span>23/01/2003</span>
                                </p>
                                <p>
                                    <span className="font-bold">Páginas:</span>{' '}
                                    <span>54</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-between px-2 py-2 border rounded-xs border-tertiary">
                            <div className="flex flex-col gap-1">
                                <p>
                                    <span className="font-bold">Capítulo:</span>{' '}
                                    <span>16</span>
                                </p>
                                <p>
                                    <span className="font-bold">Título:</span>{' '}
                                    <span>Plano de fuga</span>
                                </p>
                            </div>
                            <div className="flex flex-col gap-1">
                                <p>
                                    <span className="font-bold">Data:</span>{' '}
                                    <span>16/01/2003</span>
                                </p>
                                <p>
                                    <span className="font-bold">Páginas:</span>{' '}
                                    <span>54</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-between px-2 py-2 border rounded-xs border-tertiary">
                            <div className="flex flex-col gap-1">
                                <p>
                                    <span className="font-bold">Capítulo:</span>{' '}
                                    <span>15</span>
                                </p>
                                <p>
                                    <span className="font-bold">Título:</span>{' '}
                                    <span>A decisão de Sasuke</span>
                                </p>
                            </div>
                            <div className="flex flex-col gap-1">
                                <p>
                                    <span className="font-bold">Data:</span>{' '}
                                    <span>09/01/2003</span>
                                </p>
                                <p>
                                    <span className="font-bold">Páginas:</span>{' '}
                                    <span>54</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-between px-2 py-2 border rounded-xs border-tertiary">
                            <div className="flex flex-col gap-1">
                                <p>
                                    <span className="font-bold">Capítulo:</span>{' '}
                                    <span>14</span>
                                </p>
                                <p>
                                    <span className="font-bold">Título:</span>{' '}
                                    <span>O ataque inesperado</span>
                                </p>
                            </div>
                            <div className="flex flex-col gap-1">
                                <p>
                                    <span className="font-bold">Data:</span>{' '}
                                    <span>02/01/2003</span>
                                </p>
                                <p>
                                    <span className="font-bold">Páginas:</span>{' '}
                                    <span>54</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-between px-2 py-2 border rounded-xs border-tertiary">
                            <div className="flex flex-col gap-1">
                                <p>
                                    <span className="font-bold">Capítulo:</span>{' '}
                                    <span>13</span>
                                </p>
                                <p>
                                    <span className="font-bold">Título:</span>{' '}
                                    <span>O despertar do poder</span>
                                </p>
                            </div>
                            <div className="flex flex-col gap-1">
                                <p>
                                    <span className="font-bold">Data:</span>{' '}
                                    <span>26/12/2002</span>
                                </p>
                                <p>
                                    <span className="font-bold">Páginas:</span>{' '}
                                    <span>54</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-between px-2 py-2 border rounded-xs border-tertiary">
                            <div className="flex flex-col gap-1">
                                <p>
                                    <span className="font-bold">Capítulo:</span>{' '}
                                    <span>12</span>
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
                                    <span className="font-bold">Páginas:</span>{' '}
                                    <span>54</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-between px-2 py-2 border rounded-xs border-tertiary">
                            <div className="flex flex-col gap-1">
                                <p>
                                    <span className="font-bold">Capítulo:</span>{' '}
                                    <span>11</span>
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
                                    <span className="font-bold">Páginas:</span>{' '}
                                    <span>54</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-between px-2 py-2 border rounded-xs border-tertiary">
                            <div className="flex flex-col gap-1">
                                <p>
                                    <span className="font-bold">Capítulo:</span>{' '}
                                    <span>10</span>
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
                                    <span className="font-bold">Páginas:</span>{' '}
                                    <span>54</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-between px-2 py-2 border rounded-xs border-tertiary">
                            <div className="flex flex-col gap-1">
                                <p>
                                    <span className="font-bold">Capítulo:</span>{' '}
                                    <span>9</span>
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
                                    <span className="font-bold">Páginas:</span>{' '}
                                    <span>54</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-between px-2 py-2 border rounded-xs border-tertiary">
                            <div className="flex flex-col gap-1">
                                <p>
                                    <span className="font-bold">Capítulo:</span>{' '}
                                    <span>8</span>
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
                                    <span className="font-bold">Páginas:</span>{' '}
                                    <span>54</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-between px-2 py-2 border rounded-xs border-tertiary">
                            <div className="flex flex-col gap-1">
                                <p>
                                    <span className="font-bold">Capítulo:</span>{' '}
                                    <span>7</span>
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
                                    <span className="font-bold">Páginas:</span>{' '}
                                    <span>54</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-between px-2 py-2 border rounded-xs border-tertiary">
                            <div className="flex flex-col gap-1">
                                <p>
                                    <span className="font-bold">Capítulo:</span>{' '}
                                    <span>6</span>
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
                                    <span className="font-bold">Páginas:</span>{' '}
                                    <span>54</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-between px-2 py-2 border rounded-xs border-tertiary">
                            <div className="flex flex-col gap-1">
                                <p>
                                    <span className="font-bold">Capítulo:</span>{' '}
                                    <span>5</span>
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
                                    <span className="font-bold">Páginas:</span>{' '}
                                    <span>54</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-between px-2 py-2 border rounded-xs border-tertiary">
                            <div className="flex flex-col gap-1">
                                <p>
                                    <span className="font-bold">Capítulo:</span>{' '}
                                    <span>4</span>
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
                                    <span className="font-bold">Páginas:</span>{' '}
                                    <span>54</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-between px-2 py-2 border rounded-xs border-tertiary">
                            <div className="flex flex-col gap-1">
                                <p>
                                    <span className="font-bold">Capítulo:</span>{' '}
                                    <span>3</span>
                                </p>
                                <p>
                                    <span className="font-bold">Título:</span>{' '}
                                    <span>Time 7</span>
                                </p>
                            </div>
                            <div className="flex flex-col gap-1">
                                <p>
                                    <span className="font-bold">Data:</span>{' '}
                                    <span>17/10/2002</span>
                                </p>
                                <p>
                                    <span className="font-bold">Páginas:</span>{' '}
                                    <span>54</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-between px-2 py-2 border rounded-xs border-tertiary">
                            <div className="flex flex-col gap-1">
                                <p>
                                    <span className="font-bold">Capítulo:</span>{' '}
                                    <span>2</span>
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
                                    <span className="font-bold">Páginas:</span>{' '}
                                    <span>54</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-between px-2 py-2 border rounded-xs border-tertiary">
                            <div className="flex flex-col gap-1">
                                <p>
                                    <span className="font-bold">Capítulo:</span>{' '}
                                    <span>1</span>
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
                                    <span className="font-bold">Páginas:</span>{' '}
                                    <span>54</span>
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <div>
                            <ul className="flex text-center rounded-xs">
                                <li className="p-1 font-bold border rounded-l-xs border-tertiary grow bg-quaternary-opacity-50 text-shadow-default">
                                    1
                                </li>
                                <li className="p-1 border border-tertiary grow bg-secondary">
                                    2
                                </li>
                                <li className="p-1 border border-tertiary grow bg-secondary">
                                    3
                                </li>
                                <li className="p-1 border border-tertiary grow bg-secondary">
                                    4
                                </li>
                                <li className="p-1 border border-tertiary grow bg-secondary">
                                    5
                                </li>
                                <li className="p-1 border border-tertiary grow bg-secondary">
                                    6
                                </li>
                                <li className="p-1 border rounded-r-xs border-tertiary grow bg-secondary">
                                    32
                                </li>
                            </ul>
                        </div>
                        <div className="text-center">
                            <p className="text-sm">
                                Página <span className="font-bold">1</span> de{' '}
                                <span className="font-bold">32</span>
                            </p>
                        </div>
                    </div>
                </section>
                <section>
                    <div className="flex flex-col gap-8">
                        <div className="flex flex-col gap-2">
                            <div>
                                <h3 className="text-xl font-bold">
                                    Comentários
                                </h3>
                            </div>
                            <div className="flex flex-col gap-4">
                                <CommentInput placeholder="Deixe seu comentário" />
                                <FilterComments title="Filtar comentários por:" />
                            </div>
                        </div>
                        <div className="flex flex-col -mt-4">
                            <CommentsList />
                        </div>
                    </div>
                </section>
            </Main>
            <Footer />
        </>
    );
};

export default Titles;
