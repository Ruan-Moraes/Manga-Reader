const configuredBase = import.meta.env.VITE_BASE_URL as string | undefined;
const viteBase = import.meta.env.BASE_URL as string | undefined;

// Keep navigation aligned with Vite's configured base. Vite uses `/` in dev
// and `/Manga-Reader/` for the default production build.
export const WEB_BASE_URL = (configuredBase ?? viteBase ?? '/Manga-Reader').replace(/\/$/, '') || '/';

export const withWebBasePath = (path: string) => (WEB_BASE_URL === '/' ? path : `${WEB_BASE_URL}${path}`);
