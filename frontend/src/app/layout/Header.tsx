import CustomLink from '@shared/component/link/element/CustomLink';

import clsx from 'clsx';

import MainSearchInput from '@shared/component/input/MainSearchInput';
import Menu from '@shared/component/menu/Menu';
import { useAuth } from '@feature/auth';
import { showInfoToast } from '@shared/service/util/toastUtils';

type HeaderTypes = {
    disabledAuth?: boolean;
    disabledSearch?: boolean;
};

const Header = ({ disabledAuth, disabledSearch }: HeaderTypes) => {
    const { user, isLoggedIn, logout } = useAuth();

    return (
        <header className={clsx('bg-secondary', {})}>
            {!disabledAuth && (
                <nav className="flex items-center justify-end gap-3 p-2 border-b-2 border-b-tertiary">
                    {isLoggedIn && user ? (
                        <>
                            <img
                                src={user.photo}
                                alt={user.name}
                                className="object-cover w-8 h-8 border rounded-full border-tertiary"
                            />
                            <CustomLink
                                enabledColorWhenActive={true}
                                link="/profile"
                                text={user.name}
                            />
                            <span className="font-bold">|</span>
                            <button
                                onClick={() => {
                                    logout();
                                    showInfoToast('Sessão encerrada.');
                                }}
                                className="font-bold cursor-pointer hover:text-quaternary-default"
                            >
                                Sair
                            </button>
                        </>
                    ) : (
                        <>
                            <CustomLink
                                enabledColorWhenActive={true}
                                link="/sign-up"
                                text="Cadastro"
                            />
                            <span className="font-bold">|</span>
                            <CustomLink
                                enabledColorWhenActive={true}
                                link="/login"
                                text="Login"
                            />
                        </>
                    )}
                </nav>
            )}
            <nav className="flex flex-col items-center justify-center gap-2 p-4 border-b-2 bg-primary-default border-b-tertiary">
                <div>
                    <h1>
                        <CustomLink
                            className="text-2xl italic"
                            text="Manga Reader"
                        />
                    </h1>
                </div>
                {!disabledSearch && <MainSearchInput />}
            </nav>
            <Menu />
        </header>
    );
};

export default Header;
