import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';

import { lightTokens, ThemeProvider } from '@/shared/theme';

import { StatusChip } from '../StatusChip';

jest.mock('@expo/vector-icons', () => {
    const { View: MockView } = jest.requireActual('react-native');

    return { Ionicons: (props: object) => <MockView {...props} /> };
});

describe('MOB-FEAT-060 StatusChip', () => {
    it.each([
        ['waiting', lightTokens.surfaceMuted, lightTokens.muted, 'time-outline'],
        ['processing', lightTokens.accentSoft, lightTokens.accentText, 'sync-outline'],
        ['saved', lightTokens.successSoft, lightTokens.success, 'checkmark-circle-outline'],
        ['failed', lightTokens.dangerSoft, lightTokens.danger, 'alert-circle-outline'],
        ['uncertain', lightTokens.warnSoft, lightTokens.warn, 'help-circle-outline'],
    ] as const)('AC-011 mostra ícone, rótulo e cor semântica no estado %s', (status, surface, color, icon) => {
        render(
            <ThemeProvider initialOverride="light">
                <StatusChip status={status} label={`Estado ${status}`} />
            </ThemeProvider>,
        );

        const chip = screen.getByTestId('status-chip');
        expect(StyleSheet.flatten(chip.props.style)).toMatchObject({ backgroundColor: surface });
        expect(chip.props.accessibilityLabel).toBe(`Estado ${status}`);
        expect(screen.getByTestId('status-chip-icon', { includeHiddenElements: true }).props).toMatchObject({ name: icon, color });
        expect(screen.getByText(`Estado ${status}`)).toBeTruthy();
    });

    it('AC-011 não depende só da cor: cada estado tem ícone distinto', () => {
        const icons = new Set<string>();
        for (const status of ['waiting', 'processing', 'saved', 'failed', 'uncertain'] as const) {
            const view = render(
                <ThemeProvider initialOverride="light">
                    <StatusChip status={status} label={status} />
                </ThemeProvider>,
            );
            icons.add(screen.getByTestId('status-chip-icon', { includeHiddenElements: true }).props.name);
            view.unmount();
        }
        expect(icons.size).toBe(5);
    });
});
