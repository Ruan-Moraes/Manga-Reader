export type Review = {
    id: string;
    titleId: string;
    titleName?: string;
    userId: string;
    userName: string;
    overallRating: number;
    funRating: number;
    artRating: number;
    storylineRating: number;
    charactersRating: number;
    originalityRating: number;
    pacingRating: number;
    comment?: string;
    createdAt: string;
    /** Data da última modificação de conteúdo (ISO) */
    updatedAt?: string;
    /** Resenha foi editada após a criação */
    edited?: boolean;
    /** Título opcional da resenha */
    reviewTitle?: string;
    /** Resenha marcada como Top pela comunidade */
    top?: boolean;
    /** Resenha contém spoilers */
    spoiler?: boolean;
    /** Votos "Útil" recebidos */
    upvotes?: number;
    /** Votos "Contrário" recebidos */
    downvotes?: number;
    /** Voto do usuário autenticado nesta resenha */
    myVote?: 'up' | 'down' | null;
};
