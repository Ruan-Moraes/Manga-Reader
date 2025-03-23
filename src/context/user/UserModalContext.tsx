import { createContext, useState, ReactNode } from 'react';

type UserModalContextProps = {
  isOpen: boolean;

  openModal: () => void;
  closeModal: () => void;
};

const UserModalContext = createContext<UserModalContextProps | undefined>(
  undefined
);

const UserModalProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => {
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  return (
    <UserModalContext.Provider value={{ isOpen, openModal, closeModal }}>
      {children}
    </UserModalContext.Provider>
  );
};

export { UserModalContext, UserModalProvider };
