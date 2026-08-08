import { fireEvent, render } from '@testing-library/react-native';

import { ThemeProvider } from '@/src/shared/theme';

import { Button } from '../Button';
import { Input } from '../Input';

function withTheme(node: React.ReactNode) {
    return render(<ThemeProvider initialOverride="dark">{node}</ThemeProvider>);
}

describe('shared ui', () => {
    it('bloqueia Button durante loading e substitui seu conteúdo', () => {
        const onPress = jest.fn();
        const { queryByText, UNSAFE_getByType } = withTheme(
            <Button loading onPress={onPress}>
                Salvar
            </Button>,
        );

        expect(queryByText('Salvar')).toBeNull();
        expect(UNSAFE_getByType(require('react-native').TouchableOpacity).props.disabled).toBe(true);
        expect(onPress).not.toHaveBeenCalled();
    });

    it('prioriza a cor de erro do Input e encaminha blur', () => {
        const onBlur = jest.fn();
        const { getByDisplayValue, getByText } = withTheme(<Input value="texto" onChange={jest.fn()} error="Inválido" onBlur={onBlur} />);
        const input = getByDisplayValue('texto');

        fireEvent(input, 'focus');
        expect(input.props.style.borderColor).toBe('#FF784F');
        fireEvent(input, 'blur');
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(getByText('Inválido')).toBeTruthy();
    });
});
