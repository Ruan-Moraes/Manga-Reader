import { AccessibilityInfo, Animated, Modal, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { act, fireEvent, render, within } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider } from '@/shared/theme';

import { BackButton } from '../BackButton';
import { Button } from '../Button';
import { ChoiceCards, resolveChoiceCardsStacked } from '../ChoiceCards';
import { ChoiceGroup, resolveChoiceGroupStacked } from '../ChoiceGroup';
import { FormSection } from '../FormSection';
import { IconButton } from '../IconButton';
import { Input } from '../Input';
import { ListRow } from '../ListRow';
import { NavigationHeader } from '../NavigationHeader';
import { PageContainer } from '../PageContainer';
import { ProgressSteps } from '../ProgressSteps';
import { RANGE_SLIDER_THUMB_RADIUS, RANGE_SLIDER_THUMB_SIZE, RangeSlider, resolveRangeSliderThumbPosition, resolveRangeSliderValue } from '../RangeSlider';
import { resolveSegmentedControlStacked, SegmentedControl } from '../SegmentedControl';
import { resolveSelectSheetHeight, SelectField } from '../SelectField';
import { Skeleton } from '../Skeleton';
import { StatusMessage } from '../StatusMessage';
import { SwatchPicker } from '../SwatchPicker';
import { resolveSwitchRowStacked, SwitchRow } from '../SwitchRow';

jest.mock('react-native-worklets', () => ({
    scheduleOnRN: (callback: (...args: unknown[]) => void, ...args: unknown[]) => callback(...args),
}));

jest.mock('react-native-reanimated', () => {
    const React = jest.requireActual('react');
    const ReactNative = jest.requireActual('react-native');
    const mockAnimatedView = React.forwardRef((mockProps: Record<string, unknown>, mockRef: unknown) =>
        React.createElement(ReactNative.View, { ...mockProps, ref: mockRef }),
    );

    return {
        __esModule: true,
        default: { View: mockAnimatedView },
        useAnimatedStyle: (mockFactory: () => Record<string, unknown>) => {
            const mockStyle: Record<string, unknown> = {};
            Object.keys(mockFactory()).forEach(mockKey => {
                Object.defineProperty(mockStyle, mockKey, { enumerable: true, get: () => mockFactory()[mockKey] });
            });
            return mockStyle;
        },
        useSharedValue: (initialValue: unknown) => React.useRef({ value: initialValue }).current,
    };
});

