import { Switch } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import { DEFAULT_USER_SETTINGS } from '@/src/entities/user-setting';
import { ThemeProvider } from '@/src/shared/theme';

import { ReaderSettingsControls } from '../ReaderSettingsControls';

describe('MOB-FEAT-031 reader settings controls', () => {
    it('combina entradas adequadas e emite apenas o patch alterado', () => {
        const onChange = jest.fn();
        const view = render(
            <ThemeProvider waitForPlatform={false}>
                <ReaderSettingsControls capabilities={{ high: true, low: true, medium: true }} onChange={onChange} value={DEFAULT_USER_SETTINGS.reader} />
            </ThemeProvider>,
        );

        fireEvent.press(view.getByRole('radio', { name: 'Paginado' }));
        fireEvent(view.getByRole('adjustable', { name: 'Saturação' }), 'accessibilityAction', {
            nativeEvent: { actionName: 'decrement' },
        });
        fireEvent.press(view.getByRole('button', { name: 'Aumentar Espaçamento' }));
        fireEvent(view.UNSAFE_getByType(Switch), 'valueChange', false);

        expect(onChange).toHaveBeenCalledWith({ mode: 'PAGED' });
        expect(onChange).toHaveBeenCalledWith({ saturation: 95 });
        expect(onChange).toHaveBeenCalledWith({ gap: 1 });
        expect(onChange).toHaveBeenCalledWith({ autoMarkRead: false });
        expect(view.getByRole('button', { name: 'Qualidade: Automática' })).toBeOnTheScreen();
        expect(['Preto', 'Escuro', 'Papel', 'Claro', 'Branco'].map(name => view.getByRole('radio', { name }))).toHaveLength(5);
    });

    it('mapeia direção, ajuste, qualidade, fundo e preload para patches independentes', () => {
        const onChange = jest.fn();
        const view = render(
            <ThemeProvider waitForPlatform={false}>
                <ReaderSettingsControls capabilities={{ high: true, low: true, medium: true }} onChange={onChange} value={DEFAULT_USER_SETTINGS.reader} />
            </ThemeProvider>,
        );

        fireEvent.press(view.getByRole('radio', { name: 'Webtoon' }));
        fireEvent.press(view.getByRole('radio', { name: 'Altura' }));
        fireEvent.press(view.getByRole('button', { name: 'Qualidade: Automática' }));
        expect(view.getByText('Prioriza nitidez com maior uso de dados.')).toBeOnTheScreen();
        fireEvent.press(view.getByRole('radio', { name: 'Alta' }));
        fireEvent.press(view.getByRole('radio', { name: 'Papel' }));
        fireEvent.press(view.getByRole('button', { name: 'Aumentar Pré-carregamento' }));

        expect(onChange).toHaveBeenCalledWith({ direction: 'WEBTOON' });
        expect(onChange).toHaveBeenCalledWith({ fit: 'HEIGHT' });
        expect(onChange).toHaveBeenCalledWith({ quality: 'HIGH' });
        expect(onChange).toHaveBeenCalledWith({ background: 'PAPER' });
        expect(onChange).toHaveBeenCalledWith({ preload: 4 });
    });
});
