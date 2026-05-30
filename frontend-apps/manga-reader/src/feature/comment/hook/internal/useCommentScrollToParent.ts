const HIGHLIGHT_FADE_MS = 2500;
const HIGHLIGHT_CLEANUP_MS = 3000;

const useCommentScrollToParent = (parentCommentId: string | null) => {
    const scrollToParent = () => {
        if (!parentCommentId) return;

        const parentElement = document.getElementById(`comment-${parentCommentId}`);
        if (!parentElement) return;

        const cardElement = parentElement.querySelector<HTMLElement>('.comment-card');
        if (!cardElement) return;

        parentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

        cardElement.style.setProperty('border-color', '#ddda2a', 'important');
        cardElement.style.setProperty('transition', 'border-color 0.5s ease-out');

        setTimeout(() => {
            cardElement.style.setProperty('border-color', '#727273', 'important');
        }, HIGHLIGHT_FADE_MS);

        setTimeout(() => {
            cardElement.style.removeProperty('border-color');
            cardElement.style.removeProperty('transition');
        }, HIGHLIGHT_CLEANUP_MS);
    };

    return scrollToParent;
};

export default useCommentScrollToParent;
