import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { fireEvent, render, screen, within } from '@testing-library/react-native';

import { ThemeProvider } from '@/shared/theme';

import { ActionSlotOutlet, ActionSlotProvider, PrimaryAction } from '../ActionSlot';
import { StepBar } from '../StepBar';

function Panel({ label }: { label: string }) {
    return (
        <View testID="panel">
            <Text>conteúdo</Text>
            <PrimaryAction>
                <Text>{label}</Text>
            </PrimaryAction>
        </View>
    );
}

describe('MOB-FEAT-056 slot de ação primária', () => {
    it('AC-004 fora de um provedor a ação fica no próprio painel', () => {
        render(<Panel label="Continuar" />);
        expect(within(screen.getByTestId('panel')).getByText('Continuar')).toBeOnTheScreen();
    });

    it('AC-004 dentro do provedor a ação vai para o rodapé e acompanha a etapa visível', () => {
        function Flow() {
            const [step, setStep] = useState(0);
            return (
                <ActionSlotProvider>
                    {step === 0 ? <Panel label="Continuar" /> : <Panel label="Traduzir" />}
                    <View testID="footer">
                        <ActionSlotOutlet />
                    </View>
                    <Pressable accessibilityRole="button" onPress={() => setStep(1)}>
                        <Text>avançar</Text>
                    </Pressable>
                </ActionSlotProvider>
            );
        }
        render(<Flow />);
        expect(within(screen.getByTestId('panel')).queryByText('Continuar')).toBeNull();
        expect(within(screen.getByTestId('footer')).getByText('Continuar')).toBeOnTheScreen();
        fireEvent.press(screen.getByText('avançar'));
        expect(within(screen.getByTestId('footer')).getByText('Traduzir')).toBeOnTheScreen();
        expect(within(screen.getByTestId('footer')).queryByText('Continuar')).toBeNull();
    });

    it('AC-004 sem painel registrado o rodapé mostra o fallback', () => {
        render(
            <ActionSlotProvider>
                <ActionSlotOutlet fallback={<Text>padrão</Text>} />
            </ActionSlotProvider>,
        );
        expect(screen.getByText('padrão')).toBeOnTheScreen();
    });
});

describe('MOB-FEAT-056 StepBar', () => {
    it('AC-004 mostra "Etapa N de 3" com o nome do passo e expõe progressbar', () => {
        render(
            <ThemeProvider waitForPlatform={false}>
                <StepBar steps={['Páginas', 'Idiomas', 'Traduzir']} currentIndex={1} counterLabel="Etapa 2 de 3" />
            </ThemeProvider>,
        );
        const bar = screen.getByTestId('step-bar');
        expect(bar).toHaveProp('accessibilityRole', 'progressbar');
        expect(bar).toHaveProp('accessibilityLabel', 'Etapa 2 de 3: Idiomas');
        expect(bar).toHaveProp('accessibilityValue', { min: 1, max: 3, now: 2 });
        expect(screen.getAllByTestId(/^step-bar-segment-/)).toHaveLength(3);
    });
});
