import { createContext, ReactNode, useCallback, useState } from 'react';

import { type User } from '../type/user.types';

type UserModalContextProps = {
    isUserModalOpen: boolean;

    openUserModal: () => void;
    closeUserModal: () => void;

    userData: User | null;
    setUserData: (userData: User) => void;
};

const UserModalContext = createContext<UserModalContextProps | null>(null);

const UserModalProvider = ({ children }: { children: ReactNode }) => {
    const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);

    const [userData, setUserData] = useState<User | null>(null);

    const openUserModal = useCallback(() => {
        setIsUserModalOpen(true);
    }, []);

    const closeUserModal = useCallback(() => {
        setIsUserModalOpen(false);
    }, []);

    return (
        <UserModalContext.Provider
            value={{
                isUserModalOpen,
                openUserModal,
                closeUserModal,
                userData,
                setUserData,
            }}
        >
            {children}
        </UserModalContext.Provider>
    );
};

export { UserModalContext, UserModalProvider };
