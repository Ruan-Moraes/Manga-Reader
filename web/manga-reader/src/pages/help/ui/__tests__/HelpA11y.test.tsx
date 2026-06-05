import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { renderWithProviders } from '@/test/helpers/renderWithProviders';
import { axeComponent } from '@/test/helpers/axe';
import HelpCenter from '../HelpCenter';
import HelpArticle from '../HelpArticle';

describe('Help a11y (axe smoke)', () => {
    it('HelpCenter has no axe violations', async () => {
        const { container } = renderWithProviders(<HelpCenter />);
        expect(await axeComponent(container)).toHaveNoViolations();
    });

    it('HelpArticle has no axe violations', async () => {
        const { container } = render(
            <MemoryRouter initialEntries={['/help/article/1']}>
                <Routes>
                    <Route path="/help/article/:articleId" element={<HelpArticle />} />
                </Routes>
            </MemoryRouter>,
        );
        expect(await axeComponent(container)).toHaveNoViolations();
    });
});
