import axios from 'axios';

const REQUEST_TIMEOUT_MS = 30_000;

const httpClient = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json' },
    timeout: REQUEST_TIMEOUT_MS,
});

export default httpClient;
