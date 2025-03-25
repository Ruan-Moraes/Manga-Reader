import { createContext, useState, ReactNode } from 'react';

import { UserTypes } from '../../types/UserTypes';

type UserModalContextProps = {
  isUserModalOpen: boolean;

  openUserModal: () => void;
  closeUserModal: () => void;

  userData: UserTypes | null;
  setUserData: (userData: UserTypes) => void;
};

const UserModalContext = createContext<UserModalContextProps | undefined>(
  undefined
);

const UserModalProvider = ({ children }: { children: ReactNode }) => {
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userData, setUserData] = useState<UserTypes | null>(null);

  const openUserModal = () => {
    setIsUserModalOpen(true);
  };

  const closeUserModal = () => {
    setIsUserModalOpen(false);
  };

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
