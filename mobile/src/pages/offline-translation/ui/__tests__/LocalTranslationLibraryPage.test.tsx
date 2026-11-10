import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import i18n from '@/shared/i18n';

import { LocalTranslationLibraryPage } from '../LocalTranslationLibraryPage';
import { LocalWorkManagePage } from '../LocalWorkManagePage';
import { LocalWorkPage } from '../LocalWorkPage';

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockBack = jest.fn();
const mockProps: Record<string, Record<string, (...args: never[]) => unknown>> = {};
jest.mock('expo-router', () => ({
    router: {
        back: (...args: unknown[]) => mockBack(...args),
        canGoBack: () => false,
        push: (...args: unknown[]) => mockPush(...args),
        replace: (...args: unknown[]) => mockReplace(...args),
    },
    useFocusEffect: (effect: () => void) => jest.requireActual('react').useEffect(effect, [effect]),
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('expo-image', () => ({ Image: () => null }));
jest.mock('@/widgets/remote-processing', () => {
    const { Text } = jest.requireActual('react-native');
    return {
        BatchRetrySheet: ({ visible, projectId, description }: { visible: boolean; projectId: string; description?: string }) =>
            visible ? (
                <>
                    <Text>{`batch:${projectId}`}</Text>
                    <Text>{description}</Text>
                </>
            ) : null,
    };
});
jest.mock('@/widgets/local-translation-library', () => {
    const slots = (name: string) => (props: Record<string, never>) => {
        mockProps[name] = props as never;
        const render = props.scaffold as unknown as (slots: object) => unknown;
        return render({ title: 'Beta', children: null, stickyFooter: null, hasChapters: props.workId !== 'empty' });
    };
    return { LibraryShelf: slots('shelf'), WorkDetail: slots('detail'), WorkManage: slots('manage') };
});

const frame = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };

describe('MOB-FEAT-055/AC-008 e MOB-FEAT-060 páginas da biblioteca', () => {
    beforeEach(async () => {
        mockReplace.mockClear();
        mockPush.mockClear();
        await i18n.changeLanguage('pt-BR');
    });

    it('renders back and Home with the same square geometry and both return to the root', async () => {
        render(
            <SafeAreaProvider initialMetrics={frame}>
                <LocalTranslationLibraryPage />
            </SafeAreaProvider>,
        );
        const back = await screen.findByRole('button', { name: 'Voltar' });
        const home = screen.getByRole('button', { name: 'Início' });
        expect(back).toHaveStyle({ borderRadius: 12 });
        expect(home).toHaveStyle({ borderRadius: 12 });
        // Voltar é compacto (40) mas o alvo de toque com hitSlop alcança o mínimo do "Início".
        expect(back.props.style.width + back.props.hitSlop * 2).toBeGreaterThanOrEqual(home.props.style.minWidth);
        fireEvent.press(home);
        expect(mockReplace).toHaveBeenCalledWith('/');
    });

    it('AC-009 abre o capítulo em dois toques: biblioteca → obra → leitor', () => {
        render(
            <SafeAreaProvider initialMetrics={frame}>
                <LocalTranslationLibraryPage />
            </SafeAreaProvider>,
        );
        mockProps.shelf.onOpenWork('w1' as never);
        expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/work/[workId]', params: { workId: 'w1' } });
        mockProps.shelf.onOpenReader('legacy' as never);
        expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/translation-reader/[projectId]', params: { projectId: 'legacy' } });
        mockProps.shelf.onTranslate();
        expect(mockPush).toHaveBeenLastCalledWith('/offline-translation');

        render(
            <SafeAreaProvider initialMetrics={frame}>
                <LocalWorkPage workId="w1" />
            </SafeAreaProvider>,
        );
        mockProps.detail.onOpenReader('a' as never);
        expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/translation-reader/[projectId]', params: { projectId: 'a' } });
        mockProps.detail.onNewChapter({ workId: 'w1', label: '4' } as never);
        expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/offline-translation', params: { workId: 'w1', label: '4' } });
    });

    it('AC-012 tela da obra: gerenciar, Home e obra inexistente volta à biblioteca', () => {
        render(
            <SafeAreaProvider initialMetrics={frame}>
                <LocalWorkPage workId="w1" />
            </SafeAreaProvider>,
        );
        fireEvent.press(screen.getByRole('button', { name: 'Gerenciar obra' }));
        expect(mockPush).toHaveBeenCalledWith({ pathname: '/work/[workId]/manage', params: { workId: 'w1' } });
        fireEvent.press(screen.getByRole('button', { name: 'Início' }));
        expect(mockReplace).toHaveBeenCalledWith('/');
        mockProps.detail.onMissing();
        expect(mockReplace).toHaveBeenCalledWith('/translation-library');
        fireEvent.press(screen.getByRole('button', { name: 'Voltar' }));
        expect(mockReplace).toHaveBeenCalledWith('/translation-library');
    });

    it('obra sem capítulos mostra só voltar e Início no cabeçalho', () => {
        render(
            <SafeAreaProvider initialMetrics={frame}>
                <LocalWorkPage workId="empty" />
            </SafeAreaProvider>,
        );
        expect(screen.queryByRole('button', { name: 'Gerenciar obra' })).toBeNull();
        expect(screen.getByRole('button', { name: 'Início' })).toBeOnTheScreen();
        expect(screen.getByRole('button', { name: 'Voltar' })).toBeOnTheScreen();
    });

    it('AC-007 "Tentar traduzir de novo" abre o painel de lote da 055 só para aquele capítulo', async () => {
        render(
            <SafeAreaProvider initialMetrics={frame}>
                <LocalWorkPage workId="w1" />
            </SafeAreaProvider>,
        );
        const { act } = jest.requireActual('@testing-library/react-native');
        act(() => {
            mockProps.detail.onRetryChapter('b' as never);
        });
        expect(await screen.findByText('batch:b')).toBeOnTheScreen();
        expect(screen.getByText('Só as páginas que falharam são enviadas, e só depois do seu aceite.')).toBeOnTheScreen();
    });

    it('AC-012 gerenciar: voltar e "Ver capítulos" retornam à obra; obra excluída volta à biblioteca', () => {
        render(
            <SafeAreaProvider initialMetrics={frame}>
                <LocalWorkManagePage workId="w1" />
            </SafeAreaProvider>,
        );
        fireEvent.press(screen.getByRole('button', { name: 'Voltar' }));
        expect(mockReplace).toHaveBeenCalledWith({ pathname: '/work/[workId]', params: { workId: 'w1' } });
        mockProps.manage.onViewChapters();
        expect(mockReplace).toHaveBeenCalledTimes(2);
        mockProps.manage.onMissing();
        expect(mockReplace).toHaveBeenLastCalledWith('/translation-library');
    });
});
