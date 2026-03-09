import { api } from '@shared/service/http';
import type { ApiResponse, PageResponse } from '@shared/service/http';
import { API_URLS } from '@shared/constant/API_URLS';

import { type MangaRating } from '../type/rating.types';

// ---------------------------------------------------------------------------
// Types — espelham os DTOs do backend
// ---------------------------------------------------------------------------

type RatingResponse = {
    id: string;
    titleId: string;
    userName: string;
    stars: number;
    comment?: string;
    categoryRatings?: Record<string, number>;
    createdAt: string;
};

type RatingAverageResponse = {
    average: number;
    count: number;
};

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------

const toMangaRating = (r: RatingResponse): MangaRating => ({
    id: r.id,
    titleId: r.titleId,
    userName: r.userName,
    stars: r.stars,
    comment: r.comment,
    categoryRatings: r.categoryRatings,
    createdAt: r.createdAt,
});

// ---------------------------------------------------------------------------
// Public API — Ratings
// ---------------------------------------------------------------------------

export const getRatingsByTitleId = async (
    titleId: string,
    page = 0,
    size = 20,
): Promise<PageResponse<MangaRating>> => {
    const response = await api.get<ApiResponse<PageResponse<RatingResponse>>>(
        `${API_URLS.RATINGS}/title/${titleId}`,
        { params: { page, size } },
    );

    const pageData = response.data.data;

    return {
        ...pageData,
        content: pageData.content.map(toMangaRating),
    };
};

export const getRatingsAverage = async (
    titleId: string,
): Promise<RatingAverageResponse> => {
    const response = await api.get<ApiResponse<RatingAverageResponse>>(
        `${API_URLS.RATINGS}/title/${titleId}/average`,
    );

    return response.data.data;
};

export const submitRating = async (data: {
    titleId: string;
    stars: number;
    comment?: string;
    categoryRatings?: Record<string, number>;
}): Promise<MangaRating> => {
    const response = await api.post<ApiResponse<RatingResponse>>(
        API_URLS.RATINGS,
        data,
    );

    return toMangaRating(response.data.data);
};

// ---------------------------------------------------------------------------
// Public API — User Reviews
// ---------------------------------------------------------------------------

export const getUserReviews = async (
    page = 0,
    size = 20,
): Promise<PageResponse<MangaRating>> => {
    const response = await api.get<ApiResponse<PageResponse<RatingResponse>>>(
        `${API_URLS.RATINGS}/my-reviews`,
        { params: { page, size } },
    );

    const pageData = response.data.data;

    return {
        ...pageData,
        content: pageData.content.map(toMangaRating),
    };
};

export const updateReview = async (data: {
    id: string;
    stars: number;
    comment?: string;
}): Promise<MangaRating> => {
    const response = await api.put<ApiResponse<RatingResponse>>(
        `${API_URLS.RATINGS}/${data.id}`,
        { stars: data.stars, comment: data.comment },
    );

    return toMangaRating(response.data.data);
};

export const deleteReview = async (id: string): Promise<void> => {
    await api.delete(`${API_URLS.RATINGS}/${id}`);
};
