import { useState } from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { DEFAULT_TEXT_READER_PREFERENCES } from '@/entities/user-setting';
import i18n from '@/shared/i18n';
import { ThemeProvider } from '@/shared/theme';

import { TextReaderControls } from '../TextReaderControls';

function Harness() {
    const [value, setValue] = useState(DEFAULT_TEXT_READER_PREFERENCES);
    return (
        <ThemeProvider waitForPlatform={false}>
            <TextReaderControls
                value={value}
                onChange={patch => setValue(current => ({ ...current, ...patch }))}
                onReset={() => setValue(DEFAULT_TEXT_READER_PREFERENCES)}
            />
        </ThemeProvider>
    );
}

describe('MOB-FEAT-053 text controls', () => {
    beforeEach(() => i18n.changeLanguage('pt-BR'));
    it('applies selection immediately and resets only its own values', () => {
        const screen = render(<Harness />);
        expect(screen.getByRole('radio', { name: 'Do aplicativo' })).toBeSelected();
        fireEvent.press(screen.getByRole('radio', { name: 'Serifada' }));
        fireEvent.press(screen.getByRole('radio', { name: 'Ampla' }));
        fireEvent.press(screen.getByRole('radio', { name: 'Largas' }));
        fireEvent.press(screen.getByRole('radio', { name: 'Papel' }));
        expect(screen.getByRole('radio', { name: 'Serifada' })).toBeSelected();
        expect(screen.getByRole('radio', { name: 'Ampla' })).toBeSelected();
        expect(screen.getByRole('radio', { name: 'Largas' })).toBeSelected();
        expect(screen.getByRole('radio', { name: 'Papel' })).toBeSelected();
        fireEvent(screen.getByRole('adjustable'), 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
        expect(screen.getByRole('adjustable')).toHaveAccessibilityValue({ min: 16, max: 28, now: 19, text: '19 sp' });
        fireEvent.press(screen.getByRole('button', { name: 'Restaurar ajustes do texto' }));
        expect(screen.getByRole('radio', { name: 'Do aplicativo' })).toBeSelected();
        expect(screen.getByRole('radio', { name: 'Confortável' })).toBeSelected();
        expect(screen.getByRole('adjustable')).toHaveAccessibilityValue({ now: 18 });
    });
    it.each(['pt-BR', 'en-US', 'es-ES'])('has translated text controls in %s', async language => {
        await i18n.changeLanguage(language);
        const screen = render(<Harness />);
        expect(screen.queryAllByText(/^text\./)).toHaveLength(0);
        expect(screen.getAllByRole('radio')).toHaveLength(12);
    });
});
