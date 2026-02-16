import axios from 'axios';
import type { AxiosInstance } from 'axios';

import { registerInterceptors } from './httpInterceptors';
import type { HttpClientConfig } from './httpTypes';

const DEFAULT_TIMEOUT = 30_000; // 30 s

const DEFAULT_HEADERS: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
};

/**
 * Cria uma nova instância Axios com interceptors registrados.
 *
 * Cada chamada retorna uma instância **isolada**, permitindo manter
 * clientes separados para APIs diferentes (ex.: API principal, serviço
 * de upload, gateway de pagamento, etc.).
 *
 * @example
 * ```ts
 * // Cliente para uma segunda API
 * const uploadApi = createHttpClient({
 *     baseURL: import.meta.env.VITE_UPLOAD_API_URL,
 *     timeout: 60_000,
 *     skipAuth: true,
 * });
 * ```
 */
export const createHttpClient = (
    config: HttpClientConfig = {},
): AxiosInstance => {
    const {
        baseURL = import.meta.env.VITE_API_BASE_URL,
        timeout = DEFAULT_TIMEOUT,
        headers = {},
    } = config;

    const instance = axios.create({
        baseURL,
        timeout,
        headers: { ...DEFAULT_HEADERS, ...headers },
    });

    registerInterceptors(instance, config);

    return instance;
};

// ---------------------------------------------------------------------------
// Instância padrão — usada pela maioria dos services
// ---------------------------------------------------------------------------

/**
 * Cliente HTTP padrão do projeto.
 *
 * Usa `VITE_API_BASE_URL` do `.env`, timeout de 30 s, injeta Bearer
 * token automaticamente e exibe toasts de erro.
 *
 * @example
 * ```ts
 * import { api } from '@shared/service/http';
 *
 * const response = await api.get<Title[]>('/titles');
 *
 * console.log(response.data); // ApiResponse<Title[]>
 * ```
 */
export const api: AxiosInstance = createHttpClient();
