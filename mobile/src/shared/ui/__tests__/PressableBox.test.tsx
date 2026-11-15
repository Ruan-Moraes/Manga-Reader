import { StyleSheet, Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { PressableBox } from '../PressableBox';

// No aparelho o NativeWind descarta o `style` em função do Pressable; o PressableBox resolve o estado antes.
describe('MOB-FEAT-057/AC-015 PressableBox', () => {
    it('resolve estilo e filhos em função do estado pressionado como objeto', () => {
        const onPressIn = jest.fn();
        const onPressOut = jest.fn();
        render(
            <PressableBox
                accessibilityRole="button"
                accessibilityLabel="Linha"
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
            >
                {({ pressed }) => <Text>{pressed ? 'pressionado' : 'solto'}</Text>}
            </PressableBox>,
        );
        const button = screen.getByRole('button', { name: 'Linha' });
        expect(StyleSheet.flatten(button.props.style).opacity).toBe(1);
        expect(screen.getByText('solto')).toBeOnTheScreen();

        fireEvent(button, 'pressIn');
        expect(StyleSheet.flatten(screen.getByRole('button', { name: 'Linha' }).props.style).opacity).toBe(0.5);
        expect(screen.getByText('pressionado')).toBeOnTheScreen();
        expect(onPressIn).toHaveBeenCalledTimes(1);

        fireEvent(button, 'pressOut');
        expect(screen.getByText('solto')).toBeOnTheScreen();
        expect(onPressOut).toHaveBeenCalledTimes(1);
    });

    it('aceita estilo estático', () => {
        render(<PressableBox accessibilityRole="button" accessibilityLabel="Fixo" style={{ opacity: 0.7 }} />);
        expect(StyleSheet.flatten(screen.getByRole('button', { name: 'Fixo' }).props.style).opacity).toBe(0.7);
    });
});
