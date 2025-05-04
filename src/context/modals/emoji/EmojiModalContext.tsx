import { createContext, useState, ReactNode } from 'react';

type EmojiModalContextProps = {
  isEmojiModalOpen: boolean;

  openEmojiModal: () => void;
  closeEmojiModal: () => void;
};

const EmojiModalContext = createContext<EmojiModalContextProps | undefined>(
  undefined
);

const EmojiModalProvider = ({ children }: { children: ReactNode }) => {
  const [isEmojiModalOpen, setIsEmojiModalOpen] = useState<boolean>(false);

  const openEmojiModal = () => {
    setIsEmojiModalOpen(true);
  };

  const closeEmojiModal = () => {
    setIsEmojiModalOpen(false);
  };

  return (
    <EmojiModalContext.Provider
      value={{
        isEmojiModalOpen,
        openEmojiModal,
        closeEmojiModal,
      }}
    >
      {children}
    </EmojiModalContext.Provider>
  );
};

export { EmojiModalContext, EmojiModalProvider };
