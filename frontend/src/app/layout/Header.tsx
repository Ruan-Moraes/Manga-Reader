import AppLink from '@shared/component/link/element/AppLink';

import clsx from 'clsx';

import MainSearchInput from '@shared/component/input/MainSearchInput';
import NavigationMenu from '@shared/component/menu/NavigationMenu';

import { useAuth } from '@feature/auth';

import { showInfoToast } from '@shared/service/util/toastService';

type HeaderTypes = {
    showAuth?: boolean;
    showSearch?: boolean;
};

const Header = ({ showAuth, showSearch }: HeaderTypes) => {
    const { user, isLoggedIn, logout } = useAuth();

    return (
        <header className={clsx('bg-secondary', {})}>
            {!showAuth && (
                <nav className="flex items-center justify-end gap-3 p-2 border-b-2 border-b-tertiary">
                    {isLoggedIn && user ? (
                        <>
                            <img
                                src={user.photo}
                                alt={user.name}
                                className="object-cover w-8 h-8 border rounded-full border-tertiary"
                            />
                            <AppLink
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
                            <AppLink
                                enabledColorWhenActive={true}
                                link="/sign-up"
                                text="Cadastro"
                            />
                            <span className="font-bold">|</span>
                            <AppLink
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
                        <AppLink
                            className="text-2xl italic"
                            text="Manga Reader"
                        />
                    </h1>
                </div>
                {!showSearch && <MainSearchInput />}
            </nav>
            <NavigationMenu />
        </header>
    );
};

export default Header;
