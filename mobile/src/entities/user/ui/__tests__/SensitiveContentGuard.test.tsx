import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { SensitiveContentGuard } from '@/entities/user';

describe('MOB-FEAT-006 SensitiveContentGuard', () => {
    it('oculta HIDE, mostra SHOW e exige revelação explícita em BLUR', () => {
        const hidden = render(
            <SensitiveContentGuard adult preference="HIDE" revealLabel="Revelar conteúdo">
                <Text>detalhe sensível</Text>
            </SensitiveContentGuard>,
        );
        expect(hidden.queryByText('detalhe sensível')).toBeNull();
        hidden.unmount();

        const blurred = render(
            <SensitiveContentGuard adult preference="BLUR" revealLabel="Revelar conteúdo">
                <Text>detalhe sensível</Text>
            </SensitiveContentGuard>,
        );
        expect(screen.getByLabelText('Revelar conteúdo')).toBeOnTheScreen();
        expect(screen.queryByText('detalhe sensível')).toBeNull();
        fireEvent.press(screen.getByLabelText('Revelar conteúdo'));
        expect(screen.getByText('detalhe sensível')).toBeOnTheScreen();
        blurred.unmount();

        render(
            <SensitiveContentGuard adult preference="SHOW" revealLabel="Revelar conteúdo">
                <Text>detalhe sensível</Text>
            </SensitiveContentGuard>,
        );
        expect(screen.getByText('detalhe sensível')).toBeOnTheScreen();
    });
});