jest.mock('react-native-gesture-handler', () => {
    type MockGestureEvent = { nativeEvent?: MockGestureEvent; success?: boolean; translationX?: number; x?: number };
    type MockGestureCallback = (...args: unknown[]) => unknown;
    type MockGesture = {
        callbacks: Record<string, MockGestureCallback>;
        kind: 'pan' | 'tap';
        activeOffsetX: (value: number[]) => MockGesture;
        averageTouches: (value: boolean) => MockGesture;
        enabled: (value: boolean) => MockGesture;
        failOffsetY: (value: number[]) => MockGesture;
        maxDistance: (value: number) => MockGesture;
        maxPointers: (value: number) => MockGesture;
        onBegin: (callback: MockGestureCallback) => MockGesture;
        onEnd: (callback: MockGestureCallback) => MockGesture;
        onFinalize: (callback: MockGestureCallback) => MockGesture;
        onStart: (callback: MockGestureCallback) => MockGesture;
        onUpdate: (callback: MockGestureCallback) => MockGesture;
        shouldCancelWhenOutside: (value: boolean) => MockGesture;
        withTestId: (value: string) => MockGesture;
    };
    const React = jest.requireActual('react');
    const createGesture = (kind: MockGesture['kind']): MockGesture => {
        const callbacks: Record<string, MockGestureCallback> = {};
        const gesture: MockGesture = {
            callbacks,
            kind,
            activeOffsetX: () => gesture,
            averageTouches: () => gesture,
            enabled: () => gesture,
            failOffsetY: () => gesture,
            maxDistance: () => gesture,
            maxPointers: () => gesture,
            onBegin: callback => {
                callbacks.begin = callback;
                return gesture;
            },
            onEnd: callback => {
                callbacks.end = callback;
                return gesture;
            },
            onFinalize: callback => {
                callbacks.finalize = callback;
                return gesture;
            },
            onStart: callback => {
                callbacks.start = callback;
                return gesture;
            },
            onUpdate: callback => {
                callbacks.update = callback;
                return gesture;
            },
            shouldCancelWhenOutside: () => gesture,
            withTestId: () => gesture,
        };
        return gesture;
    };
    const getEvent = (event: unknown): MockGestureEvent => {
        if (typeof event !== 'object' || event === null) return {};
        const gestureEvent = event as MockGestureEvent;
        return gestureEvent.nativeEvent ?? gestureEvent;
    };
    const getSuccess = (event: unknown) => {
        const gestureEvent = getEvent(event);
        return gestureEvent.success ?? true;
    };

    return {
        Gesture: {
            Pan: () => createGesture('pan'),
            Race: (...gestures: MockGesture[]) => ({ gestures }),
            Tap: () => createGesture('tap'),
        },
        GestureDetector: ({ children, gesture }: { children: unknown; gesture: MockGesture | { gestures: MockGesture[] } }) => {
            const gestures = 'gestures' in gesture ? gesture.gestures : [gesture];
            const pan = gestures.find(candidate => candidate.kind === 'pan');
            const tap = gestures.find(candidate => candidate.kind === 'tap');
            return React.cloneElement(children, {
                onRangeSliderPanBegin: (event: unknown) => pan?.callbacks.begin?.(getEvent(event)),
                onRangeSliderPanEnd: (event: unknown) => pan?.callbacks.end?.(getEvent(event), getSuccess(event)),
                onRangeSliderPanFinalize: (event: unknown) => pan?.callbacks.finalize?.(getEvent(event), getSuccess(event)),
                onRangeSliderPanStart: (event: unknown) => pan?.callbacks.start?.(getEvent(event)),
                onRangeSliderPanUpdate: (event: unknown) => pan?.callbacks.update?.(getEvent(event)),
                onRangeSliderTapEnd: (event: unknown) => tap?.callbacks.end?.(getEvent(event), getSuccess(event)),
            });
        },
    };
});

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
        const safeFrame = view.getByTestId('page-container-safe-frame');
        const scrollContent = view.getByTestId('page-container-scroll-content');

        expect(scroll.props.automaticallyAdjustKeyboardInsets).toBe(true);
        expect(StyleSheet.flatten(safeFrame.props.style)).toEqual(expect.objectContaining({ flex: 1, paddingBottom: 34, paddingTop: 47 }));
        expect(StyleSheet.flatten(scrollContent.props.style)).toEqual(expect.objectContaining({ flexGrow: 1, paddingBottom: 0, paddingTop: 0 }));
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

    it('não anuncia linhas informativas como controles desabilitados', () => {
        const view = withTheme(<ListRow title="Versão" description="2.4.0" />);
        const row = view.getByLabelText('Versão');

        expect(view.queryByRole('button', { name: 'Versão' })).toBeNull();
        expect(row.props.accessibilityState?.disabled).not.toBe(true);
    });

    it('oferece amostras visuais acessíveis para escolhas de cor', () => {
        const onChange = jest.fn();
        const view = withTheme(
            <SwatchPicker
                label="Fundo"
                value="SEPIA"
                options={['WHITE', 'SEPIA', 'BLACK'] as const}
                optionLabel={option => option}
                optionColor={option => ({ WHITE: '#FFFFFF', SEPIA: '#E6D2A6', BLACK: '#000000' })[option]}
                onChange={onChange}
            />,
        );

        expect(view.getByRole('radio', { name: 'SEPIA' }).props.accessibilityState.selected).toBe(true);
        expect(view.getByRole('radio', { name: 'WHITE' })).toBeOnTheScreen();
        expect(view.getByRole('radio', { name: 'BLACK' })).toBeOnTheScreen();
        fireEvent(view.getByTestId('swatch-picker-track'), 'layout', { nativeEvent: { layout: { width: 302 } } });
        expect(StyleSheet.flatten(view.getByTestId('swatch-picker-surface-SEPIA').props.style)).toEqual(
            expect.objectContaining({ backgroundColor: '#E6D2A6', width: 100 }),
        );
        expect(['WHITE', 'SEPIA', 'BLACK'].map(option => StyleSheet.flatten(view.getByTestId(`swatch-picker-surface-${option}`).props.style).width)).toEqual([
            100, 100, 100,
        ]);
        expect(StyleSheet.flatten(view.getByTestId('swatch-picker-group').props.style)).toEqual(expect.objectContaining({ alignSelf: 'stretch' }));
        fireEvent.press(view.getByRole('radio', { name: 'BLACK' }));
        expect(onChange).toHaveBeenCalledWith('BLACK');
    });

    it('mantém a última escolha otimista enquanto atualizações controladas anteriores chegam', () => {
        const onChange = jest.fn();
        const options = ['WHITE', 'SEPIA', 'BLACK'] as const;
        const picker = (value: (typeof options)[number]) => (
            <SwatchPicker
                label="Fundo"
                value={value}
                options={options}
                optionLabel={option => option}
                optionColor={option => ({ WHITE: '#FFFFFF', SEPIA: '#E6D2A6', BLACK: '#000000' })[option]}
                onChange={onChange}
            />
        );
        const themedPicker = (value: (typeof options)[number]) => (
            <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, right: 0, bottom: 34, left: 0 } }}>
                <ThemeProvider initialOverride="dark" waitForPlatform={false}>
                    {picker(value)}
                </ThemeProvider>
            </SafeAreaProvider>
        );
        const view = render(themedPicker('SEPIA'));

        fireEvent.press(view.getByRole('radio', { name: 'WHITE' }));
        fireEvent.press(view.getByRole('radio', { name: 'BLACK' }));
        view.rerender(themedPicker('WHITE'));

        expect(view.getByRole('radio', { name: 'BLACK' }).props.accessibilityState.selected).toBe(true);

        view.rerender(themedPicker('BLACK'));

        expect(view.getByRole('radio', { name: 'BLACK' }).props.accessibilityState.selected).toBe(true);
        expect(onChange).toHaveBeenNthCalledWith(1, 'WHITE');
        expect(onChange).toHaveBeenNthCalledWith(2, 'BLACK');
    });

    it('mantém título e descrição ao lado do preview no card de escolha', () => {
        const view = withTheme(
            <ChoiceCards
                label="Tema"
                value="SYSTEM"
                options={['SYSTEM'] as const}
                optionLabel={() => 'Seguir o sistema'}
                optionDescription={() => 'Acompanha a aparência do aparelho'}
                optionPreview={() => <View testID="theme-preview" />}
                onChange={jest.fn()}
                layout="stacked"
            />,
        );

        const copy = view.getByTestId('choice-card-copy-SYSTEM');
        const indicator = view.UNSAFE_getByProps({ testID: 'choice-card-indicator-SYSTEM' });
        const row = view.getByTestId('choice-card-row-SYSTEM');
        expect(within(copy).getByText('Seguir o sistema')).toBeOnTheScreen();
        expect(within(copy).getByText('Acompanha a aparência do aparelho')).toBeOnTheScreen();
        expect(within(row).getByTestId('theme-preview')).toBeOnTheScreen();
        expect(within(row).getByTestId('choice-card-copy-SYSTEM')).toBeOnTheScreen();
        expect(StyleSheet.flatten(row.props.style)).toEqual(expect.objectContaining({ alignItems: 'center', flexDirection: 'row' }));
        expect(StyleSheet.flatten(indicator.props.style)).toEqual(expect.objectContaining({ flexShrink: 0, height: 24, width: 24 }));
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
                        { id: 'three', label: 'Revisar' },
                    ]}
                />
                <StatusMessage tone="danger" title="Falha" description="Tente novamente" actionLabel="Tentar" onAction={retry} />
            </>,
        );

        fireEvent.press(view.getByRole('button', { name: 'Fechar' }));
        fireEvent.press(view.getByRole('button', { name: 'Tentar' }));
        expect(close).toHaveBeenCalledTimes(1);
        expect(retry).toHaveBeenCalledTimes(1);
        expect(view.getByRole('progressbar').props.accessibilityLabel).toContain('Organizar. 2/3');
        expect(view.getByRole('progressbar').props.style).toEqual(expect.objectContaining({ alignItems: 'center' }));
        const currentLabel = view.getByText('Organizar');
        expect(currentLabel.props.numberOfLines).toBeUndefined();
        expect(currentLabel.props.ellipsizeMode).toBeUndefined();
        expect(StyleSheet.flatten(currentLabel.props.style)).toEqual(expect.objectContaining({ textAlign: 'center', width: 84 }));
        expect(view.getByRole('alert')).toBeOnTheScreen();
    });

    it('mantém as legendas completas e centralizadas nos marcadores', () => {
        const steps = [
            { id: 'import', label: 'Importar' },
            { id: 'organize', label: 'Organizar' },
            { id: 'languages', label: 'Idiomas' },
            { id: 'validate', label: 'Validar' },
            { id: 'review', label: 'Revisar' },
        ] as const;
        const middleView = withTheme(<ProgressSteps accessibilityLabel="Progresso" currentIndex={2} steps={steps} />);

        expect(middleView.getByText('Idiomas')).toBeOnTheScreen();
        expect(StyleSheet.flatten(middleView.getByText('Idiomas').props.style)).toEqual(expect.objectContaining({ textAlign: 'center' }));

        const firstView = withTheme(<ProgressSteps accessibilityLabel="Progresso" currentIndex={0} steps={steps} />);
        expect(firstView.getByText('Importar')).toBeOnTheScreen();
        expect(StyleSheet.flatten(firstView.getByText('Importar').props.style)).toEqual(expect.objectContaining({ textAlign: 'center' }));

        const lastView = withTheme(<ProgressSteps accessibilityLabel="Progresso" currentIndex={4} steps={steps} />);
        expect(lastView.getByText('Revisar')).toBeOnTheScreen();
        expect(StyleSheet.flatten(lastView.getByText('Revisar').props.style)).toEqual(expect.objectContaining({ textAlign: 'center' }));
        expect(lastView.getByRole('progressbar').props.accessibilityLabel).toContain('Revisar. 5/5');
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
        expect(StyleSheet.flatten(view.getByTestId('choice-group-row-VERTICAL').props.style)).toEqual(
            expect.objectContaining({ alignItems: 'center', borderWidth: 2, flexDirection: 'row' }),
        );
        expect(StyleSheet.flatten(view.UNSAFE_getByProps({ testID: 'choice-group-indicator-VERTICAL' }).props.style)).toEqual(
            expect.objectContaining({ flexShrink: 0, height: 24, width: 24 }),
        );
        expect(StyleSheet.flatten(view.getByTestId('choice-group-copy-VERTICAL').props.style)).toEqual(expect.objectContaining({ flexShrink: 1, minWidth: 0 }));
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

    it('torna seleção e foco visíveis sem depender apenas de cor', () => {
        const view = withTheme(
            <>
                <SegmentedControl label="Formato" value="AUTO" options={['AUTO', 'SHORT'] as const} optionLabel={option => option} onChange={jest.fn()} />
                <ChoiceCards label="Tema" value="LIGHT" options={['LIGHT', 'DARK'] as const} optionLabel={option => option} onChange={jest.fn()} />
                <SelectField
                    closeLabel="Fechar seleção"
                    label="Fuso"
                    value="UTC"
                    options={['UTC', 'LOCAL'] as const}
                    optionLabel={option => option}
                    onChange={jest.fn()}
                />
            </>,
        );
        const segment = view.getByRole('radio', { name: 'AUTO' });
        const card = view.getByRole('radio', { name: 'DARK' });
        const select = view.getByRole('button', { name: 'Fuso: UTC' });

        expect(segment.props.accessibilityState.selected).toBe(true);
        fireEvent(segment, 'focus');
        fireEvent(card, 'focus');
        fireEvent(select, 'focus');

        expect(segment.findByType(View).props.style).toEqual(
            expect.objectContaining({ backgroundColor: '#E6E037', borderColor: expect.not.stringMatching(/^transparent$/), borderWidth: 2 }),
        );
        expect(card.findByType(View).props.style).toEqual(expect.objectContaining({ borderColor: expect.not.stringMatching(/^transparent$/), borderWidth: 2 }));
        expect(select.props.style).toEqual(expect.objectContaining({ borderColor: expect.not.stringMatching(/^transparent$/), borderWidth: 2 }));
    });

    it('mantém borda e alinhamento dos rádios estáveis ao alternar seleção', () => {
        const view = withTheme(
            <>
                <ChoiceCards label="Tema" value="LIGHT" options={['LIGHT', 'DARK'] as const} optionLabel={option => option} onChange={jest.fn()} />
                <ChoiceGroup
                    label="Idioma"
                    value="PT"
                    options={['PT', 'EN'] as const}
                    optionLabel={option => option}
                    optionDescription={option => `Descrição ${option}`}
                    onChange={jest.fn()}
                    layout="stacked"
                />
                <SegmentedControl label="Formato" value="AUTO" options={['AUTO', 'FIXED'] as const} optionLabel={option => option} onChange={jest.fn()} />
                <SelectField
                    closeLabel="Fechar seleção"
                    label="Qualidade"
                    value="AUTO"
                    options={['AUTO', 'ORIGINAL'] as const}
                    optionLabel={option => option}
                    optionDescription={option => `Descrição ${option}`}
                    onChange={jest.fn()}
                />
            </>,
        );

        expect(['LIGHT', 'DARK'].map(option => StyleSheet.flatten(view.getByTestId(`choice-card-surface-${option}`).props.style).borderWidth)).toEqual([2, 2]);
        expect(['PT', 'EN'].map(option => StyleSheet.flatten(view.getByTestId(`choice-group-row-${option}`).props.style).borderWidth)).toEqual([2, 2]);
        expect(StyleSheet.flatten(view.getByTestId('choice-group-row-PT').props.style).alignItems).toBe('center');
        expect(['AUTO', 'FIXED'].map(option => StyleSheet.flatten(view.getByTestId(`segmented-option-surface-${option}`).props.style).borderWidth)).toEqual([
            2, 2,
        ]);

        fireEvent.press(view.getByRole('button', { name: 'Qualidade: AUTO' }));

        expect(
            ['AUTO', 'ORIGINAL'].map(option => StyleSheet.flatten(view.getByTestId(`select-field-option-surface-${option}`).props.style).borderWidth),
        ).toEqual([2, 2]);
        expect(StyleSheet.flatten(view.getByTestId('select-field-option-row-AUTO').props.style).alignItems).toBe('center');
        expect(StyleSheet.flatten(view.getByTestId('select-field-option-indicator-AUTO').props.style).flexShrink).toBe(0);
        expect(StyleSheet.flatten(view.getByTestId('select-field-option-copy-AUTO').props.style)).toEqual(expect.objectContaining({ flex: 1, minWidth: 0 }));
    });

    it('apresenta SelectField com affordance clara e folha inferior multiplataforma', () => {
        const onChange = jest.fn();
        const view = withTheme(
            <SelectField
                closeLabel="Fechar seleção"
                description="Define a qualidade das páginas"
                label="Qualidade"
                value="AUTO"
                options={['AUTO', 'ORIGINAL'] as const}
                optionLabel={option => (option === 'AUTO' ? 'Automática' : 'Original')}
                optionDescription={option => (option === 'AUTO' ? 'Equilibra nitidez e dados' : 'Preserva o arquivo')}
                onChange={onChange}
            />,
        );
        const trigger = view.getByTestId('select-field-trigger');

        expect(trigger.props.style).toEqual(expect.objectContaining({ minHeight: 64, backgroundColor: '#1B1B18', borderColor: '#3A3932' }));
        expect(view.getByTestId('select-field-leading-icon')).toBeOnTheScreen();
        expect(StyleSheet.flatten(view.getByTestId('select-field-trigger-content').props.style)).toEqual(
            expect.objectContaining({ alignItems: 'center', flexDirection: 'row', minWidth: 0, width: '100%' }),
        );
        expect(StyleSheet.flatten(view.getByTestId('select-field-expand-affordance').props.style)).toEqual(
            expect.objectContaining({ borderWidth: 1, height: 40, width: 40 }),
        );
        fireEvent.press(trigger);

        const modal = view.UNSAFE_getByType(Modal);
        expect(modal.props).toEqual(
            expect.objectContaining({
                animationType: 'slide',
                navigationBarTranslucent: true,
                presentationStyle: 'overFullScreen',
                statusBarTranslucent: true,
            }),
        );
        const sheetStyle = StyleSheet.flatten(view.getByTestId('select-field-sheet').props.style);
        expect(sheetStyle).toEqual(
            expect.objectContaining({ bottom: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, left: 0, right: 0 }),
        );
        expect(sheetStyle.height).toBeGreaterThan(0);
        expect(view.getByTestId('select-field-sheet-handle')).toBeOnTheScreen();
        expect(view.getByRole('header', { name: 'Qualidade' })).toBeOnTheScreen();
        expect(view.getByText('Equilibra nitidez e dados')).toBeOnTheScreen();
        expect(view.getByRole('radio', { name: 'Automática' }).props.accessibilityState.selected).toBe(true);
        expect(StyleSheet.flatten(view.getByTestId('select-field-options-group').props.style)).toEqual(
            expect.objectContaining({ borderRadius: 16, borderWidth: 1, gap: 8, padding: 4 }),
        );
        expect(StyleSheet.flatten(view.getByTestId('select-field-option-surface-AUTO').props.style)).toEqual(
            expect.objectContaining({ borderWidth: 2, paddingHorizontal: 16, paddingVertical: 16 }),
        );
        expect(StyleSheet.flatten(view.getByTestId('select-field-option-surface-ORIGINAL').props.style)).toEqual(
            expect.objectContaining({ borderColor: 'transparent', paddingHorizontal: 16, paddingVertical: 16 }),
        );
        expect(StyleSheet.flatten(view.getByTestId('select-field-option-indicator-AUTO').props.style)).toEqual(
            expect.objectContaining({ flexShrink: 0, height: 28, width: 28 }),
        );
        expect(view.getByTestId('select-field-option-indicator-AUTO').props.children).toBeTruthy();
        expect(view.getByTestId('select-field-option-indicator-ORIGINAL').props.children).toBeNull();
        expect(view.queryByTestId('select-field-option-divider-AUTO')).toBeNull();
        expect(view.queryByTestId('select-field-option-divider-ORIGINAL')).toBeNull();

        fireEvent.press(view.getByTestId('select-field-backdrop'));
        expect(onChange).not.toHaveBeenCalled();

        fireEvent.press(trigger);
        fireEvent(view.getByTestId('select-field-sheet-layer'), 'accessibilityEscape');
        expect(onChange).not.toHaveBeenCalled();

        fireEvent.press(trigger);
        act(() => modal.props.onRequestClose());
        expect(onChange).not.toHaveBeenCalled();
    });

    it('oferece variante input sem blocos de ícones, com foco e folha existentes', () => {
        const onChange = jest.fn();
        const view = withTheme(
            <SelectField
                variant="input"
                closeLabel="Fechar seleção"
                label="Idioma"
                value="ja"
                options={['ja', 'pt-BR'] as const}
                optionLabel={option => option}
                onChange={onChange}
            />,
        );
        const trigger = view.getByRole('button', { name: 'Idioma: ja' });
        const surface = view.getByTestId('select-field-trigger-content');
        expect(surface.props.style).toEqual(
            expect.objectContaining({ minHeight: 52, borderRadius: 12, paddingHorizontal: 16, backgroundColor: '#1B1B18', borderWidth: 1 }),
        );
        expect(view.queryByTestId('select-field-leading-icon')).toBeNull();
        expect(view.queryByTestId('select-field-expand-affordance')).toBeNull();
        fireEvent(trigger, 'focus');
        expect(surface.props.style.borderColor).toBe('#E6E037');
        fireEvent.press(trigger);
        expect(surface.props.style.backgroundColor).toBe('#1B1B18');
        expect(trigger.props.accessibilityState.expanded).toBe(true);
        expect(view.getByRole('radio', { name: 'ja' }).props.accessibilityState.selected).toBe(true);
        fireEvent.press(view.getByRole('radio', { name: 'pt-BR' }));
        expect(onChange).toHaveBeenCalledWith('pt-BR');
        expect(view.queryByTestId('select-field-sheet')).toBeNull();
    });

    it.each(['light', 'dark'] as const)('mantém campo expansível e foco assistivo com movimento reduzido em %s', scheme => {
        const sendFocus = jest.spyOn(AccessibilityInfo, 'sendAccessibilityEvent').mockImplementation(() => {});
        const view = render(
            <ThemeProvider initialOverride={scheme} fontSize="COMFORTABLE" reduceMotion waitForPlatform={false}>
                <SelectField
                    variant="input"
                    closeLabel="Fechar seleção"
                    label="Idioma"
                    value="zh-Hant"
                    options={['zh-Hant', 'ja'] as const}
                    optionLabel={option => (option === 'zh-Hant' ? 'Chinês tradicional' : 'Japonês')}
                    onChange={jest.fn()}
                />
            </ThemeProvider>,
            { createNodeMock: () => ({ focus: jest.fn() }) },
        );
        expect(view.getByText('Chinês tradicional').props.numberOfLines).toBeUndefined();
        expect(view.getByTestId('select-field-trigger-content').props.style.backgroundColor).toBe(scheme === 'light' ? '#FFFEFA' : '#1B1B18');
        fireEvent.press(view.getByRole('button', { name: 'Idioma: Chinês tradicional' }));
        const modal = view.UNSAFE_getByType(Modal);
        expect(modal.props.animationType).toBe('none');
        act(() => modal.props.onShow());
        expect(sendFocus).toHaveBeenCalledWith(expect.anything(), 'focus');
        sendFocus.mockClear();
        fireEvent.press(view.getByTestId('select-field-backdrop'));
        act(() => modal.props.onDismiss());
        expect(sendFocus).toHaveBeenCalledWith(expect.anything(), 'focus');
        sendFocus.mockRestore();
    });

    it('dimensiona a folha pela viewport e pelo conteúdo sem extrapolar a área segura', () => {
        expect(resolveSelectSheetHeight({ height: 844 }, { bottom: 34, top: 47 }, 5)).toBe(618);
        expect(resolveSelectSheetHeight({ height: 844 }, { bottom: 34, top: 47 }, 2, true)).toBe(402);
        expect(resolveSelectSheetHeight({ height: 390 }, { bottom: 21, top: 0 }, 12)).toBeCloseTo(319.8);
        expect(resolveSelectSheetHeight({ height: Number.NaN }, { bottom: -10, top: Number.POSITIVE_INFINITY }, 5)).toBe(0);
    });

    it('permite alternar switch pela linha inteira e comunica disabled', () => {
        const onChange = jest.fn();
        const view = withTheme(<SwitchRow label="Contraste" description="Realça bordas" value={false} onChange={onChange} />);
        const control = view.getByRole('switch', { name: 'Contraste' });

        fireEvent.press(view.getByText('Contraste'));

        expect(control.props.accessibilityState).toEqual({ checked: false, disabled: false });
        const contentStyle = StyleSheet.flatten(view.getByTestId('switch-row-content').props.style);
        const copyStyle = StyleSheet.flatten(view.getByTestId('switch-row-copy').props.style);
        const switchStyle = StyleSheet.flatten(view.getByTestId('switch-row-control').props.style);
        expect(['row', 'column']).toContain(contentStyle.flexDirection);
        expect(contentStyle).toEqual(expect.objectContaining({ minWidth: 0 }));
        expect(contentStyle.position).toBeUndefined();
        if (contentStyle.flexDirection === 'row') {
            expect(contentStyle.alignItems).toBe('center');
            expect(copyStyle).toEqual(expect.objectContaining({ flexBasis: 0, flexGrow: 1, flexShrink: 1, minWidth: 0 }));
            expect(switchStyle.alignSelf).toBeUndefined();
        } else {
            expect(copyStyle).toEqual(expect.objectContaining({ flexGrow: 0, flexShrink: 0, minWidth: 0, width: '100%' }));
            expect(switchStyle.alignSelf).toBe('flex-end');
        }
        expect(switchStyle).toEqual(expect.objectContaining({ flexShrink: 0, minWidth: 52, width: 52 }));
        expect(switchStyle.position).toBeUndefined();
        expect(onChange).toHaveBeenCalledWith(true);
    });

    it('empilha o switch após a copy com fonte ampliada sem usar sobreposição absoluta', () => {
        expect(resolveSwitchRowStacked(2)).toBe(true);
        expect(resolveSwitchRowStacked(1)).toBe(false);
    });

    it('empilha segmentos com fonte a 200% para não mesclar alternativas', () => {
        expect(resolveSegmentedControlStacked('regular', 2)).toBe(true);
        expect(resolveChoiceCardsStacked('grid', 'regular', 2)).toBe(true);
        expect(resolveChoiceGroupStacked('horizontal', 2)).toBe(true);
        expect(resolveSegmentedControlStacked('regular', 1)).toBe(false);
        expect(resolveChoiceCardsStacked('grid', 'regular', 1)).toBe(false);
        expect(resolveChoiceGroupStacked('horizontal', 1)).toBe(false);
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

        expect(view.getByRole('adjustable', { name: 'Saturação' }).props.accessibilityValue).toEqual({ max: 100, min: 0, now: 55, text: '55%' });
        expect(onChange).toHaveBeenCalledWith(55);
    });

    it('calcula o slider pela largura útil entre os centros do thumb', () => {
        expect(resolveRangeSliderValue(190, 200, 0, 100, 5, RANGE_SLIDER_THUMB_RADIUS)).toBe(100);
        expect(resolveRangeSliderValue(10, 200, 0, 100, 5, RANGE_SLIDER_THUMB_RADIUS)).toBe(0);
        expect(resolveRangeSliderValue(40, 200, 0, 100, 5, RANGE_SLIDER_THUMB_RADIUS)).toBe(15);
        expect(resolveRangeSliderValue(-20, 200, 0, 100, 5, RANGE_SLIDER_THUMB_RADIUS)).toBe(0);
        expect(resolveRangeSliderValue(220, 200, 0, 100, 5, RANGE_SLIDER_THUMB_RADIUS)).toBe(100);
        expect(resolveRangeSliderValue(100, 200, 0, 100, 5, RANGE_SLIDER_THUMB_RADIUS)).toBe(50);
        expect(resolveRangeSliderValue(135, 200, 0, 100, 5, RANGE_SLIDER_THUMB_RADIUS)).toBe(70);
    });

    it.each([
        { expectedLeft: 0, value: 0 },
        { expectedLeft: 176, value: 100 },
    ])('mantém o thumb dentro do contêiner no extremo $value', ({ expectedLeft, value }) => {
        const thumbCenter = resolveRangeSliderThumbPosition(value, 200, 0, 100, RANGE_SLIDER_THUMB_RADIUS);
        const view = withTheme(
            <RangeSlider
                decrementLabel="Diminuir saturação"
                incrementLabel="Aumentar saturação"
                label="Saturação"
                maximum={100}
                minimum={0}
                onChange={jest.fn()}
                value={value}
            />,
        );

        act(() => {
            fireEvent(view.getByTestId('range-slider-track'), 'layout', { nativeEvent: { layout: { width: 200 } } });
        });

        const thumbStyle = StyleSheet.flatten(view.UNSAFE_getByProps({ testID: 'range-slider-thumb' }).props.style);
        const railStyle = StyleSheet.flatten(view.getByTestId('range-slider-rail').props.style);
        expect(thumbCenter - RANGE_SLIDER_THUMB_RADIUS).toBe(expectedLeft);
        expect(thumbCenter + RANGE_SLIDER_THUMB_RADIUS).toBeLessThanOrEqual(200);
        expect(thumbStyle).toEqual(expect.objectContaining({ height: RANGE_SLIDER_THUMB_SIZE, left: 0, width: RANGE_SLIDER_THUMB_SIZE }));
        expect(railStyle.marginHorizontal).toBe(RANGE_SLIDER_THUMB_RADIUS);
    });

    it.each([
        { controlledValue: 100, direction: 'da direita para a esquerda', startX: 188, translationX: -88 },
        { controlledValue: 0, direction: 'da esquerda para a direita', startX: 12, translationX: 88 },
    ])(
        'MOB-FEAT-034 AC-004 fixa o release $direction apesar de prop antiga e evento tardio',
        ({ controlledValue, direction: _direction, startX, translationX }) => {
            const onChange = jest.fn();
            const renderSlider = (value: number) => (
                <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, right: 0, bottom: 34, left: 0 } }}>
                    <ThemeProvider initialOverride="dark" waitForPlatform={false}>
                        <RangeSlider
                            decrementLabel="Diminuir saturação"
                            incrementLabel="Aumentar saturação"
                            label="Saturação"
                            maximum={100}
                            minimum={0}
                            onChange={onChange}
                            step={5}
                            value={value}
                        />
                    </ThemeProvider>
                </SafeAreaProvider>
            );
            const view = render(renderSlider(controlledValue));
            const slider = view.getByTestId('range-slider-track');

            act(() => {
                fireEvent(slider, 'layout', { nativeEvent: { layout: { width: 200 } } });
                fireEvent(slider, 'rangeSliderPanBegin', { x: startX });
                fireEvent(slider, 'rangeSliderPanStart', { x: startX, translationX: 0 });
                fireEvent(slider, 'rangeSliderPanUpdate', { x: startX + translationX });
            });
            expect(onChange).not.toHaveBeenCalled();

            act(() => fireEvent(slider, 'rangeSliderPanEnd', { success: true, x: startX + translationX }));
            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange).toHaveBeenCalledWith(50);
            expect(view.getByRole('adjustable', { name: 'Saturação' }).props.accessibilityValue.now).toBe(50);

            act(() => view.rerender(renderSlider(controlledValue)));
            expect(view.getByRole('adjustable', { name: 'Saturação' }).props.accessibilityValue.now).toBe(50);

            act(() => fireEvent(view.getByTestId('range-slider-track'), 'rangeSliderPanUpdate', { x: startX + 120 }));
            expect(onChange).toHaveBeenCalledTimes(1);
            expect(view.getByRole('adjustable', { name: 'Saturação' }).props.accessibilityValue.now).toBe(50);

            act(() => view.rerender(renderSlider(50)));
            expect(view.getByRole('adjustable', { name: 'Saturação' }).props.accessibilityValue.now).toBe(50);
        },
    );

    it.each([
        { beginX: 188, controlledValue: 100, direction: 'da direita para a esquerda', finalX: 100.2, startX: 174.9, translationX: -74.7 },
        { beginX: 12, controlledValue: 0, direction: 'da esquerda para a direita', finalX: 99.8, startX: 25.1, translationX: 74.7 },
    ])(
        'MOB-FEAT-034 AC-004 preserva o offset $direction quando o Android zera translationX ao ativar o pan',
        ({ beginX, controlledValue, direction: _direction, finalX, startX, translationX }) => {
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
                    value={controlledValue}
                />,
            );
            const slider = view.getByTestId('range-slider-track');

            act(() => {
                fireEvent(slider, 'layout', { nativeEvent: { layout: { width: 200 } } });
                fireEvent(slider, 'rangeSliderPanBegin', { x: beginX });
                fireEvent(slider, 'rangeSliderPanStart', { x: startX, translationX: 0 });
                fireEvent(slider, 'rangeSliderPanUpdate', { translationX, x: finalX });
                fireEvent(slider, 'rangeSliderPanEnd', { success: true, x: finalX });
            });

            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange).toHaveBeenCalledWith(50);
            expect(view.getByRole('adjustable', { name: 'Saturação' }).props.accessibilityValue.now).toBe(50);
        },
    );

    it.each([
        { controlledValue: 100, endX: 100, startX: 188 },
        { controlledValue: 0, endX: 100, startX: 12 },
    ])('captura o ponto terminal $controlledValue→50 mesmo sem onUpdate final', ({ controlledValue, endX, startX }) => {
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
                value={controlledValue}
            />,
        );
        const slider = view.getByTestId('range-slider-track');

        act(() => {
            fireEvent(slider, 'layout', { nativeEvent: { layout: { width: 200 } } });
            fireEvent(slider, 'rangeSliderPanBegin', { x: startX });
            fireEvent(slider, 'rangeSliderPanStart', { x: startX, translationX: 0 });
            fireEvent(slider, 'rangeSliderPanEnd', { success: true, x: endX });
        });

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(50);
        expect(view.getByRole('adjustable', { name: 'Saturação' }).props.accessibilityValue.now).toBe(50);
    });

    it('restaura o valor controlado ao cancelar um pan sem persistir', () => {
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
                value={100}
            />,
        );
        const slider = view.getByTestId('range-slider-track');

        act(() => {
            fireEvent(slider, 'layout', { nativeEvent: { layout: { width: 200 } } });
            fireEvent(slider, 'rangeSliderPanBegin', { x: 188 });
            fireEvent(slider, 'rangeSliderPanStart', { x: 188, translationX: 0 });
            fireEvent(slider, 'rangeSliderPanUpdate', { x: 100 });
            fireEvent(slider, 'rangeSliderPanFinalize', { success: false });
        });

        expect(onChange).not.toHaveBeenCalled();
        expect(view.getByRole('adjustable', { name: 'Saturação' }).props.accessibilityValue.now).toBe(100);
    });

    it('mapeia um toque no trilho para o valor final e emite uma única mudança', () => {
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
                value={0}
            />,
        );
        const slider = view.getByTestId('range-slider-track');

        act(() => {
            fireEvent(slider, 'layout', { nativeEvent: { layout: { width: 200 } } });
            fireEvent(slider, 'rangeSliderTapEnd', { success: true, x: 100 });
        });

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(50);
        expect(view.getByRole('adjustable', { name: 'Saturação' }).props.accessibilityValue.now).toBe(50);
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
