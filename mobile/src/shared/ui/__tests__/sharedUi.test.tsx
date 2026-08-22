import { Animated, ScrollView, Switch, View } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider } from '@/src/shared/theme';

import { BackButton } from '../BackButton';
import { Button } from '../Button';
import { ChoiceCards } from '../ChoiceCards';
import { ChoiceGroup } from '../ChoiceGroup';
import { FormSection } from '../FormSection';
import { IconButton } from '../IconButton';
import { Input } from '../Input';
import { ListRow } from '../ListRow';
import { NavigationHeader } from '../NavigationHeader';
import { PageContainer } from '../PageContainer';
import { ProgressSteps } from '../ProgressSteps';
import { RangeSlider } from '../RangeSlider';
import { SegmentedControl } from '../SegmentedControl';
import { SelectField } from '../SelectField';
import { Skeleton } from '../Skeleton';
import { StatusMessage } from '../StatusMessage';
import { SwitchRow } from '../SwitchRow';

function withTheme(node: React.ReactNode) {
    return render(
        <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, right: 0, bottom: 34, left: 0 } }}>
            <ThemeProvider initialOverride="dark" waitForPlatform={false}>
                {node}
            </ThemeProvider>
        </SafeAreaProvider>,
    );
}

describe('shared ui', () => {
    it('mantém conteúdo rolável e ajustável acima do teclado e das safe areas', () => {
        const view = withTheme(
            <PageContainer scroll>
                <View testID="content" />
            </PageContainer>,
        );
        const scroll = view.UNSAFE_getByType(ScrollView);
        const safeContent = view.UNSAFE_getAllByType(View).find(node => node.props.style?.paddingTop === 47 && node.props.style?.paddingBottom === 34);

        expect(scroll.props.automaticallyAdjustKeyboardInsets).toBe(true);
        expect(safeContent?.props.style).toEqual(expect.objectContaining({ flexGrow: 1, paddingBottom: 34, paddingTop: 47 }));
    });

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

    it('permite status de apoio sem comprimir o título da linha', () => {
        const view = withTheme(
            <ListRow
                title="Privacidade"
                description="Visibilidade e conteúdo sensível"
                meta="Login necessário"
                metaPlacement="supporting"
                statusTone="warning"
                onPress={jest.fn()}
            />,
        );

        expect(view.getByText('Privacidade')).toBeTruthy();
        expect(view.getByText('Visibilidade e conteúdo sensível')).toBeTruthy();
        expect(view.getByText('Login necessário')).toBeTruthy();
    });

    it('expõe icon button, progresso e status com semântica consistente', () => {
        const retry = jest.fn();
        const close = jest.fn();
        const view = withTheme(
            <>
                <IconButton icon="close" accessibilityLabel="Fechar" onPress={close} />
                <ProgressSteps
                    accessibilityLabel="Progresso"
                    currentIndex={1}
                    steps={[
                        { id: 'one', label: 'Importar' },
                        { id: 'two', label: 'Organizar' },
                    ]}
                />
                <StatusMessage tone="danger" title="Falha" description="Tente novamente" actionLabel="Tentar" onAction={retry} />
            </>,
        );

        fireEvent.press(view.getByRole('button', { name: 'Fechar' }));
        fireEvent.press(view.getByRole('button', { name: 'Tentar' }));
        expect(close).toHaveBeenCalledTimes(1);
        expect(retry).toHaveBeenCalledTimes(1);
        expect(view.getByRole('progressbar').props.accessibilityLabel).toContain('Organizar. 2/2');
        expect(view.getByRole('alert')).toBeOnTheScreen();
    });

    it('mantém retorno e título central independentes da ação direita', () => {
        const onBack = jest.fn();
        const view = withTheme(
            <NavigationHeader
                backLabel="Voltar"
                onBack={onBack}
                title="Título interno longo que pode ocupar mais de uma linha"
                action={<IconButton icon="close" accessibilityLabel="Fechar" />}
            />,
        );

        fireEvent.press(view.getByRole('button', { name: 'Voltar' }));
        expect(onBack).toHaveBeenCalledTimes(1);
        expect(view.getByRole('header').props.style).toEqual(expect.arrayContaining([expect.objectContaining({ maxWidth: '68%', textAlign: 'center' })]));
        expect(view.getByTestId('navigation-header').props.style).toEqual(expect.objectContaining({ position: 'relative' }));
    });

    it('expõe contraste e alvo mínimo no retorno sobre scrim', () => {
        const view = withTheme(<BackButton accessibilityLabel="Voltar" appearance="scrim" tone="inverse" onPress={jest.fn()} />);
        const back = view.getByRole('button', { name: 'Voltar' });

        expect(back.props.style).toEqual(expect.objectContaining({ minHeight: 44, minWidth: 44, backgroundColor: 'rgba(0,0,0,0.72)' }));
        expect(back.props.accessibilityState).toEqual({ disabled: false });
    });

    it('renderiza descrições em opções empilhadas sem perder seleção', () => {
        const view = withTheme(
            <ChoiceGroup
                label="Modo"
                value="VERTICAL"
                options={['VERTICAL', 'PAGED'] as const}
                optionLabel={option => option}
                optionDescription={option => (option === 'VERTICAL' ? 'Fluxo contínuo' : 'Uma página')}
                onChange={jest.fn()}
                layout="stacked"
            />,
        );

        expect(view.getByText('Fluxo contínuo')).toBeOnTheScreen();
        expect(view.getByRole('radio', { name: 'VERTICAL' }).props.accessibilityState.selected).toBe(true);
    });

    it('oferece padrões distintos para escolhas curtas, visuais e extensas', () => {
        const onSegment = jest.fn();
        const onCard = jest.fn();
        const onSelect = jest.fn();
        const view = withTheme(
            <FormSection title="Preferências" description="Controles adequados para cada decisão">
                <SegmentedControl label="Formato" value="AUTO" options={['AUTO', 'SHORT'] as const} optionLabel={option => option} onChange={onSegment} />
                <ChoiceCards label="Tema" value="LIGHT" options={['LIGHT', 'DARK'] as const} optionLabel={option => option} onChange={onCard} />
                <SelectField
                    closeLabel="Fechar seleção"
                    label="Fuso"
                    value="SAO_PAULO"
                    options={['SAO_PAULO', 'UTC'] as const}
                    optionLabel={option => option.replace('_', ' ')}
                    onChange={onSelect}
                />
            </FormSection>,
        );

        fireEvent.press(view.getByRole('radio', { name: 'SHORT' }));
        fireEvent.press(view.getByRole('radio', { name: 'DARK' }));
        fireEvent.press(view.getByRole('button', { name: 'Fuso: SAO PAULO' }));
        fireEvent.press(view.getByRole('radio', { name: 'UTC' }));

        expect(onSegment).toHaveBeenCalledWith('SHORT');
        expect(onCard).toHaveBeenCalledWith('DARK');
        expect(onSelect).toHaveBeenCalledWith('UTC');
        expect(view.getByRole('header', { name: 'Preferências' })).toBeOnTheScreen();
    });

    it('expõe slider como ajustável e respeita o passo nas ações assistivas', () => {
        const onChange = jest.fn();
        const view = withTheme(
            <RangeSlider
                decrementLabel="Diminuir saturação"
                incrementLabel="Aumentar saturação"
                label="Saturação"
                maximum={100}
                minimum={0}
                onChange={onChange}
                step={5}
                value={50}
                valueLabel={value => `${value}%`}
            />,
        );
        const slider = view.getByRole('adjustable', { name: 'Saturação' });

        fireEvent(slider, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });

        expect(slider.props.accessibilityValue).toEqual({ max: 100, min: 0, now: 50, text: '50%' });
        expect(onChange).toHaveBeenCalledWith(55);
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
