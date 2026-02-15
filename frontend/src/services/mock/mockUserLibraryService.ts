import { ReadingListType, UserSavedLibrary } from '../../types/FavoriteTypes';

const STORAGE_KEY = 'manga-reader:saved-library';

const mockUsersLibrary: UserSavedLibrary[] = [
    {
        userId: 'user-1',
        name: 'Leitor Demo',
        savedMangas: [
            {
                titleId: '1',
                name: 'Reino de Aço',
                cover: 'https://picsum.photos/300/450?random=11',
                type: 'Mangá',
                list: 'Lendo',
                savedAt: '2026-01-10T10:00:00.000Z',
            },
            {
                titleId: '2',
                name: 'Lâmina do Amanhã',
                cover: 'https://picsum.photos/300/450?random=12',
                type: 'Manhwa',
                list: 'Quero Ler',
                savedAt: '2026-01-17T12:00:00.000Z',
            },
            {
                titleId: '3',
                name: 'Flores de Neon',
                cover: 'https://picsum.photos/300/450?random=13',
                type: 'Mangá',
                list: 'Concluído',
                savedAt: '2026-01-20T14:00:00.000Z',
            },
        ],
    },
];

const getLibrary = (): UserSavedLibrary[] => {
    const storage = localStorage.getItem(STORAGE_KEY);

    if (!storage) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUsersLibrary));

        return mockUsersLibrary;
    }

    return JSON.parse(storage) as UserSavedLibrary[];
};

const saveLibrary = (users: UserSavedLibrary[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
};

export const getUserLibrary = (userId: string) => {
    const users = getLibrary();

    return users.find(user => user.userId === userId) ?? null;
};

export const toggleSavedManga = ({
    userId,
    title,
    defaultList = 'Quero Ler',
}: {
    userId: string;
    title: {
        titleId: string;
        name: string;
        cover: string;
        type: string;
    };
    defaultList?: ReadingListType;
}) => {
    const users = getLibrary();

    const userIndex = users.findIndex(user => user.userId === userId);

    if (userIndex === -1) {
        users.push({
            userId,
            name: 'Novo Usuário',
            savedMangas: [
                {
                    ...title,
                    list: defaultList,
                    savedAt: new Date().toISOString(),
                },
            ],
        });

        saveLibrary(users);

        return { isSaved: true };
    }

    const alreadySaved = users[userIndex].savedMangas.some(
        manga => manga.titleId === title.titleId,
    );

    users[userIndex].savedMangas = alreadySaved
        ? users[userIndex].savedMangas.filter(
              manga => manga.titleId !== title.titleId,
          )
        : [
              ...users[userIndex].savedMangas,
              {
                  ...title,
                  list: defaultList,
                  savedAt: new Date().toISOString(),
              },
          ];

    saveLibrary(users);

    return { isSaved: !alreadySaved };
};

export const updateSavedMangaList = ({
    userId,
    titleId,
    list,
}: {
    userId: string;
    titleId: string;
    list: ReadingListType;
}) => {
    const users = getLibrary();
    const user = users.find(item => item.userId === userId);

    if (!user) {
        return;
    }

    user.savedMangas = user.savedMangas.map(manga =>
        manga.titleId === titleId ? { ...manga, list } : manga,
    );

    saveLibrary(users);
};

export const removeSavedManga = (userId: string, titleId: string) => {
    const users = getLibrary();
    const user = users.find(item => item.userId === userId);

    if (!user) {
        return;
    }

    user.savedMangas = user.savedMangas.filter(
        manga => manga.titleId !== titleId,
    );

    saveLibrary(users);
};
