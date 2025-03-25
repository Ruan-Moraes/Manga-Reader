import { useContext } from 'react';

import { UserModalContext } from './UserModalContext';

export const useUserModalContext = () => {
  const context = useContext(UserModalContext);

  if (!context) {
    throw new Error(
      'useUserModal deve ser usado dentro de um UserModalProvider'
    );
  }

  return context;
};
