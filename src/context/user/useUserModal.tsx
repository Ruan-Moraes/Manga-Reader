import { useContext } from 'react';

import { UserModalContext } from './UserModalContext';

export const useUserModal = () => {
  const context = useContext(UserModalContext);

  if (!context) {
    throw new Error(
      'useUserModal deve ser usado dentro de um UserModalProvider'
    );
  }

  return context;
};
