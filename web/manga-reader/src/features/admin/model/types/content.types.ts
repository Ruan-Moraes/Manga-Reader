export type TopTitle = {
    id: string;
    name: string;
    cover: string | null;
    type: string | null;
    rankingScore: number | null;
    ratingAverage: number | null;
    ratingCount: number | null;
};

export type ContentMetrics = {
    titlesByStatus: Record<string, number>;
    eventsByStatus: Record<string, number>;
    topTitles: TopTitle[];
};
