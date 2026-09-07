export const shareNews = async (title: string, url: string): Promise<'shared' | 'copied'> => {
    if (navigator.share) {
        await navigator.share({ title, url });
        return 'shared';
    }
    await navigator.clipboard.writeText(url);
    return 'copied';
};
