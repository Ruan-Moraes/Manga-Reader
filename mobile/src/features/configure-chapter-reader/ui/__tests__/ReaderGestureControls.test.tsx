import { useState } from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { DEFAULT_READER_GESTURES } from '@/entities/user-setting';
import i18n from '@/shared/i18n';
import { ThemeProvider } from '@/shared/theme';

import { ReaderGestureControls } from '../ReaderGestureControls';

function Harness({ available }: { available: boolean }) {
    const [value, setValue] = useState(DEFAULT_READER_GESTURES);
    return (
        <ThemeProvider waitForPlatform={false}>
            <ReaderGestureControls value={value} onChange={patch => setValue(current => ({ ...current, ...patch }))} sideNavigationAvailable={available} />
        </ThemeProvider>
    );
}
describe('MOB-FEAT-052 gesture preferences', () => {
    beforeEach(() => i18n.changeLanguage('pt-BR'));
    it('selects one method immediately and explains the visible exception', () => {
        const screen = render(<Harness available />);
        expect(screen.getByRole('radio', { name: 'Toque ou deslize' })).toBeSelected();
        fireEvent.press(screen.getByRole('radio', { name: 'Manter controles visíveis' }));
        expect(screen.getByRole('radio', { name: 'Manter controles visíveis' })).toBeSelected();
        expect(screen.getByRole('radio', { name: 'Toque ou deslize' })).not.toBeSelected();
        expect(screen.getByText(/volta a mostrar após a desaceleração/)).toBeTruthy();
    });
    it('disables unsupported side navigation and retains choice across availability changes', () => {
        const screen = render(<Harness available />);
        const toggle = screen.getByRole('switch', { name: 'Áreas laterais de toque' });
        fireEvent(toggle, 'valueChange', true);
        expect(screen.getByRole('switch', { name: 'Áreas laterais de toque' })).toBeChecked();
        screen.rerender(<Harness available={false} />);
        expect(screen.getByRole('switch', { name: 'Áreas laterais de toque' })).toBeDisabled();
        screen.rerender(<Harness available />);
        expect(screen.getByRole('switch', { name: 'Áreas laterais de toque' })).toBeChecked();
    });
});

it('mantém descrição selecionada, indisponibilidade e retry na apresentação compacta', () => {
    const retry = jest.fn();
    const screen = render(
        <ThemeProvider waitForPlatform={false}>
            <ReaderGestureControls
                compact
                value={DEFAULT_READER_GESTURES}
                onChange={jest.fn()}
                sideNavigationAvailable={false}
                persistenceError
                onRetry={retry}
            />
        </ThemeProvider>,
    );
    expect(screen.getByRole('switch', { name: 'Áreas laterais de toque' })).toBeDisabled();
    expect(screen.getByText(i18n.t('reader:gestures.descriptions.TAP_OR_SWIPE'))).toBeOnTheScreen();
    expect(screen.queryByText(i18n.t('reader:gestures.descriptions.TAP'))).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: i18n.t('reader:gestures.retry') }));
    expect(retry).toHaveBeenCalledTimes(1);
});
