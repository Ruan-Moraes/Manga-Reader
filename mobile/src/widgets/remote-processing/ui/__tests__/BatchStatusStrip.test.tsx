import { fireEvent, render, screen } from '@testing-library/react-native';

import i18n from '@/shared/i18n';

import { BatchStatusStrip } from '../BatchStatusStrip';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

describe('BatchStatusStrip', () => {
    beforeEach(async () => i18n.changeLanguage('pt-BR'));

    it('shows the page being translated, the queue and the stop action while running', () => {
        const onStop = jest.fn();
        render(<BatchStatusStrip state={{ kind: 'running', page: 4, queued: 2 }} onStop={onStop} />);

        expect(screen.getByText('Traduzindo a página 4')).toBeOnTheScreen();
        expect(screen.getByText('Mais 2 páginas na fila')).toBeOnTheScreen();
        fireEvent.press(screen.getByRole('button', { name: 'Parar após a página atual' }));
        expect(onStop).toHaveBeenCalledTimes(1);
    });

    it('says when the running page is the last one and when no page has started yet', () => {
        const { rerender } = render(<BatchStatusStrip state={{ kind: 'running', page: 5, queued: 0 }} onStop={jest.fn()} />);
        expect(screen.getByText('Última página desta tradução')).toBeOnTheScreen();

        rerender(<BatchStatusStrip state={{ kind: 'running', page: null, queued: 3 }} onStop={jest.fn()} />);
        expect(screen.getByText('Preparando o envio…')).toBeOnTheScreen();
    });

    it('drops the stop action once stopping', () => {
        render(<BatchStatusStrip state={{ kind: 'stopping', page: 2 }} onStop={jest.fn()} />);

        expect(screen.getByText('Parando após a página 2')).toBeOnTheScreen();
        expect(screen.getByText('As páginas na fila não serão enviadas.')).toBeOnTheScreen();
        expect(screen.queryByRole('button')).toBeNull();
    });

    it('pluralizes the completed and failed states', () => {
        const { rerender } = render(<BatchStatusStrip state={{ kind: 'completed', total: 5 }} onStop={jest.fn()} />);
        expect(screen.getByText('Capítulo traduzido')).toBeOnTheScreen();
        expect(screen.getByText('As 5 páginas estão salvas neste aparelho.')).toBeOnTheScreen();

        rerender(<BatchStatusStrip state={{ kind: 'failed', count: 2 }} onStop={jest.fn()} />);
        expect(screen.getByText('2 páginas falharam')).toBeOnTheScreen();
        expect(screen.queryByRole('button')).toBeNull();
    });
});
