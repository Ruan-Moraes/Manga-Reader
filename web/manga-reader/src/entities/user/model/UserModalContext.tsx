import { createContext, ReactNode, useCallback, useState } from 'react';

/** Dados mínimos para preencher o cabeçalho instantaneamente enquanto o perfil é buscado. */
export type UserModalSeed = { name: string; photo?: string };

type UserModalContextProps = {
    isUserModalOpen: boolean;
    /** Id do usuário cujo perfil será buscado por id ao abrir. */
    userId: string | null;
    /** Nome/foto já conhecidos (ex.: do comentário/resenha) para render imediato. */
    seed: UserModalSeed | null;

    /** Abre o modal e dispara a busca do perfil completo por id. */
    openUserModalById: (userId: string, seed?: UserModalSeed) => void;
    closeUserModal: () => void;
};

const UserModalContext = createContext<UserModalContextProps | null>(null);

const UserModalProvider = ({ children }: { children: ReactNode }) => {
    const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [seed, setSeed] = useState<UserModalSeed | null>(null);

    const openUserModalById = useCallback((id: string, nextSeed?: UserModalSeed) => {
        setUserId(id);
        setSeed(nextSeed ?? null);
        setIsUserModalOpen(true);
    }, []);

    const closeUserModal = useCallback(() => {
        setIsUserModalOpen(false);
    }, []);

    return (
        <UserModalContext.Provider
            value={{
                isUserModalOpen,
                userId,
                seed,
                openUserModalById,
                closeUserModal,
            }}
        >
            {children}
        </UserModalContext.Provider>
    );
};

export { UserModalContext, UserModalProvider };
