const REQUEST_TIMEOUT_MS = 30_000; // 30 seconds

interface RequestConfig {
    headers?: Record<string, string>;
    timeout?: number;
}

export interface HttpResponse<T> {
    data: T;
    status: number;
    statusText: string;
}

const httpClient = {
    async get<T>(url: string, config?: RequestConfig): Promise<HttpResponse<T>> {
        const controller = new AbortController();
        const timeout = setTimeout(
            () => controller.abort(),
            config?.timeout ?? REQUEST_TIMEOUT_MS,
        );

        try {
            const endpoint = url.startsWith('/') ? `/api${url}` : `/api/${url}`;
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...config?.headers,
                },
                signal: controller.signal,
            });

            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }

            const data = (await response.json()) as T;
            return {
                data,
                status: response.status,
                statusText: response.statusText,
            };
        } finally {
            clearTimeout(timeout);
        }
    },

    async post<T>(
        url: string,
        body?: unknown,
        config?: RequestConfig,
    ): Promise<HttpResponse<T>> {
        const controller = new AbortController();
        const timeout = setTimeout(
            () => controller.abort(),
            config?.timeout ?? REQUEST_TIMEOUT_MS,
        );

        try {
            const endpoint = url.startsWith('/') ? `/api${url}` : `/api/${url}`;
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...config?.headers,
                },
                body: body !== undefined ? JSON.stringify(body) : undefined,
                signal: controller.signal,
            });

            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }

            const data = (await response.json()) as T;
            return {
                data,
                status: response.status,
                statusText: response.statusText,
            };
        } finally {
            clearTimeout(timeout);
        }
    },
};

export default httpClient;
