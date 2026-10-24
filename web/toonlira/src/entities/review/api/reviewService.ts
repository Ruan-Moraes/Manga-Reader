import { api } from '@shared/service/http';
import type { ApiResponse, PageResponse } from '@shared/service/http';
import { API_URLS } from '@shared/constant/API_URLS';

import { type Review } from '../model/review.types';

// ---------------------------------------------------------------------------
// Types — espelham os DTOs do api
// ---------------------------------------------------------------------------

type RatingResponse = {
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
    textContent?: string;
    reviewTitle?: string;
    spoiler?: boolean;
    top?: boolean;
    upvotes?: number;
    downvotes?: number;
    myVote?: 'up' | 'down' | null;
    edited?: boolean;
    createdAt: string;
    updatedAt?: string;
    cover?: string;
    genres?: string[];
    chaptersRead?: number;
};

type RatingAverageResponse = {
    average: number;
    count: number;
};

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------

const toMangaRating = (r: RatingResponse): Review => ({
    id: r.id,
    titleId: r.titleId,
    titleName: r.titleName,
    userId: r.userId,
    userName: r.userName,
    overallRating: r.overallRating,
    funRating: r.funRating,
    artRating: r.artRating,
    storylineRating: r.storylineRating,
    charactersRating: r.charactersRating,
    originalityRating: r.originalityRating,
    pacingRating: r.pacingRating,
    comment: r.textContent,
    reviewTitle: r.reviewTitle,
    spoiler: r.spoiler,
    top: r.top,
    upvotes: r.upvotes,
    downvotes: r.downvotes,
    myVote: r.myVote,
    edited: r.edited,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    cover: r.cover,
    genres: r.genres,
    chaptersRead: r.chaptersRead,
});

// ---------------------------------------------------------------------------
// Public API — Ratings
// ---------------------------------------------------------------------------

export type GetReviewsParams = {
    page?: number;
    size?: number;
    /** Campo de ordenação do backend: createdAt | overallRating | upvotes */
    sort?: string;
    direction?: 'asc' | 'desc';
    /** Filtro por faixa de estrela (1–5) */
    star?: number;
};

export const getRatingsByTitleId = async (
    titleId: string,
    { page = 0, size = 20, sort, direction, star }: GetReviewsParams = {},
): Promise<PageResponse<Review>> => {
    const params: Record<string, string | number> = { page, size };

    if (sort) params.sort = sort;
    if (direction) params.direction = direction;
    if (star != null) params.star = star;

    const response = await api.get<ApiResponse<PageResponse<RatingResponse>>>(`${API_URLS.REVIEWS}/title/${titleId}`, { params });

    const pageData = response.data.data;

    return {
        ...pageData,
        content: pageData.content.map(toMangaRating),
    };
};

export const getRatingsAverage = async (titleId: string): Promise<RatingAverageResponse> => {
    const response = await api.get<ApiResponse<RatingAverageResponse>>(`${API_URLS.REVIEWS}/title/${titleId}/average`);

    return response.data.data;
};

export type RatingDistribution = {
    star1: number;
    star2: number;
    star3: number;
    star4: number;
    star5: number;
    total: number;
};

export const getRatingDistribution = async (titleId: string): Promise<RatingDistribution> => {
    const response = await api.get<ApiResponse<RatingDistribution>>(`${API_URLS.REVIEWS}/title/${titleId}/distribution`);

    return response.data.data;
};

export const submitRating = async (data: {
    titleId: string;
    funRating: number;
    artRating: number;
    storylineRating: number;
    charactersRating: number;
    originalityRating: number;
    pacingRating: number;
    comment?: string;
    reviewTitle?: string;
    spoiler?: boolean;
}): Promise<Review> => {
    // Contrato do backend usa textContent (padrão do comentário unificado);
    // o modelo interno do front mantém `comment` — tradução na borda.
    const { comment, ...rest } = data;
    const response = await api.post<ApiResponse<RatingResponse>>(API_URLS.REVIEWS, { ...rest, textContent: comment });

    return toMangaRating(response.data.data);
};

// ---------------------------------------------------------------------------
// Public API — Review Votes (DT-45)
// ---------------------------------------------------------------------------

export type ReviewVoteResult = {
    upvotes: number;
    downvotes: number;
    myVote?: 'up' | 'down' | null;
};

/** Registra voto Útil/Contrário (toggle no backend). */
export const castReviewVote = async (id: string, value: 'up' | 'down'): Promise<ReviewVoteResult> => {
    const response = await api.post<ApiResponse<ReviewVoteResult>>(`${API_URLS.REVIEWS}/${id}/vote`, { value });

    return response.data.data;
};

/** Remove o voto do usuário na resenha. */
export const removeReviewVote = async (id: string): Promise<ReviewVoteResult> => {
    const response = await api.delete<ApiResponse<ReviewVoteResult>>(`${API_URLS.REVIEWS}/${id}/vote`);

    return response.data.data;
};

// ---------------------------------------------------------------------------
// Public API — User Reviews
// ---------------------------------------------------------------------------

export const getUserReviews = async (page = 0, size = 20): Promise<PageResponse<Review>> => {
    const response = await api.get<ApiResponse<PageResponse<RatingResponse>>>(`${API_URLS.REVIEWS}/user`, { params: { page, size } });

    const pageData = response.data.data;

    return {
        ...pageData,
        content: pageData.content.map(toMangaRating),
    };
};

/** Resenhas públicas de um usuário específico (perfil de terceiros). */
export const getUserReviewsById = async (userId: string, page = 0, size = 20): Promise<PageResponse<Review>> => {
    const response = await api.get<ApiResponse<PageResponse<RatingResponse>>>(`${API_URLS.REVIEWS}/user/${userId}`, { params: { page, size } });

    const pageData = response.data.data;

    return {
        ...pageData,
        content: pageData.content.map(toMangaRating),
    };
};

export const updateReview = async (data: {
    id: string;
    funRating?: number;
    artRating?: number;
    storylineRating?: number;
    charactersRating?: number;
    originalityRating?: number;
    pacingRating?: number;
    comment?: string;
    reviewTitle?: string;
    spoiler?: boolean;
}): Promise<Review> => {
    const { id, comment, ...rest } = data;
    const response = await api.put<ApiResponse<RatingResponse>>(`${API_URLS.REVIEWS}/${id}`, { ...rest, textContent: comment });

    return toMangaRating(response.data.data);
};

export const deleteReview = async (id: string): Promise<void> => {
    await api.delete(`${API_URLS.REVIEWS}/${id}`);
};
