import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ReviewCard } from '../ReviewCard';

const baseProps = {
    author: { name: 'Tester' },
    rating: 4.5,
    upvotes: 0,
};

describe('ReviewCard — data do comentário', () => {
    // Regressão: o card cravava time={'2025-01-01T00:00:00.000Z'} hardcoded,
    // ignorando o createdAt. Deve exibir relativo + tooltip absoluto a partir de `when`.
    it('exibe relativo visível e título absoluto, não o ISO cru', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));

        render(
            <ReviewCard {...baseProps} when="2025-06-12T12:00:00Z">
                conteúdo
            </ReviewCard>,
        );

        const time = screen.getByText('há 3 dias');
        expect(time).toBeTruthy();
        expect(time.getAttribute('title')).toMatch(/2025/);

        expect(screen.queryByText('2025-01-01T00:00:00.000Z')).toBeNull();
        expect(screen.queryByText('2025-06-12T12:00:00Z')).toBeNull();

        vi.useRealTimers();
    });
});
