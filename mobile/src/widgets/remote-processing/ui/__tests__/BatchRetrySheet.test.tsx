import { fireEvent, render, screen } from '@testing-library/react-native';

import i18n from '@/shared/i18n';
import { ThemeProvider } from '@/shared/theme';

import { backgroundBatchManager } from '../../model/backgroundBatchManager';
import { BatchRetrySheet } from '../BatchRetrySheet';

let mockBusy = false;
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('../ChapterBatchPanel', () => ({
    ChapterBatchPanel: ({ onActivityChange, renderLayout }: { onActivityChange?: (active: boolean) => void; renderLayout: (content: React.ReactNode, footer: React.ReactNode) => React.ReactNode }) => {
        const React = jest.requireActual<typeof import('react')>('react');
        const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
        React.useEffect(() => onActivityChange?.(mockBusy), [onActivityChange]);
        return renderLayout(<Text>Conteúdo</Text>, <Text>Ações fixas</Text>);
    },
}));

const sheet = (onClose: () => void) =>
    render(
        <ThemeProvider waitForPlatform={false}>
            <BatchRetrySheet visible onClose={onClose} closeLabel="Fechar" title="Tentar de novo" projectId="p1" />
        </ThemeProvider>,
    );

describe('folha de retry do lote (2026-11-10)', () => {
    beforeEach(() => i18n.changeLanguage('pt-BR'));

    it('fecha direto quando nada está sendo enviado', () => {
        mockBusy = false;
        const onClose = jest.fn();
        sheet(onClose);
        expect(screen.getByTestId('bottom-sheet-footer')).toHaveTextContent('Ações fixas');
        fireEvent.press(screen.getByTestId('bottom-sheet-backdrop'));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('durante o envio pede confirmação antes de fechar', () => {
        mockBusy = true;
        const onClose = jest.fn();
        sheet(onClose);
        fireEvent.press(screen.getByTestId('bottom-sheet-backdrop'));
        expect(onClose).not.toHaveBeenCalled();
        expect(screen.getByText('Fechar durante o envio?')).toBeOnTheScreen();
        fireEvent.press(screen.getByTestId('confirm-sheet-confirm'));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('fecha sem interromper quando o serviço e a notificação estão ativos', () => {
        mockBusy = true;
        const current = backgroundBatchManager.getSnapshot();
        const snapshot = { ...current, projectId: 'p1', running: true, notificationActive: true };
        const spy = jest.spyOn(backgroundBatchManager, 'getSnapshot').mockReturnValue(snapshot);
        const onClose = jest.fn();
        sheet(onClose);
        fireEvent.press(screen.getByTestId('bottom-sheet-backdrop'));
        expect(onClose).toHaveBeenCalledTimes(1);
        spy.mockRestore();
    });
});
