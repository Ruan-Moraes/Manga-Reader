import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import ErrorBoundary from '../ErrorBoundary';

vi.mock('@shared/service/errorReporting/errorReportingService', () => ({
    reportError: vi.fn(),
}));

import { reportError } from '@shared/service/errorReporting/errorReportingService';

const mockedReportError = vi.mocked(reportError);

function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
    if (shouldThrow) {
        throw new Error('Test rendering error');
    }
    return <div>Content rendered successfully</div>;
}

const originalConsoleError = console.error;

beforeEach(() => {
    vi.clearAllMocks();
    console.error = (...args: unknown[]) => {
        const msg = typeof args[0] === 'string' ? args[0] : '';
        if (
            msg.includes('Error: Uncaught') ||
            msg.includes('The above error occurred')
        ) {
            return;
        }
        originalConsoleError(...args);
    };
});

afterEach(() => {
    console.error = originalConsoleError;
});

describe('ErrorBoundary', () => {
    it('deve renderizar children quando nao ha erro', () => {
        render(
            <ErrorBoundary>
                <ThrowingComponent shouldThrow={false} />
            </ErrorBoundary>,
        );

        expect(
            screen.getByText('Content rendered successfully'),
        ).toBeInTheDocument();
    });

    it('deve exibir fallback quando ocorre erro de renderizacao', () => {
        render(
            <ErrorBoundary>
                <ThrowingComponent shouldThrow={true} />
            </ErrorBoundary>,
        );

        expect(
            screen.getByText('Ops! Algo deu errado.'),
        ).toBeInTheDocument();
        expect(
            screen.getByText(/Ocorreu um erro inesperado/),
        ).toBeInTheDocument();
        expect(
            screen.getByText('Voltar à página inicial'),
        ).toBeInTheDocument();
    });

    it('deve chamar reportError com source error-boundary', () => {
        render(
            <ErrorBoundary>
                <ThrowingComponent shouldThrow={true} />
            </ErrorBoundary>,
        );

        expect(mockedReportError).toHaveBeenCalledOnce();
        expect(mockedReportError).toHaveBeenCalledWith(
            'Test rendering error',
            expect.any(String),
            'error-boundary',
        );
    });

    it('deve exibir detalhes do erro em modo dev', () => {
        render(
            <ErrorBoundary>
                <ThrowingComponent shouldThrow={true} />
            </ErrorBoundary>,
        );

        expect(screen.getByText('[DEV] Detalhes do erro')).toBeInTheDocument();
        expect(screen.getByText('Test rendering error')).toBeInTheDocument();
    });

    it('deve ter link para pagina inicial', () => {
        render(
            <ErrorBoundary>
                <ThrowingComponent shouldThrow={true} />
            </ErrorBoundary>,
        );

        const link = screen.getByText('Voltar à página inicial');
        expect(link).toHaveAttribute('href', '/Manga-Reader');
    });
});
