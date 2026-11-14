export type TrendWindow = 'DAY' | 'WEEK' | 'MONTH';
export type TrendRanking = 'SCORE' | 'READS' | 'REVIEWS' | 'LIBRARY_ADDS';

export type TrendMetrics = {
    reads: number;
    libraryAdds: number;
    reviews: number;
    comments: number;
    releases: number;
};

export type TrendGrowth = {
    reads: number;
    libraryAdds: number;
    reviews: number;
    comments: number;
    releases: number;
};

export type TrendingTitle = {
    id: string;
    name: string;
    cover?: string;
    type?: string;
    genres: string[];
    score: number;
    growthPercent: number;
    metrics: TrendMetrics;
    growth: TrendGrowth;
    calculatedAt: string;
};

export type TrendingDashboard = {
    momentum: TrendingTitle[];
    mostRead: TrendingTitle[];
    mostReviewed: TrendingTitle[];
    mostSaved: TrendingTitle[];
};
