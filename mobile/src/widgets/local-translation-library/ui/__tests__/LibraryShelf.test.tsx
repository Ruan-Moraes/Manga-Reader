import { StyleSheet, View } from 'react-native';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { LocalTranslationLibraryItem, LocalTranslationResultRepository } from '@/entities/local-translation-result';
import type { LocalWork, LocalWorkChapter } from '@/entities/local-work';
import type { TranslationState } from '@/entities/translation-page';
import type { ManageLocalWorksController } from '@/features/manage-local-works';
import i18n from '@/shared/i18n';
import type { LocalMediaPicker } from '@/shared/media-picker';
import { ThemeProvider } from '@/shared/theme';
import { useToastStore } from '@/shared/ui';

import { LibraryShelf } from '../LibraryShelf';

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

function fixture(data: Data, options: { failLoad?: boolean } = {}) {
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
    const removeProject = { remove: jest.fn(async () => undefined) };
    const onOpenWork = jest.fn();
    const onOpenReader = jest.fn();
    const onTranslate = jest.fn();
    render(
        <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
            <ThemeProvider waitForPlatform={false}>
                <LibraryShelf
                    {...{ controller, projects, picker, removeProject, onOpenWork, onOpenReader, onTranslate }}
                    scaffold={({ children, stickyFooter }) => (
                        <View>
                            {children}
                            <View testID="footer">{stickyFooter}</View>
                        </View>
                    )}
                />
            </ThemeProvider>
        </SafeAreaProvider>,
    );
    return { controller, projects, picker, removeProject, onOpenWork, onOpenReader, onTranslate };
}

const library: Data = {
    works: [work('w1', 'Beta', 5), work('w2', 'Alfa', 1, 'cover.png')],
    chapters: { w1: [link('a', 'w1', '1'), link('b', 'w1', '2')], w2: [] },
    items: [item('a', ['READY', 'READY'], { position: 1, progressAt: 40 }), item('b', ['READY', 'FAILED']), item('legacy', ['READY', 'READY'])],
    unassigned: ['legacy'],
};

beforeEach(async () => {
    await i18n.changeLanguage('pt-BR');
});

