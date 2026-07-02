/** Rola suavemente até a seção `id`, compensando a altura do header fixo. */
export function goToSection(id: string) {
    if (id === 'top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    const el = document.getElementById(id);

    if (!el) return;

    const y = el.getBoundingClientRect().top + window.scrollY - 56;

    window.scrollTo({ top: y, behavior: 'smooth' });
}
