import { Animated, Switch, View } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import { ThemeProvider } from '@/src/shared/theme';

import { Button } from '../Button';
import { ChoiceGroup } from '../ChoiceGroup';
import { Input } from '../Input';
import { ListRow } from '../ListRow';
import { Skeleton } from '../Skeleton';
import { SwitchRow } from '../SwitchRow';

function withTheme(node: React.ReactNode) {
    return render(
        <ThemeProvider initialOverride="dark" waitForPlatform={false}>
            {node}
        </ThemeProvider>,
    );
}

describe('shared ui', () => {
    it('bloqueia Button durante loading e substitui seu conteúdo', () => {
        const onPress = jest.fn();
        const { getByRole, queryByText } = withTheme(
            <Button loading onPress={onPress}>
                Salvar
            </Button>,
        );

        expect(queryByText('Salvar')).toBeNull();
        expect(getByRole('button').props.accessibilityState).toMatchObject({ busy: true, disabled: true });
        expect(onPress).not.toHaveBeenCalled();
    });

    it('prioriza a cor de erro do Input e encaminha blur', () => {
        const onBlur = jest.fn();
        const { getByDisplayValue, getByText, UNSAFE_getAllByType } = withTheme(<Input value="texto" onChange={jest.fn()} error="Inválido" onBlur={onBlur} />);
        const input = getByDisplayValue('texto');

        fireEvent(input, 'focus');
        expect(UNSAFE_getAllByType(View).some(view => view.props.style?.borderColor === '#FF8A68')).toBe(true);
        fireEvent(input, 'blur');
        expect(onBlur).toHaveBeenCalledTimes(1);
        expect(getByText('Inválido')).toBeTruthy();
    });

    it('expõe helper, ícones e alvo mínimo no Input editorial', () => {
        const { getByDisplayValue, getByText, getByTestId } = withTheme(
            <Input
                value="texto"
                onChange={jest.fn()}
                label="Nome"
                helperText="Como aparecerá no perfil"
                leading={<View testID="leading" />}
                trailing={<View testID="trailing" />}
            />,
        );

        const input = getByDisplayValue('texto');
        expect(input.parent?.props.style.minHeight).toBeGreaterThanOrEqual(44);
        expect(getByText('Como aparecerá no perfil')).toBeTruthy();
        expect(getByTestId('leading')).toBeTruthy();
        expect(getByTestId('trailing')).toBeTruthy();
    });

    it('mantém seleção, switch e linha navegável semanticamente consistentes', () => {
        const onChoice = jest.fn();
        const onSwitch = jest.fn();
        const onRow = jest.fn();
        const view = withTheme(
            <>
                <ChoiceGroup label="Tema" value="LIGHT" options={['LIGHT', 'DARK'] as const} optionLabel={option => option} onChange={onChoice} />
                <SwitchRow label="Contraste" value={false} onChange={onSwitch} />
                <ListRow title="Aparência" description="Tema e texto" onPress={onRow} />
            </>,
        );

        fireEvent.press(view.getByRole('radio', { name: 'DARK' }));
        fireEvent(view.UNSAFE_getByType(Switch), 'valueChange', true);
        fireEvent.press(view.getByRole('button', { name: 'Aparência' }));

        expect(onChoice).toHaveBeenCalledWith('DARK');
        expect(onSwitch).toHaveBeenCalledWith(true);
        expect(onRow).toHaveBeenCalledTimes(1);
    });

    it.each([
        { animations: false, reduceMotion: false },
        { animations: true, reduceMotion: true },
    ])('não inicia animação decorativa com $animations/$reduceMotion', preferences => {
        const loop = jest.spyOn(Animated, 'loop');

        render(
            <ThemeProvider {...preferences} initialOverride="dark" waitForPlatform={false}>
                <Skeleton />
            </ThemeProvider>,
        );

        expect(loop).not.toHaveBeenCalled();
    });
});
