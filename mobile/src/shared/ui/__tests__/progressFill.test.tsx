import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';

import { ProgressFill } from '../ProgressFill';

describe('plano de animações, etapa 4: barra de progresso sem layout', () => {
    it.each([
        [0, 0],
        [0.5, 0.5],
        [1, 1],
        [-0.2, 0],
        [1.4, 1],
        [Number.NaN, 0],
    ])('valor %s vira scaleX %s, a partir da borda inicial e com largura cheia', (value, scale) => {
        render(<ProgressFill value={value} color="#123456" testID="fill" />);
        const style = StyleSheet.flatten(screen.getByTestId('fill').props.style);

        expect(style).toEqual(
            expect.objectContaining({ backgroundColor: '#123456', left: 0, right: 0, transform: [{ scaleX: scale }], transformOrigin: 'left' }),
        );
        expect(style.width).toBeUndefined();
    });
});
