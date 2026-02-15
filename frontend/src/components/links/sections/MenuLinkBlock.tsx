import { GrDocumentConfig } from 'react-icons/gr';
import { FiLogOut, FiUser } from 'react-icons/fi';

import { clearCache } from '../../../services/utils/cache.ts';

import CustomLink from '../elements/CustomLink';
import { UserTypes } from '../../../types/UserTypes.ts';

type MenuLinkBlockProps = {
    user: UserTypes | null;
    isLoggedIn: boolean;
    onLogout: () => void;
};

const MenuLinkBlock = ({ user, isLoggedIn, onLogout }: MenuLinkBlockProps) => {
    return (
        <div className="flex flex-col h-full gap-4 px-4 pb-4">
            <div className="flex flex-col gap-2 p-3 border rounded-xs border-tertiary bg-secondary/40">
                {isLoggedIn && user ? (
                    <>
                        <div className="flex items-center gap-2">
                            <img
                                src={user.photo}
                                alt={user.name}
                                className="object-cover w-10 h-10 border rounded-full border-tertiary"
                            />
                            <div>
                                <p className="text-sm text-tertiary">
                                    Conectado como
                                </p>
                                <p className="font-bold">{user.name}</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5 pl-1">
                            <CustomLink
                                link="/profile"
                                text="Meu Perfil"
                                inlineStyle={{ fontWeight: 'normal' }}
                            />
                            <CustomLink
                                link="/library"
                                text="Minha Biblioteca"
                                inlineStyle={{ fontWeight: 'normal' }}
                            />
                            <CustomLink
                                link="/reviews"
                                text="Minhas Avaliações"
                                inlineStyle={{ fontWeight: 'normal' }}
                            />
                            <CustomLink
                                link="/groups"
                                text="Grupos de Tradução"
                                inlineStyle={{ fontWeight: 'normal' }}
                            />
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col gap-1.5">
                        <p className="text-sm text-tertiary">
                            Entre para salvar mangás e avaliar capítulos.
                        </p>
                        <CustomLink link="/login" text="Entrar" />
                        <CustomLink
                            link="/sign-up"
                            text="Criar conta"
                            inlineStyle={{ fontWeight: 'normal' }}
                        />
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-2">
                <h3 className="font-bold">Navegação rápida</h3>
                <div className="flex flex-col gap-1.5 pl-3">
                    <CustomLink
                        link="/categories?tags=Isekai"
                        text="Isekai"
                        inlineStyle={{ fontWeight: 'normal' }}
                    />
                    <CustomLink
                        link="/categories?tags=shounen"
                        text="Shounen"
                        inlineStyle={{ fontWeight: 'normal' }}
                    />
                    <CustomLink
                        link="/news"
                        text="Notícias"
                        inlineStyle={{ fontWeight: 'normal' }}
                    />
                    <CustomLink
                        link="/events"
                        text="Eventos"
                        inlineStyle={{ fontWeight: 'normal' }}
                    />
                </div>
            </div>

            <div className="flex items-center w-full gap-2 mt-auto ml-auto text-center mobile-sm:text-xs mobile-md:text-sm">
                <button
                    onClick={clearCache}
                    className="h-10 px-4 font-bold border rounded-xs border-tertiary bg-secondary grow"
                >
                    Limpar cache
                </button>
                {isLoggedIn ? (
                    <button
                        onClick={onLogout}
                        className="h-10 px-3 border rounded-xs border-tertiary bg-secondary"
                        aria-label="Sair"
                    >
                        <FiLogOut className="text-2xl" />
                    </button>
                ) : (
                    <button
                        className="h-10 px-3 border rounded-xs border-tertiary bg-secondary"
                        aria-label="Configurações"
                    >
                        <GrDocumentConfig className="text-2xl" />
                    </button>
                )}
                <button
                    className="h-10 px-3 border rounded-xs border-tertiary bg-secondary"
                    aria-label="Perfil"
                >
                    <FiUser className="text-2xl" />
                </button>
            </div>
        </div>
    );
};

export default MenuLinkBlock;
