import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { Slider } from '../Slider';

describe('Slider', () => {
    it('renders a slider role with the current value', () => {
        render(<Slider label="Espaço" value={8} min={0} max={32} unit="px" onChange={() => {}} />);

        const slider = screen.getByRole('slider', { name: 'Espaço' });
        expect(slider).toHaveAttribute('aria-valuenow', '8');
        expect(slider).toHaveAttribute('aria-valuemin', '0');
        expect(slider).toHaveAttribute('aria-valuemax', '32');
    });

    it('shows the value chip with unit', () => {
        render(<Slider label="Espaço" value={12} min={0} max={32} unit="px" onChange={() => {}} />);
        expect(screen.getByText('12 px')).toBeInTheDocument();
    });

    it('calls onChange with the numeric value', () => {
        const onChange = vi.fn();
        render(<Slider label="Pré-carregar" value={3} min={0} max={10} onChange={onChange} />);

        fireEvent.change(screen.getByRole('slider', { name: 'Pré-carregar' }), { target: { value: '5' } });
        expect(onChange).toHaveBeenCalledWith(5);
    });

    it('can be disabled', () => {
        render(<Slider label="Espaço" value={8} min={0} max={32} disabled onChange={() => {}} />);
        expect(screen.getByRole('slider', { name: 'Espaço' })).toBeDisabled();
    });
});
