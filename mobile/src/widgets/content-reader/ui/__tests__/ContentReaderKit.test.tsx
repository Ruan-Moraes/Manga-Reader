import { Text } from 'react-native';
import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DEFAULT_USER_SETTINGS, type ReaderSettings } from '@/entities/user-setting';
import i18n from '@/shared/i18n';
import { ThemeProvider } from '@/shared/theme';

import type { ImageSequenceDocument } from '../../model/contentReader';
import { ContentReader, type ContentReaderProps } from '../ContentReader';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

const document: ImageSequenceDocument = {
    kind: 'IMAGE_SEQUENCE',
    id: 'chapter-2',
    title: 'Dois',
    sourceKind: 'REMOTE',
    items: [
        { id: 'p1', primaryUri: 'result-1', originalUri: 'original-1', width: 800, height: 1200 },
        { id: 'p2', primaryUri: 'result-2', originalUri: 'original-2', width: 800, height: 1200 },
        { id: 'p3', primaryUri: 'result-3', originalUri: 'original-3', width: 800, height: 1200 },
    ],
};

const chapters = (onSelect = jest.fn(), currentId = 'chapter-2') => ({
    items: [
        { id: 'chapter-1', title: 'Prólogo' },
        { id: 'chapter-2', title: 'Dois' },
        { id: 'chapter-3', title: 'Três' },
    ],
    currentId,
    onSelect,
});

function reader(props: Partial<ContentReaderProps> = {}, settings: Partial<ReaderSettings> = {}) {
    const onOpenAllSettings = jest.fn();
    render(
        <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, right: 0, bottom: 0, left: 0 } }}>
            <ThemeProvider initialOverride="dark" waitForPlatform={false}>
                <ContentReader
                    document={document}
                    settings={{ ...DEFAULT_USER_SETTINGS.reader, ...settings }}
                    onExit={jest.fn()}
                    settingsSheet={{ content: <Text>quick-settings</Text>, onOpenAllSettings }}
                    {...props}
                />
            </ThemeProvider>
        </SafeAreaProvider>,
    );
    fireEvent(screen.getByTestId('reader-touch-surface'), 'accessibilityAction', { nativeEvent: { actionName: 'activate' } });
    return { onOpenAllSettings };
}

