const HIGHLIGHT_MS = 1250;

/**
 * Rola até o comentário pai e o destaca por 1,25s. O alvo do destaque é o card
 * (primeiro filho do wrapper `#comment-<id>`, que é o PostShell) — aplica a classe
 * `.cs-highlight` (ring animado), reiniciando a animação a cada clique.
 */
const useCommentScrollToParent = (parentCommentId: string | null) => {
    const scrollToParent = () => {
        if (!parentCommentId) return;

        const wrapper = document.getElementById(`comment-${parentCommentId}`);
        if (!wrapper) return;

        const card = (wrapper.firstElementChild as HTMLElement | null) ?? wrapper;

        wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });

        card.classList.remove('cs-highlight');
        // Força reflow p/ reiniciar a animação quando clicado em sequência.
        void card.offsetWidth;
        card.classList.add('cs-highlight');

        window.setTimeout(() => card.classList.remove('cs-highlight'), HIGHLIGHT_MS);
    };

    return scrollToParent;
};

export default useCommentScrollToParent;
