import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import AnimatedNumber from '../AnimatedNumber';

describe('AnimatedNumber', () => {
    it('renders localized values when animation is disabled', () => {
        render(
            <span data-testid="value">
                <AnimatedNumber value="+10000" locale="pt-BR" run={false} />
            </span>,
        );
        expect(screen.getByTestId('value')).toHaveTextContent('+10.000');
    });
});
