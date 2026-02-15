import { createContext, ReactNode, useCallback, useState } from 'react';

import { User } from '../type/user.types';

type UserModalContextProps = {
    isUserModalOpen: boolean;

    openUserModal: () => void;
    closeUserModal: () => void;

    userData: User | null;
    setUserData: (userData: User) => void;
};

// MOCK USER DATA
// const mockUserData: User = {
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
