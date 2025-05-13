import { createContext, useState, ReactNode } from 'react';

import { UserTypes } from '../../../types/UserTypes';

type UserModalContextProps = {
  isUserModalOpen: boolean;

  openUserModal: () => void;
  closeUserModal: () => void;

  userData: UserTypes | null;
  setUserData: (userData: UserTypes) => void;
};

// MOCK USER DATA
// const mockUserData: UserTypes = {
//   id: '1',
//   name: 'Usuário de alta periculosidade',
//   photo:
//     'https://i.pinimg.com/280x280_RS/48/de/69/48de698ef6a556f7fc5d10b365170951.jpg',
//   bio: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi, nam velit? Nesciunt autem, ut illum maxime atque ullam quo eum quod eius ducimus iure fugiat har.',
//   moderator: {
//     isModerator: true,
//     since: new Date('2023-01-01'),
//   },
//   member: {
//     isMember: true,
//     since: new Date('2022-01-01'),
//   },
//   socialMediasLinks: {
//     instagram: 'https://www.instagram.com/',
//     x: 'https://twitter.com/',
//     facebook: 'https://www.facebook.com/',
//   },
//   statistics: {
//     comments: 1000,
//     likes: 1000,
//     dislikes: 1000,
//   },
//   recommendedTitles: [
//     {
//       image:
//         'https://i.pinimg.com/280x280_RS/48/de/69/48de698ef6a556f7fc5d10b365170951.jpg',
//       link: 'https://www.example.com/title1',
//     },
//     {
//       image:
//         'https://i.pinimg.com/280x280_RS/48/de/69/48de698ef6a556f7fc5d10b365170951.jpg',
//       link: 'https://www.example.com/title2',
//     },
//     {
//       image:
//         'https://i.pinimg.com/280x280_RS/48/de/69/48de698ef6a556f7fc5d10b365170951.jpg',
//       link: 'https://www.example.com/title3',
//     },
//   ],
// };

const UserModalContext = createContext<UserModalContextProps | undefined>(
  undefined
);

const UserModalProvider = ({ children }: { children: ReactNode }) => {
  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);
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
