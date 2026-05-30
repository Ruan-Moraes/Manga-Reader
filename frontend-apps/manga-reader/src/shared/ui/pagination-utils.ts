export function paginationRange(page: number, total: number, siblings = 1): Array<number | 'gap'> {
    const totalNumbers = siblings * 2 + 5;
    if (total <= totalNumbers) return Array.from({ length: total }, (_, i) => i + 1);

    const leftSibling = Math.max(page - siblings, 1);
    const rightSibling = Math.min(page + siblings, total);
    const showLeftGap = leftSibling > 2;
    const showRightGap = rightSibling < total - 1;

    const range = (start: number, end: number) => Array.from({ length: end - start + 1 }, (_, i) => start + i);

    if (!showLeftGap && showRightGap) {
        return [...range(1, 3 + siblings * 2), 'gap', total];
    }
    if (showLeftGap && !showRightGap) {
        return [1, 'gap', ...range(total - 2 - siblings * 2, total)];
    }
    return [1, 'gap', ...range(leftSibling, rightSibling), 'gap', total];
}
