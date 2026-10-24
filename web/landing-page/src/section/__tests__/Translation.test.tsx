import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import Translation from '../Translation';
import i18n from '@/i18n/config';
import { TestProviders } from '@/test/testUtils';

describe('Translation', () => {
    beforeEach(async () => {
        await i18n.changeLanguage('pt-BR');
    });

    it('renders section with translation id, heading and feature cards', () => {
        const { container } = render(
            <TestProviders>
                <Translation />
            </TestProviders>,
        );

        expect(container.querySelector('#translation')).toBeInTheDocument();
        expect(
            screen.getByText('Traduza qualquer obra para o seu idioma'),
        ).toBeInTheDocument();
        expect(
            screen.getByText(/Chega de esperar meses por scans/i),
        ).toBeInTheDocument();

        // 4 Pilares da Tecnologia
        expect(
            screen.getByText('OCR Multilíngue de Alta Precisão'),
        ).toBeInTheDocument();
        expect(
            screen.getByText('Tradução Contextual por IA'),
        ).toBeInTheDocument();
        expect(
            screen.getByText('Reconstrução Visual dos Balões'),
        ).toBeInTheDocument();
        expect(
            screen.getByText('Leitura Fluida e Offline'),
        ).toBeInTheDocument();
        expect(
            container.querySelectorAll('#translation ol > li'),
        ).toHaveLength(9); // 5 pipeline steps + 4 feature cards
    });

    it('toggles between original and translated modes', async () => {
        const user = userEvent.setup();

        render(
            <TestProviders>
                <Translation />
            </TestProviders>,
        );

        // Inicialmente no modo traduzido
        expect(
            screen.getByText(
                'Desculpe a demora! É daqui que a verdadeira batalha começa!',
            ),
        ).toBeInTheDocument();

        const btnOriginal = screen.getByRole('button', { name: 'Original' });
        const btnTranslated = screen.getByRole('button', { name: /Traduzido/i });

        expect(btnTranslated).toHaveAttribute('aria-pressed', 'true');
        expect(btnOriginal).toHaveAttribute('aria-pressed', 'false');

        // Alterna para modo original
        await user.click(btnOriginal);

        expect(btnOriginal).toHaveAttribute('aria-pressed', 'true');
        expect(btnTranslated).toHaveAttribute('aria-pressed', 'false');
        expect(
            screen.getByText('待たせたな！ここからが本当の戦いだ！'),
        ).toBeInTheDocument();
        expect(screen.getByText('OCR Polygon')).toBeInTheDocument();

        // Alterna de volta para traduzido
        await user.click(btnTranslated);
        expect(btnTranslated).toHaveAttribute('aria-pressed', 'true');
        expect(
            screen.getByText(
                'Desculpe a demora! É daqui que a verdadeira batalha começa!',
            ),
        ).toBeInTheDocument();
    });

    it('renders technological OCR approaches and format tabs', () => {
        render(
            <TestProviders>
                <Translation />
            </TestProviders>,
        );

        // Seção de abordagens tecnológicas do OCR
        expect(
            screen.getByText('Abordagens Tecnológicas do Nosso OCR'),
        ).toBeInTheDocument();
        expect(
            screen.getByText('Segmentação Poligonal vs Caixas Rígidas'),
        ).toBeInTheDocument();
        expect(
            screen.getByText(/Detecção Direcional Híbrida/i),
        ).toBeInTheDocument();
        expect(
            screen.getByText(/Filtragem de Diálogo vs Onomatopeias/i),
        ).toBeInTheDocument();
        expect(
            screen.getByText(/Tipografia Adaptativa & Auto-Fit/i),
        ).toBeInTheDocument();

        // Abas de formato
        expect(screen.getByRole('tab', { name: 'Mangá (JA)' })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'Manhwa (KO)' })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'Manhua (ZH)' })).toBeInTheDocument();
    });

    it('toggles inpainting mode showing cleaned speech bubble note', async () => {
        const user = userEvent.setup();

        render(
            <TestProviders>
                <Translation />
            </TestProviders>,
        );

        const btnCleaned = screen.getByRole('button', { name: 'Inpainting' });
        expect(btnCleaned).toHaveAttribute('aria-pressed', 'false');

        await user.click(btnCleaned);
        expect(btnCleaned).toHaveAttribute('aria-pressed', 'true');
        expect(
            screen.getByText(/Texto removido cirurgicamente · Fundo reconstituído/i),
        ).toBeInTheDocument();
    });

    it('switches between comic formats (Manga, Manhwa, Manhua)', async () => {
        const user = userEvent.setup();

        render(
            <TestProviders>
                <Translation />
            </TestProviders>,
        );

        const tabManga = screen.getByRole('tab', { name: 'Mangá (JA)' });
        const tabManhwa = screen.getByRole('tab', { name: 'Manhwa (KO)' });
        const tabManhua = screen.getByRole('tab', { name: 'Manhua (ZH)' });

        expect(tabManga).toHaveAttribute('aria-selected', 'true');

        // Seleciona Manhwa (KO)
        await user.click(tabManhwa);
        expect(tabManhwa).toHaveAttribute('aria-selected', 'true');
        expect(
            screen.getByText('[Sistema] O jogador completou a missão de despertar.'),
        ).toBeInTheDocument();

        // Alterna para modo original do Manhwa
        const btnOriginal = screen.getByRole('button', { name: 'Original' });
        await user.click(btnOriginal);
        expect(
            screen.getByText('[시스템] 플레이어가 각성 퀘스트를 완료했습니다.'),
        ).toBeInTheDocument();
        expect(screen.getByText('Horizontal (Hangul)')).toBeInTheDocument();
        expect(screen.getByText('99.9% Confiança')).toBeInTheDocument();

        // Seleciona Manhua (ZH)
        await user.click(tabManhua);
        expect(tabManhua).toHaveAttribute('aria-selected', 'true');
        expect(
            screen.getByText('这家伙的气息…竟然比刚才更强了！'),
        ).toBeInTheDocument();
        expect(screen.getByText('Horizontal / Colunar (Hanzi)')).toBeInTheDocument();
        expect(screen.getByText('99.5% Confiança')).toBeInTheDocument();
    });

    it('updates content when language changes to en-US and es-ES', async () => {
        render(
            <TestProviders>
                <Translation />
            </TestProviders>,
        );

        expect(
            screen.getByText('Traduza qualquer obra para o seu idioma'),
        ).toBeInTheDocument();

        // Muda para Inglês
        await act(async () => {
            await i18n.changeLanguage('en-US');
        });

        expect(
            screen.getByText('Translate any series into your language'),
        ).toBeInTheDocument();
        expect(
            screen.getByText('High-Precision Multilingual OCR'),
        ).toBeInTheDocument();
        expect(
            screen.getByText('Technological Approaches in Our OCR'),
        ).toBeInTheDocument();
        expect(
            screen.getByText('Polygon Segmentation vs Rigid Boxes'),
        ).toBeInTheDocument();
        expect(
            screen.getByText('Contextual AI Translation'),
        ).toBeInTheDocument();

        // Muda para Espanhol
        await act(async () => {
            await i18n.changeLanguage('es-ES');
        });

        expect(
            screen.getByText('Traduce cualquier obra a tu idioma'),
        ).toBeInTheDocument();
        expect(
            screen.getByText('OCR Multilingüe de Alta Precisión'),
        ).toBeInTheDocument();
        expect(
            screen.getByText('Enfoques Tecnológicos de Nuestro OCR'),
        ).toBeInTheDocument();
        expect(
            screen.getByText('Segmentación Poligonal vs Cajas Rígidas'),
        ).toBeInTheDocument();
    });
});
