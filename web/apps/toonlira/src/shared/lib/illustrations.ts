/**
 * Resolver central das ilustrações (chibis).
 *
 * Os PNGs vivem em `src/assets/illustrations` e são importados como assets do
 * Vite (URL com hash + prefixo `base` aplicado automaticamente). Isso evita o
 * problema de `publicDir` apontar para a pasta de favicons — os arquivos em
 * `public/` não eram servidos.
 */
const modules = import.meta.glob<string>('../../assets/illustrations/*.png', {
    eager: true,
    import: 'default',
    query: '?url',
});

const byName: Record<string, string> = Object.fromEntries(Object.entries(modules).map(([path, url]) => [path.replace(/^.*\/(.+)\.png$/, '$1'), url]));

export type IllustrationName = 'feliz' | 'triste' | 'surpresa' | 'zangada' | 'pensando' | 'duvida' | '404';

/** URL resolvida da ilustração, ou `undefined` se o nome não existir. */
export const illustrationUrl = (name: IllustrationName): string | undefined => byName[name];
