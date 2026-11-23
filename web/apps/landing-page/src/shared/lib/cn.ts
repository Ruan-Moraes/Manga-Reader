/**
 * Utilitário leve de concatenação condicional de classes (padrão clsx).
 */
export function cn(
    ...classes: (string | boolean | undefined | null)[]
): string {
    return classes.filter(Boolean).join(' ');
}
