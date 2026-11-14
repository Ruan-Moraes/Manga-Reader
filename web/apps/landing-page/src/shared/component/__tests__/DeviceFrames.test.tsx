import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PhoneFrame } from '../DeviceFrames';

describe('PhoneFrame', () => {
    it('keeps screen and content inside the phone clipping hierarchy', () => {
        render(
            <PhoneFrame label="Prévia do celular">
                <div>Conteúdo do leitor</div>
            </PhoneFrame>,
        );

        const frame = screen.getByRole('img', { name: 'Prévia do celular' });

        expect(frame).toHaveClass('overflow-hidden', 'aspect-[1/2.05]');
        expect(frame.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
        expect(frame).toHaveTextContent('Conteúdo do leitor');
    });
});
