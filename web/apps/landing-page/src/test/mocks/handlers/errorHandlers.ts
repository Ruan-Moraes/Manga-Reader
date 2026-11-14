import { http, HttpResponse } from 'msw';

export const errorHandlers = {
    stats: http.get('*/api/public/stats', () => {
        return HttpResponse.json(
            {
                data: null,
                success: false,
                message: 'Internal error',
                statusCode: 500,
            },
            { status: 500 },
        );
    }),
    plans: http.get('*/api/subscription-plans', () => {
        return HttpResponse.json(
            {
                data: null,
                success: false,
                message: 'Internal error',
                statusCode: 500,
            },
            { status: 500 },
        );
    }),
};