describe('MOB-FEAT-063 leitor no padrão do kit', () => {
    beforeEach(() => i18n.changeLanguage('pt-BR'));

    it('AC-001 barra superior com capítulo, obra, "Ajustes do leitor" e "Lista de capítulos"', () => {
        reader({ subtitle: 'Beta', chapters: chapters() });
        const top = screen.getByTestId('reader-top-bar');
        expect(within(top).getByText('Dois')).toBeOnTheScreen();
        expect(within(top).getByTestId('reader-subtitle')).toHaveTextContent('Beta');
        expect(within(top).getByRole('button', { name: 'Ajustes do leitor' })).toBeOnTheScreen();
        expect(within(top).getByRole('button', { name: 'Lista de capítulos' })).toBeEnabled();
    });

    it('AC-001 lista de capítulos desabilitada com menos de 2 e ausente fora do leitor de obra', () => {
        reader({ chapters: { items: [{ id: 'chapter-2', title: 'Dois' }], currentId: 'chapter-2', onSelect: jest.fn() } });
        expect(screen.getByRole('button', { name: 'Lista de capítulos' })).toBeDisabled();
        screen.unmount();
        reader();
        expect(screen.queryByRole('button', { name: 'Lista de capítulos' })).toBeNull();
        expect(screen.queryByTestId('reader-chapter-row')).toBeOnTheScreen();
        expect(screen.queryByRole('button', { name: 'Capítulo anterior' })).toBeNull();
    });

    it('AC-002 folha com os capítulos, o atual marcado, e escolher outro troca o capítulo', () => {
        const onSelect = jest.fn();
        reader({ chapters: chapters(onSelect) });
        fireEvent.press(screen.getByRole('button', { name: 'Lista de capítulos' }));
        expect(screen.getByText('Capítulos')).toBeOnTheScreen();
        expect(screen.getByRole('radio', { name: 'Dois' })).toBeChecked();
        expect(screen.getByRole('radio', { name: 'Três' })).not.toBeChecked();
        fireEvent.press(screen.getByRole('radio', { name: 'Três' }));
        expect(onSelect).toHaveBeenCalledWith('chapter-3');
    });

    it('filtra capítulos por nome sem acentos e alterna a ordem numérica e alfabética', () => {
        const onSelect = jest.fn();
        reader({
            chapters: {
                currentId: 'two',
                onSelect,
                items: [
                    { id: 'ten', title: 'Capítulo 10' },
                    { id: 'prologue', title: 'Prólogo' },
                    { id: 'two', title: 'Capítulo 2' },
                ],
            },
        });
        fireEvent.press(screen.getByRole('button', { name: 'Lista de capítulos' }));
        const query = screen.getByLabelText('Buscar capítulo por nome');
        fireEvent.changeText(query, 'CAPITULO');
        const order = () => screen.getAllByRole('radio', { name: /^Capítulo / }).map(row => row.props.accessibilityLabel);
        expect(order()).toEqual(['Capítulo 2', 'Capítulo 10']);
        expect(screen.queryByRole('radio', { name: 'Prólogo' })).toBeNull();
        fireEvent.press(screen.getByRole('radio', { name: 'Alfabético' }));
        expect(order()).toEqual(['Capítulo 10', 'Capítulo 2']);
        expect(screen.getByRole('radio', { name: 'Capítulo 2' })).toBeChecked();
        fireEvent.changeText(query, 'inexistente');
        expect(screen.getByText('Nenhum capítulo encontrado.')).toBeOnTheScreen();
        fireEvent.changeText(query, 'prologo');
        fireEvent.press(screen.getByRole('radio', { name: 'Prólogo' }));
        expect(onSelect).toHaveBeenCalledWith('prologue');
    });

    it('AC-003 barra inferior com "p / T" acessível, vizinhos e alternador Traduzido/Original', () => {
        const onSelect = jest.fn();
        reader({ chapters: chapters(onSelect, 'chapter-1') });
        const bottom = screen.getByTestId('reader-bottom-bar');
        expect(within(bottom).getByTestId('reader-current-page')).toHaveTextContent('1 / 3');
        expect(within(bottom).getByTestId('reader-current-page')).toHaveProp('accessibilityLabel', 'Página 1 de 3');
        expect(within(bottom).getByRole('progressbar')).toHaveProp('accessibilityValue', { min: 0, max: 3, now: 1 });
        expect(within(bottom).getByRole('button', { name: 'Capítulo anterior' })).toBeDisabled();
        fireEvent.press(within(bottom).getByRole('button', { name: 'Próximo capítulo' }));
        expect(onSelect).toHaveBeenCalledWith('chapter-2');

        expect(within(bottom).getByRole('radio', { name: 'Traduzido' })).toBeChecked();
        fireEvent.press(within(bottom).getByRole('radio', { name: 'Original' }));
        expect(within(bottom).getByRole('radio', { name: 'Original' })).toBeChecked();
    });

    it('AC-003 rodapé com só duas setas: no paginado viram página e, na borda, trocam de capítulo', () => {
        const onSelect = jest.fn();
        reader({ chapters: chapters(onSelect), location: { itemId: 'p3', index: 2 } }, { mode: 'PAGED', direction: 'LTR' });
        const bottom = screen.getByTestId('reader-bottom-bar');
        const row = screen.getByTestId('reader-chapter-row');
        expect(within(bottom).getAllByRole('button')).toHaveLength(2);
        expect(within(screen.getByTestId('reader-progress-row')).queryAllByRole('button')).toHaveLength(0);
        expect(within(row).getByRole('button', { name: 'Página anterior' })).toBeEnabled();
        fireEvent.press(within(row).getByRole('button', { name: 'Próximo capítulo' }));
        expect(onSelect).toHaveBeenCalledWith('chapter-3');
        expect(within(row).getByTestId('reader-version-toggle')).toBeOnTheScreen();
    });

    it('AC-003 sem resultado traduzido o alternador não aparece', () => {
        reader({ comparison: false });
        expect(screen.queryByTestId('reader-version-toggle')).toBeNull();
    });

    it('AC-008 RTL espelha anterior e próximo', () => {
        reader({ chapters: chapters() }, { mode: 'PAGED', direction: 'RTL' });
        expect(screen.getByTestId('reader-chapter-row')).toHaveStyle({ flexDirection: 'row-reverse' });
    });

    it('AC-004 fim do capítulo vertical: "Ler próximo capítulo" ou "Voltar para a obra"', () => {
        const onSelect = jest.fn();
        const onBack = jest.fn();
        reader({ chapters: chapters(onSelect), endOfChapter: { workTitle: 'Beta', backTarget: 'work', onBack } }, { mode: 'VERTICAL' });
        const end = screen.getByTestId('reader-end-of-chapter');
        expect(within(end).getByText('Próximo: Três')).toBeOnTheScreen();
        fireEvent.press(within(end).getByRole('button', { name: 'Ler próximo capítulo' }));
        expect(onSelect).toHaveBeenCalledWith('chapter-3');
        screen.unmount();

        reader({ chapters: chapters(onSelect, 'chapter-3'), endOfChapter: { workTitle: 'Beta', backTarget: 'work', onBack } }, { mode: 'VERTICAL' });
        expect(screen.getByText('Você está em dia com Beta')).toBeOnTheScreen();
        fireEvent.press(screen.getByRole('button', { name: 'Voltar para a obra' }));
        expect(onBack).toHaveBeenCalled();
    });

    it('AC-004 fim do capítulo só no fluxo vertical', () => {
        reader({ endOfChapter: { backTarget: 'back', onBack: jest.fn() } }, { mode: 'PAGED', direction: 'LTR' });
        expect(screen.queryByTestId('reader-end-of-chapter')).toBeNull();
    });

    it('AC-005 estado bloqueante no modo traduzido; "Ler original" mostra as páginas', () => {
        reader({
            comparison: false,
            blockingState: ({ readOriginal }) => (
                <Text accessibilityRole="button" onPress={readOriginal}>
                    blocked
                </Text>
            ),
        });
        expect(screen.getByTestId('reader-blocking-state')).toBeOnTheScreen();
        expect(screen.queryByTestId('reader-vertical')).toBeNull();
        fireEvent.press(screen.getByText('blocked'));
        expect(screen.queryByTestId('reader-blocking-state')).toBeNull();
        expect(screen.getByTestId('reader-vertical')).toBeOnTheScreen();
        expect(screen.getByRole('radio', { name: 'Original' })).toBeChecked();
    });

    it('AC-006 folha única com título, descrição, fechar e "Todos os ajustes do leitor"', () => {
        const { onOpenAllSettings } = reader();
        fireEvent.press(screen.getByRole('button', { name: 'Ajustes do leitor' }));
        expect(screen.getByText('quick-settings')).toBeOnTheScreen();
        expect(screen.getByTestId('reader-panel-description')).toHaveTextContent('As mudanças valem na hora e ficam salvas nas configurações.');
        expect(screen.queryByRole('tab')).toBeNull();
        expect(screen.queryByRole('button', { name: 'Ver original' })).toBeNull();
        fireEvent.press(within(screen.getByTestId('reader-panel-footer')).getByRole('button', { name: 'Todos os ajustes do leitor' }));
        expect(onOpenAllSettings).toHaveBeenCalled();
    });
});
