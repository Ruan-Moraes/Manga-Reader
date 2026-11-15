import { render } from '@testing-library/react-native';

import { useTheme } from '@/shared/theme';

import { RootNavigator } from '../RootNavigator';

jest.mock('expo-router', () => {
    const Stack = jest.fn(() => null) as jest.Mock & { Screen: jest.Mock };

    Stack.Screen = jest.fn(() => null);

    return { Stack };
});
jest.mock('@/shared/theme', () => ({ useTheme: jest.fn() }));

const stack = jest.requireMock('expo-router').Stack as jest.Mock;

const mockTheme = (decorativeMotionEnabled: boolean) =>
    jest
        .mocked(useTheme)
        .mockReturnValue({ decorativeMotionEnabled, motion: { screen: 140, screenSlide: 220 }, tokens: { bg: '#000' } } as ReturnType<typeof useTheme>);

const screens = () => {
    const children = (stack.mock.calls.at(-1)?.[0].children as (React.ReactElement<{ name: string; options: Record<string, unknown> }> | null)[]).filter(
        child => child !== null,
    );
    return Object.fromEntries(children.map(child => [child.props.name, child.props.options]));
};

describe('MOB-FEAT-002 navigation motion', () => {
    it.each([
        [true, 'fade'],
        [false, 'none'],
    ] as const)('resolve animação decorativa %s como %s', (decorativeMotionEnabled, animation) => {
        mockTheme(decorativeMotionEnabled);

        render(<RootNavigator />);

        expect(stack.mock.calls.at(-1)?.[0].screenOptions.animation).toBe(animation);
    });

    it('registra settings e +not-found no mesmo navegador raiz', () => {
        mockTheme(false);

        render(<RootNavigator />);

        expect(Object.keys(screens())).toEqual(expect.arrayContaining(['index', 'offline-translation', 'platform', 'settings', '+not-found']));
    });
});

describe('MOB-FEAT-069 transições da pilha raiz', () => {
    it('AC-002 cada rota recebe o tipo de transição da tabela', () => {
        mockTheme(true);

        render(<RootNavigator />);
        const options = screens();
        const animationOf = (name: string) => options[name]?.animation;

        for (const name of ['index', '(auth)', 'platform', 'translation-library', '+not-found']) expect(animationOf(name)).toBe('fade');
        for (const name of ['settings', 'work/[workId]/index', 'work/[workId]/manage']) {
            expect(options[name]).toEqual(expect.objectContaining({ animation: 'simple_push', animationDuration: 220, fullScreenGestureEnabled: true }));
        }
        expect(options['offline-translation']).toEqual(expect.objectContaining({ animation: 'slide_from_bottom', animationDuration: 220 }));
        expect(stack.mock.calls.at(-1)?.[0].screenOptions).toEqual(expect.objectContaining({ animation: 'fade', animationDuration: 140 }));
    });

    it('AC-004 leitores entram com fade e sem gesto de voltar em tela inteira', () => {
        mockTheme(true);

        render(<RootNavigator />);
        const options = screens();

        for (const name of ['reader', 'translation-reader/[projectId]', 'reader-preview']) {
            expect(options[name]).toEqual(expect.objectContaining({ animation: 'fade', fullScreenGestureEnabled: false, headerShown: false }));
        }
    });

    it('AC-002 com animações desligadas nenhuma rota anima', () => {
        mockTheme(false);

        render(<RootNavigator />);

        expect(Object.values(screens()).every(options => options.animation === 'none')).toBe(true);
    });
});
