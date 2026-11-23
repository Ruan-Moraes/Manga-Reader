import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import MobileApp from '../MobileApp';
import { TestProviders } from '@/test/testUtils';

describe('MobileApp', () => {
    it('renders the section title and feature list', () => {
        render(
            <TestProviders>
                <MobileApp />
            </TestProviders>,
        );

        expect(
            screen.getByText(
                'Leia onde estiver. No iPhone, Android ou navegador.',
            ),
        ).toBeInTheDocument();
        expect(screen.getByText('Leitura offline')).toBeInTheDocument();
    });

    it('renders the store buttons', () => {
        const { container } = render(
            <TestProviders>
                <MobileApp />
            </TestProviders>,
        );

        expect(screen.getByText('App Store')).toBeInTheDocument();
        expect(screen.getByText('Google Play')).toBeInTheDocument();
        expect(container.querySelector('#app')).toBeInTheDocument();
    });
});
