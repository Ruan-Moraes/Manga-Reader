export interface ApiResponse<T> {
    data: T;
    success: boolean;
    message: string;
    statusCode: number;
}

export interface PageResponse<T> {
    content: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
}
