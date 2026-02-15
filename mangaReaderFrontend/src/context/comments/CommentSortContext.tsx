import { ReactNode, createContext, useContext, useState } from 'react';

export type SortType = 'likes' | 'dislikes' | 'newest' | 'oldest' | null;

type CommentSortContextType = {
    sortType: SortType;
    setSortType: (sortType: SortType) => void;
};

const CommentSortContext = createContext<CommentSortContextType | undefined>(
    undefined,
);

type CommentSortProviderProps = {
    children: ReactNode;
};

export const CommentSortProvider = ({ children }: CommentSortProviderProps) => {
    const [sortType, setSortType] = useState<SortType>(null);

    return (
        <CommentSortContext.Provider value={{ sortType, setSortType }}>
            {children}
        </CommentSortContext.Provider>
    );
};

export const useCommentSortContext = () => {
    const context = useContext(CommentSortContext);

    if (context === undefined) {
        throw new Error(
            'useCommentSortContext must be used within a CommentSortProvider',
        );
    }

    return context;
};