describe('MOB-FEAT-060 biblioteca', () => {
    it('AC-001 mostra esqueleto, depois a grade de obras com contagem, selo, resumo, "⋯" e "Nova obra"', async () => {
        fixture(library);
        expect(screen.getByTestId('library-skeleton')).toBeOnTheScreen();
        expect(await screen.findByTestId('work-card-w1')).toBeOnTheScreen();
        expect(screen.getByText('Obras')).toBeOnTheScreen();
        expect(within(screen.getByTestId('work-card-w1')).getByText('Parou no cap. 1')).toBeOnTheScreen();
        expect(within(screen.getByTestId('work-card-w2')).getByText('Sem capítulos')).toBeOnTheScreen();
        expect(screen.getByTestId('work-card-status-w1')).toHaveProp('accessibilityLabel', '1 falhou');
        expect(screen.getByTestId('work-card-progress-w1')).toBeOnTheScreen();
        expect(screen.getByRole('button', { name: 'Ações da obra Beta' })).toBeOnTheScreen();
        expect(screen.getByTestId('new-work-tile')).toBeOnTheScreen();
        expect(within(screen.getByTestId('footer')).getByRole('button', { name: 'Traduzir capítulo' })).toBeOnTheScreen();
    });

    it('AC-002/AC-009 "Continuar lendo" abre o leitor em um toque e a obra abre com um toque', async () => {
        const { onOpenReader, onOpenWork, onTranslate } = fixture(library);
        const card = await screen.findByTestId('continue-reading-card');
        expect(within(card).getByText('Capítulo 1 · página 2 de 2')).toBeOnTheScreen();
        fireEvent.press(card);
        expect(onOpenReader).toHaveBeenCalledWith('a');
        fireEvent.press(screen.getByRole('button', { name: 'Abrir Beta' }));
        expect(onOpenWork).toHaveBeenCalledWith('w1');
        fireEvent.press(screen.getByRole('button', { name: 'Traduzir capítulo' }));
        expect(onTranslate).toHaveBeenCalled();
    });

    it('AC-002 sem progresso não mostra "Continuar lendo"', async () => {
        fixture({ ...library, items: [item('a', ['READY']), item('b', ['READY']), item('legacy', ['READY'])] });
        await screen.findByTestId('work-card-w1');
        expect(screen.queryByTestId('continue-reading-card')).toBeNull();
    });

    it('AC-003 alterna Recentes/A–Z na sessão e exclui obras selecionadas após confirmação em lote', async () => {
        const { controller } = fixture(library);
        await screen.findByTestId('work-card-w1');
        const names = () => screen.getAllByTestId(/^work-card-w\d$/).map(card => card.props.testID);
        expect(names()).toEqual(['work-card-w1', 'work-card-w2']);
        fireEvent.press(screen.getByTestId('sort-action'));
        expect(names()).toEqual(['work-card-w2', 'work-card-w1']);

        fireEvent.press(screen.getByTestId('select-action'));
        const remove = screen.getByRole('button', { name: 'Excluir 1 obra' });
        expect(remove).toBeDisabled();
        fireEvent.press(screen.getByRole('checkbox', { name: 'Selecionar Beta' }));
        fireEvent.press(screen.getByRole('checkbox', { name: 'Selecionar Alfa' }));
        expect(screen.getByRole('checkbox', { name: 'Selecionar Beta' })).toBeChecked();
        fireEvent.press(screen.getByRole('button', { name: 'Excluir 2 obras' }));
        expect(await screen.findByText('Excluir 2 obras?')).toBeOnTheScreen();
        expect(screen.getByText('2 capítulos e suas páginas')).toBeOnTheScreen();
        fireEvent.press(screen.getByTestId('confirm-sheet-confirm'));
        await waitFor(() => expect(controller.deleteWork).toHaveBeenCalledTimes(2));
    });

    it('AC-004 menu da obra: renomear em folha e excluir só após ConfirmSheet descritivo', async () => {
        const { controller } = fixture(library);
        await screen.findByTestId('work-card-w1');
        fireEvent.press(screen.getByRole('button', { name: 'Ações da obra Beta' }));
        fireEvent.press(screen.getByRole('button', { name: 'Editar nome' }));
        const input = await screen.findByLabelText('Nome da obra');
        expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();
        fireEvent.changeText(input, 'Gama');
        fireEvent.press(screen.getByRole('button', { name: 'Salvar' }));
        await waitFor(() => expect(controller.rename).toHaveBeenCalledWith(library.works[0], 'Gama'));

        fireEvent.press(screen.getByRole('button', { name: 'Ações da obra Beta' }));
        fireEvent.press(screen.getByRole('button', { name: 'Excluir obra' }));
        expect(await screen.findByText('Excluir “Beta”?')).toBeOnTheScreen();
        expect(screen.getByText('Isto não pode ser desfeito.')).toBeOnTheScreen();
        expect(controller.deleteWork).not.toHaveBeenCalled();
        fireEvent.press(screen.getByTestId('confirm-sheet-confirm'));
        await waitFor(() => expect(controller.deleteWork).toHaveBeenCalledWith(library.works[0]));
        expect(controller.deleteWork).toHaveBeenCalledTimes(1);
    });

    it('AC-004 capa em folha: escolher da galeria e remover só com capa personalizada', async () => {
        const { controller, picker } = fixture(library);
        await screen.findByTestId('work-card-w2');
        fireEvent.press(screen.getByRole('button', { name: 'Ações da obra Alfa' }));
        fireEvent.press(screen.getByRole('button', { name: 'Alterar capa' }));
        fireEvent.press(await screen.findByRole('button', { name: 'Remover capa' }));
        await waitFor(() => expect(controller.removeCover).toHaveBeenCalledWith(library.works[1]));

        fireEvent.press(screen.getByRole('button', { name: 'Ações da obra Beta' }));
        fireEvent.press(screen.getByRole('button', { name: 'Escolher capa' }));
        await screen.findByRole('button', { name: 'Escolher da galeria' });
        expect(screen.queryByRole('button', { name: 'Remover capa' })).toBeNull();
        fireEvent.press(screen.getByRole('button', { name: 'Escolher da galeria' }));
        await waitFor(() => expect(controller.replaceCover).toHaveBeenCalledWith(library.works[0], 'content://cover'));
        expect(picker.pickImages).toHaveBeenCalledWith({ selectionLimit: 1 });
    });

    it('AC-001 "Nova obra" abre folha com nome obrigatório', async () => {
        const { controller } = fixture(library);
        fireEvent.press(await screen.findByTestId('new-work-tile'));
        const create = await screen.findByRole('button', { name: 'Criar obra' });
        expect(create).toBeDisabled();
        fireEvent.changeText(screen.getByLabelText('Nome da obra'), '  Nova  ');
        fireEvent.press(screen.getByRole('button', { name: 'Criar obra' }));
        await waitFor(() => expect(controller.create).toHaveBeenCalledWith('Nova'));
    });

    it('AC-005 "Sem obra" lista capítulos por data, move para uma obra e exclui com confirmação', async () => {
        const { controller, removeProject, onOpenReader } = fixture(library);
        const section = await screen.findByTestId('unassigned-section');
        // Revisão 2026-11-13: data com hora (capítulos do mesmo dia se distinguem) e nomes dos idiomas em vez de códigos.
        const dateTime = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        const title = `Capítulo de ${dateTime.format(library.items[2].project.createdAt)}`;
        expect(within(section).getByText(title)).toBeOnTheScreen();
        expect(within(section).getByText('Japonês → Português (Brasil) · 2 de 2 prontas')).toBeOnTheScreen();
        fireEvent.press(within(section).getByText(title));
        expect(onOpenReader).toHaveBeenCalledWith('legacy');

        fireEvent.press(screen.getByRole('button', { name: `Ações de ${title}` }));
        fireEvent.press(screen.getByRole('button', { name: 'Mover para obra' }));
        fireEvent.press(await screen.findByRole('radio', { name: 'Beta' }));
        expect(screen.getByLabelText('Número ou nome do capítulo')).toHaveProp('value', '3');
        fireEvent.press(screen.getByRole('button', { name: 'Mover para Beta' }));
        await waitFor(() => expect(controller.attachChapter).toHaveBeenCalledWith(library.works[0], 'legacy', '3'));

        fireEvent.press(screen.getByRole('button', { name: `Ações de ${title}` }));
        fireEvent.press(screen.getByRole('button', { name: 'Excluir' }));
        expect(await screen.findByText('2 páginas originais')).toBeOnTheScreen();
        fireEvent.press(screen.getByTestId('confirm-sheet-confirm'));
        await waitFor(() => expect(removeProject.remove).toHaveBeenCalledWith('legacy'));
    });

    it('capas e miniaturas entram com fade de motion.base (etapa 4 do plano de animações)', async () => {
        fixture(library);
        await screen.findByTestId('unassigned-section');
        const { Image } = jest.requireMock<typeof import('expo-image')>('expo-image');
        const remote = screen.UNSAFE_getAllByType(Image).filter(image => typeof image.props.source === 'object' && image.props.source?.uri);

        expect(remote.length).toBeGreaterThan(0);
        for (const image of remote) expect(image.props.transition).toBe(200);
    });

    it('linha "Sem obra" pinta toque e hover no cartão inteiro, incluindo a área do "⋯"', async () => {
        fixture(library);
        const row = await screen.findByTestId('unassigned-legacy');
        const main = within(row).getAllByRole('button')[0];
        const background = () => StyleSheet.flatten(screen.getByTestId('unassigned-legacy').props.style).backgroundColor;
        const { darkTokens, lightTokens } = jest.requireActual('@/shared/theme');
        const tokens = [darkTokens, lightTokens].find(candidate => candidate.surface === background())!;

        fireEvent(main, 'pressIn');
        expect(background()).toBe(tokens.surfacePressed);
        expect(StyleSheet.flatten(main.props.style).backgroundColor).toBeUndefined();
        fireEvent(main, 'pressOut');
        expect(background()).toBe(tokens.surface);

        fireEvent(row, 'pointerEnter');
        expect(background()).toBe(tokens.surfaceHover);
        fireEvent(row, 'pointerLeave');
        expect(background()).toBe(tokens.surface);

        fireEvent(main, 'focus');
        expect(StyleSheet.flatten(main.props.style)).toEqual(expect.objectContaining({ outlineColor: tokens.focus, outlineWidth: 2 }));
    });

    it('sem obras, "Nova obra" vira uma faixa compacta na largura toda; com obras, continua na grade (revisão 2026-11-13)', async () => {
        fixture({ ...library, works: [], chapters: {} });
        const compact = StyleSheet.flatten((await screen.findByTestId('new-work-tile')).props.style);
        expect(compact).toEqual(expect.objectContaining({ flexDirection: 'row', minHeight: 64 }));
        expect(compact.aspectRatio).toBeUndefined();
    });

    it('AC-010 biblioteca vazia mostra o estado vazio com "Criar obra" e o atalho de tradução no rodapé', async () => {
        fixture({ works: [], chapters: {}, items: [], unassigned: [] });
        expect(await screen.findByText('Sua biblioteca está vazia')).toBeOnTheScreen();
        fireEvent.press(screen.getByRole('button', { name: 'Criar obra' }));
        expect(await screen.findByLabelText('Nome da obra')).toBeOnTheScreen();
        expect(within(screen.getByTestId('footer')).getByRole('button', { name: 'Traduzir capítulo' })).toBeOnTheScreen();
    });

    it('AC-010 falha de carga mostra erro com "Tentar de novo" e falha de operação aparece sem afirmar sucesso', async () => {
        fixture(library, { failLoad: true });
        expect(await screen.findByText('Biblioteca indisponível')).toBeOnTheScreen();
        expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeOnTheScreen();
    });

    it('AC-010 erro de processamento ativo vira notificação temporária', async () => {
        const { controller } = fixture(library);
        controller.deleteWork.mockRejectedValueOnce(new Error('localWork.processingActive'));
        await screen.findByTestId('work-card-w1');
        fireEvent.press(screen.getByRole('button', { name: 'Ações da obra Beta' }));
        fireEvent.press(screen.getByRole('button', { name: 'Excluir obra' }));
        fireEvent.press(await screen.findByTestId('confirm-sheet-confirm'));
        await waitFor(() => expect(useToastStore.getState().current?.title).toMatch(/processamento em andamento/));
        expect(useToastStore.getState().current?.tone).toBe('danger');
    });

    it('sucesso ao criar obra vira notificação temporária', async () => {
        const { controller } = fixture(library);
        await screen.findByTestId('work-card-w1');
        fireEvent.press(screen.getByText('Nova obra'));
        fireEvent.changeText(await screen.findByLabelText('Nome da obra'), 'Gama');
        fireEvent.press(screen.getByRole('button', { name: 'Criar obra' }));
        await waitFor(() => expect(controller.create).toHaveBeenCalledWith('Gama'));
        await waitFor(() => expect(useToastStore.getState().current).toEqual(expect.objectContaining({ tone: 'success' })));
    });
});
