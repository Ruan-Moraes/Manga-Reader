import { useContext } from 'react';
import { ConfirmModalContext } from './ConfirmModalContext';

export const useConfirmModalContext = () => {
  const context = useContext(ConfirmModalContext);

  if (!context) {
    throw new Error(
      'useConfirmModalContext deve ser usado dentro de um ConfirmModalProvider'
    );
  }

  return context;
};
