import { createContext, useState, ReactNode } from 'react';

type ConfirmModalContextProps = {
  isConfirmModalOpen: boolean;
  openConfirmModal: () => void;
  closeConfirmModal: () => void;
  //   onConfirm: (() => void) | null;
  //   setOnConfirm: (callback: () => void) => void;
};

const ConfirmModalContext = createContext<ConfirmModalContextProps | undefined>(
  undefined
);

const ConfirmModalProvider = ({ children }: { children: ReactNode }) => {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  //   const [onConfirm, setOnConfirm] = useState<(() => void) | null>(null);

  const openConfirmModal = () => {
    setIsConfirmModalOpen(true);
  };

  const closeConfirmModal = () => {
    setIsConfirmModalOpen(false);
  };

  return (
    <ConfirmModalContext.Provider
      value={{
        isConfirmModalOpen,
        openConfirmModal,
        closeConfirmModal,
        // onConfirm,
        // setOnConfirm,
      }}
    >
      {children}
    </ConfirmModalContext.Provider>
  );
};

export { ConfirmModalContext, ConfirmModalProvider };
