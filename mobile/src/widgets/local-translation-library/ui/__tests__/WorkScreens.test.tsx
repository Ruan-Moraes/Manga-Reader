import { View } from 'react-native';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { LocalTranslationLibraryItem, LocalTranslationResultRepository } from '@/entities/local-translation-result';
import type { LocalWork, LocalWorkChapter } from '@/entities/local-work';
import type { TranslationState } from '@/entities/translation-page';
import type { ManageLocalWorksController } from '@/features/manage-local-works';
import i18n from '@/shared/i18n';
import type { LocalMediaPicker } from '@/shared/media-picker';
import { ThemeProvider } from '@/shared/theme';

import { WorkDetail } from '../WorkDetail';
import { WorkManage } from '../WorkManage';

jest.mock('expo-image', () => ({ Image: () => null }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

const work = (id: string, name: string, updatedAt = 2, coverFilename: string | null = null): LocalWork => ({
    id,
    name,
    coverFilename,
    createdAt: 1,
    updatedAt,
});
const link = (projectId: string, workId: string, label: string): LocalWorkChapter => ({ projectId, workId, label, createdAt: 2, updatedAt: 2 });

function item(id: string, statuses: TranslationState[], options: { position?: number; progressAt?: number } = {}): LocalTranslationLibraryItem {
    return {
        project: {
            id,
            sourceLanguage: 'ja',
            targetLanguage: 'pt-BR',
            status: 'DRAFT',
            createdAt: Date.UTC(2026, 10, 8, 12),
            updatedAt: 5,
            statusUpdatedAt: 5,
            languageReviewRequired: false,
            pages: statuses.map((status, position) => ({
                id: `${id}-${position}`,
                projectId: id,
                position,
                originalFilename: `${position}.jpg`,
                originalByteSize: 1,
                originalMimeType: 'image/jpeg' as const,
                widthPx: 1,
                heightPx: 1,
                mediaValidatedAt: 1,
                mediaValidationPolicyVersion: 1,
                status,
                createdAt: 5,
                updatedAt: 5,
                statusUpdatedAt: 5,
            })),
        },
        readyPages: statuses.filter(status => status === 'READY').length,
        currentPosition: options.position ?? null,
        progressUpdatedAt: options.progressAt ?? null,
        coverUri: `file:///${id}.jpg`,
        demo: false,
    };
}

interface Data {
    works: LocalWork[];
    chapters: Record<string, LocalWorkChapter[]>;
    items: LocalTranslationLibraryItem[];
    unassigned: string[];
}

function sources(data: Data, options: { failLoad?: boolean } = {}) {
    const controller = {
        initialize: jest.fn(async () => {
            if (options.failLoad) throw new Error('db');
            return data.works;
        }),
        coverUri: jest.fn((value: LocalWork) => (value.coverFilename ? `file:///cover-${value.id}` : null)),
        create: jest.fn(async (name: string) => work('new', name)),
        rename: jest.fn(async (value: LocalWork) => value),
        replaceCover: jest.fn(async (value: LocalWork) => value),
        removeCover: jest.fn(async (value: LocalWork) => value),
        listChapters: jest.fn(async (workId: string) => data.chapters[workId] ?? []),
        listUnassignedProjectIds: jest.fn(async () => data.unassigned),
        attachChapter: jest.fn(async (value: LocalWork) => value),
        attachProjectToWork: jest.fn(async () => undefined),
        renameChapter: jest.fn(),
        deleteWork: jest.fn(async () => ({ cleanupPending: false })),
        deleteChapter: jest.fn(async () => ({ cleanupPending: false })),
        moveChapter: jest.fn(async () => undefined),
        measureBytes: jest.fn(async () => 0),
        clearAll: jest.fn(async () => undefined),
    } as unknown as jest.Mocked<ManageLocalWorksController>;
    const projects: Pick<LocalTranslationResultRepository, 'initialize' | 'listLibrary'> = {
        initialize: jest.fn(async () => undefined),
        listLibrary: jest.fn(async () => data.items),
    };
    const picker: jest.Mocked<LocalMediaPicker> = {
        pickImages: jest.fn().mockResolvedValue({ status: 'selected', images: [{ uri: 'content://cover', mimeType: 'image/png', fileSize: 10 }] }),
        getPendingImages: jest.fn().mockResolvedValue(null),
    };
    return { controller, projects, picker };
}
function wrap(node: React.ReactNode) {
    return render(
        <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
            <ThemeProvider waitForPlatform={false}>{node}</ThemeProvider>
        </SafeAreaProvider>,
    );
}

function scaffold({ title, children, stickyFooter }: { title: string; children: React.ReactNode; stickyFooter: React.ReactNode }) {
    return (
        <View>
            <View testID="title" accessibilityLabel={title} />
            {children}
            <View testID="footer">{stickyFooter}</View>
        </View>
    );
}

function detail(data: Data, workId = 'w1') {
    const deps = sources(data);
    const callbacks = { onOpenReader: jest.fn(), onNewChapter: jest.fn(), onRetryChapter: jest.fn(), onMissing: jest.fn() };
    wrap(<WorkDetail workId={workId} scaffold={scaffold} {...deps} {...callbacks} />);
    return { ...deps, ...callbacks };
}

const base: Data = {
    works: [work('w1', 'Beta', 5), work('w2', 'Vazia', 1)],
    chapters: { w1: [link('a', 'w1', 'Prólogo'), link('b', 'w1', 'Dois'), link('c', 'w1', 'Três')], w2: [] },
    items: [
        item('a', ['READY', 'READY']),
        item('b', ['READY', 'FAILED', 'READY'], { position: 0, progressAt: 30 }),
        item('c', ['PROCESSING']),
        item('legacy', ['READY']),
    ],
    unassigned: ['legacy'],
};

beforeEach(async () => {
    await i18n.changeLanguage('pt-BR');
});

describe('MOB-FEAT-060 tela da obra', () => {
    it('AC-006 mostra topo, selos, capítulos com pílula e "⋯" e rodapé "Continuar"', async () => {
        const { onOpenReader } = detail(base);
        const row = await screen.findByTestId('chapter-row-b');
        expect(screen.getByTestId('title')).toHaveProp('accessibilityLabel', 'Beta');
        expect(screen.getByText('3 capítulos · 6 páginas')).toBeOnTheScreen();
        expect(screen.getByTestId('work-failed')).toHaveProp('accessibilityLabel', '1 falhou');
        expect(screen.getByTestId('work-processing')).toHaveProp('accessibilityLabel', '1 em tradução');
        expect(within(row).getByText('Parou na página 1 de 3')).toBeOnTheScreen();
        const continueChapter = within(row).getByRole('button', { name: 'Continuar — Dois' });
        const initialColor = row.props.style.backgroundColor;
        fireEvent(continueChapter, 'pressIn');
        expect(screen.getByTestId('chapter-row-b').props.style.backgroundColor).not.toBe(initialColor);
        fireEvent(continueChapter, 'pressOut');
        expect(screen.getByTestId('chapter-row-b')).toHaveStyle({ backgroundColor: initialColor });
        expect(screen.getByTestId('chapter-status-c')).toHaveProp('accessibilityLabel', 'Processando');
        expect(screen.queryByTestId('chapter-status-a')).toBeNull();
        expect(within(screen.getByTestId('chapter-row-a')).getByRole('button', { name: 'Ler — Prólogo' })).toBeOnTheScreen();
        fireEvent.press(within(screen.getByTestId('footer')).getByRole('button', { name: 'Continuar · cap. 2, pág. 1' }));
        expect(onOpenReader).toHaveBeenCalledWith('b');
    });

    it('mostra "Capítulo N" para nomes numéricos, nomes dos idiomas e menu "⋯" horizontal (revisão 2026-11-13)', async () => {
        detail({ ...base, chapters: { ...base.chapters, w1: [link('a', 'w1', '3'), link('b', 'w1', 'Dois'), link('c', 'w1', 'Três')] } });
        const row = await screen.findByTestId('chapter-row-a');
        expect(within(row).getByText('Capítulo 3')).toBeOnTheScreen();
        expect(within(screen.getByTestId('chapter-row-b')).getByText('Dois')).toBeOnTheScreen();
        expect(screen.getByText('Japonês → Português (Brasil)')).toBeOnTheScreen();
        expect(screen.queryByText('ja → pt-BR')).toBeNull();
        const menu = within(row).getByRole('button', { name: /Ações de/ });
        expect(screen.UNSAFE_queryAllByProps({ name: 'ellipsis-vertical' })).toHaveLength(0);
        expect(menu).toBeOnTheScreen();
    });

    it('AC-006 alterna a ordem 1 → N / N → 1', async () => {
        detail(base);
        await screen.findByTestId('chapter-row-a');
        const order = () => screen.getAllByTestId(/^chapter-row-/).map(row => row.props.testID);
        expect(order()).toEqual(['chapter-row-a', 'chapter-row-b', 'chapter-row-c']);
        fireEvent.press(screen.getByTestId('chapter-order'));
        expect(order()).toEqual(['chapter-row-c', 'chapter-row-b', 'chapter-row-a']);
    });

    it('AC-006 rodapé "Começar a ler" sem progresso e "Novo capítulo" sem capítulos', async () => {
        detail({ ...base, items: base.items.map(entry => ({ ...entry, currentPosition: null, progressUpdatedAt: null })) });
        expect(await screen.findByRole('button', { name: 'Começar a ler' })).toBeOnTheScreen();
    });

    it('AC-010 obra sem capítulos mostra o estado vazio com vínculo de capítulo anterior', async () => {
        const { controller, onNewChapter } = detail(base, 'w2');
        expect(await screen.findByText('Nenhum capítulo ainda')).toBeOnTheScreen();
        fireEvent.press(screen.getByRole('button', { name: 'Vincular capítulo anterior' }));
        const title = `Capítulo de ${new Intl.DateTimeFormat('pt-BR').format(base.items[3].project.createdAt)}`;
        fireEvent.press(await screen.findByRole('checkbox', { name: `Selecionar ${title}` }));
        expect(screen.getByLabelText('Número ou nome do capítulo')).toHaveProp('value', '1');
        fireEvent.press(screen.getByRole('button', { name: 'Vincular 1 capítulo' }));
        await waitFor(() => expect(controller.attachChapter).toHaveBeenCalledWith(base.works[1], 'legacy', '1'));

        fireEvent.press(within(screen.getByTestId('footer')).getByRole('button', { name: 'Novo capítulo' }));
        await screen.findByLabelText('Número ou nome do capítulo');
        const [, confirm] = screen.getAllByRole('button', { name: 'Novo capítulo' });
        fireEvent.press(confirm);
        expect(onNewChapter).toHaveBeenCalledWith({ workId: 'w2', label: '1' });
    });

    it('AC-007 "Tentar traduzir de novo" só aparece com páginas falhas; renomear e excluir pedem folha', async () => {
        const { controller, onRetryChapter } = detail(base);
        await screen.findByTestId('chapter-row-a');
        fireEvent.press(screen.getByRole('button', { name: 'Ações de Prólogo' }));
        expect(screen.queryByRole('button', { name: 'Tentar traduzir de novo' })).toBeNull();
        fireEvent.press(screen.getByRole('button', { name: 'Cancelar' }));

        fireEvent.press(screen.getByRole('button', { name: 'Ações de Dois' }));
        fireEvent.press(await screen.findByRole('button', { name: 'Tentar traduzir de novo' }));
        expect(onRetryChapter).toHaveBeenCalledWith('b');

        fireEvent.press(screen.getByRole('button', { name: 'Ações de Dois' }));
        fireEvent.press(await screen.findByRole('button', { name: 'Renomear' }));
        const input = await screen.findByLabelText('Número ou nome do capítulo');
        fireEvent.changeText(input, '2');
        fireEvent.press(screen.getByRole('button', { name: 'Salvar' }));
        await waitFor(() => expect(controller.renameChapter).toHaveBeenCalledWith(base.works[0], base.chapters.w1[1], '2'));

        fireEvent.press(screen.getByRole('button', { name: 'Ações de Dois' }));
        fireEvent.press(await screen.findByRole('button', { name: 'Excluir capítulo' }));
        expect(await screen.findByText('Excluir “Dois”?')).toBeOnTheScreen();
        expect(screen.getByText('3 páginas originais')).toBeOnTheScreen();
        fireEvent.press(screen.getByTestId('confirm-sheet-confirm'));
        await waitFor(() => expect(controller.deleteChapter).toHaveBeenCalledWith(base.works[0], 'b'));
    });

    it('capítulo nunca enviado oferece "Traduzir agora"; capítulo pode mudar de obra ou sair dela sem apagar (2026-11-10)', async () => {
        const data: Data = { ...base, items: [...base.items.filter(entry => entry.project.id !== 'c'), item('c', ['DRAFT', 'DRAFT'])] };
        const { controller, onRetryChapter } = detail(data);
        await screen.findByTestId('chapter-row-c');
        fireEvent.press(screen.getByRole('button', { name: 'Ações de Três' }));
        fireEvent.press(await screen.findByRole('button', { name: 'Traduzir agora' }));
        expect(onRetryChapter).toHaveBeenCalledWith('c');

        fireEvent.press(screen.getByRole('button', { name: 'Ações de Prólogo' }));
        fireEvent.press(await screen.findByRole('button', { name: 'Tirar da obra' }));
        fireEvent.press(await screen.findByTestId('confirm-sheet-confirm'));
        await waitFor(() => expect(controller.moveChapter).toHaveBeenCalledWith(base.works[0], 'a', null, ''));
        expect(controller.deleteChapter).not.toHaveBeenCalled();

        fireEvent.press(screen.getByRole('button', { name: 'Ações de Prólogo' }));
        fireEvent.press(await screen.findByRole('button', { name: 'Mover para outra obra' }));
        fireEvent.press(await screen.findByRole('radio', { name: /Vazia/ }));
        fireEvent.press(screen.getByRole('button', { name: /^Mover para / }));
        await waitFor(() => expect(controller.moveChapter).toHaveBeenCalledWith(base.works[0], 'a', base.works[1], '1'));
    });

    it('AC-012 obra inexistente sai da tela sem estado vazio', async () => {
        const { onMissing } = detail(base, 'gone');
        await waitFor(() => expect(onMissing).toHaveBeenCalledTimes(1));
    });
});

describe('MOB-FEAT-060 gerenciar obra', () => {
    function manage(data: Data) {
        const deps = sources(data);
        const callbacks = { onViewChapters: jest.fn(), onMissing: jest.fn() };
        wrap(<WorkManage workId="w1" scaffold={scaffold} {...deps} {...callbacks} />);
        return { ...deps, ...callbacks };
    }

    it('mostra nomes dos idiomas e o nome da obra numa linha só na linha "Nome" (revisão 2026-11-13)', async () => {
        manage(base);
        await screen.findByRole('button', { name: 'Nome' });
        expect(screen.getByText(/Japonês → Português \(Brasil\)/)).toBeOnTheScreen();
        expect(screen.queryByText(/ja → pt-BR/)).toBeNull();
        const values = screen.getAllByText('Beta').filter(node => node.props.numberOfLines === 1);
        expect(values.length).toBeGreaterThan(0);
    });

    it('AC-008 mostra informações, vínculo e zona de risco usando as operações da 055', async () => {
        const { controller, onViewChapters, onMissing } = manage(base);
        expect(await screen.findByRole('button', { name: 'Nome' })).toBeOnTheScreen();
        expect(screen.getByText('Sem capa')).toBeOnTheScreen();
        expect(screen.getByText('1 disponível em Sem obra')).toBeOnTheScreen();

        fireEvent.press(screen.getByRole('button', { name: 'Nome' }));
        fireEvent.changeText(await screen.findByLabelText('Nome da obra'), 'Gama');
        fireEvent.press(screen.getByRole('button', { name: 'Salvar' }));
        await waitFor(() => expect(controller.rename).toHaveBeenCalledWith(base.works[0], 'Gama'));

        fireEvent.press(screen.getByRole('button', { name: 'Ver capítulos' }));
        expect(onViewChapters).toHaveBeenCalled();

        fireEvent.press(screen.getByRole('button', { name: 'Excluir obra' }));
        expect(await screen.findByText('3 capítulos e suas páginas')).toBeOnTheScreen();
        fireEvent.press(screen.getByTestId('confirm-sheet-confirm'));
        await waitFor(() => expect(controller.deleteWork).toHaveBeenCalledWith(base.works[0]));
        await waitFor(() => expect(onMissing).toHaveBeenCalledTimes(1));
    });

    it('AC-008 vínculo aceita seleção múltipla com nomes sugeridos e editáveis', async () => {
        const data = { ...base, items: [...base.items, item('legacy2', ['READY'])], unassigned: ['legacy', 'legacy2'] };
        const { controller } = manage(data);
        fireEvent.press(await screen.findByRole('button', { name: 'Vincular capítulo anterior' }));
        const boxes = await screen.findAllByRole('checkbox');
        fireEvent.press(boxes[0]);
        fireEvent.press(boxes[1]);
        const inputs = screen.getAllByLabelText('Número ou nome do capítulo');
        expect(inputs.map(input => input.props.value)).toEqual(['4', '5']);
        fireEvent.changeText(inputs[1], 'Extra');
        expect(screen.getByText('Vincular 2 capítulos')).toHaveProp('numberOfLines', 1);
        fireEvent.press(screen.getByRole('button', { name: 'Vincular 2 capítulos' }));
        await waitFor(() => expect(controller.attachChapter).toHaveBeenCalledTimes(2));
        expect(controller.attachChapter).toHaveBeenNthCalledWith(1, base.works[0], 'legacy', '4');
        expect(controller.attachChapter).toHaveBeenNthCalledWith(2, base.works[0], 'legacy2', 'Extra');
    });
});
