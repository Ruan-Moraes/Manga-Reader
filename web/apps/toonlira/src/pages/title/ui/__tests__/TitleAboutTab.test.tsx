import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';

import { renderWithProviders } from '@/test/helpers/renderWithProviders';
import { buildTitle } from '@/test/factories/titleFactory';

import TitleAboutTab from '../parts/TitleAboutTab';

describe('TitleAboutTab', () => {
    it('renders only the credit rows for roles present in authors', () => {
        const title = buildTitle({
            authors: [
                { authorId: 1, name: 'Kentaro Miura', slug: 'kentaro-miura', role: 'AUTHOR' },
                { authorId: 1, name: 'Kentaro Miura', slug: 'kentaro-miura', role: 'ARTIST' },
            ],
            publishers: [],
        });

        renderWithProviders(<TitleAboutTab title={title} />);

        expect(screen.getByText('Autor:')).toBeInTheDocument();
        expect(screen.getByText('Artista:')).toBeInTheDocument();
        expect(screen.queryByText('Roteirista:')).not.toBeInTheDocument();
        expect(screen.queryByText('Editor:')).not.toBeInTheDocument();
        expect(screen.queryByText('Editora:')).not.toBeInTheDocument();
    });

    it('renders the publisher row when publishers has items', () => {
        const title = buildTitle({
            authors: [],
            publishers: [{ publisherId: 1, name: 'White Fox', slug: 'white-fox' }],
        });

        renderWithProviders(<TitleAboutTab title={title} />);

        expect(screen.getByText('Editora:')).toBeInTheDocument();
        expect(screen.getByText('White Fox')).toBeInTheDocument();
    });

    it('hides the credits section entirely when authors and publishers are both empty', () => {
        const title = buildTitle({ authors: [], publishers: [] });

        renderWithProviders(<TitleAboutTab title={title} />);

        expect(screen.queryByText('Ficha técnica')).not.toBeInTheDocument();
    });
});
