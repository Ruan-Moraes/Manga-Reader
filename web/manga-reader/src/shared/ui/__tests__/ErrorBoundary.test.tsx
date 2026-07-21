import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import ErrorBoundary from '../ErrorBoundary';
import { WEB_BASE_URL } from '@shared/constant/WEB_BASE_URL';

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

        if (msg.includes('Error: Uncaught') || msg.includes('The above error occurred')) {
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

        expect(screen.getByText('Content rendered successfully')).toBeInTheDocument();
    });

    it('deve exibir fallback quando ocorre erro de renderizacao', () => {
        render(
            <ErrorBoundary>
                <ThrowingComponent shouldThrow={true} />
            </ErrorBoundary>,
        );

        expect(screen.getByText('Algo saiu do roteiro.')).toBeInTheDocument();
        expect(screen.getByText(/Não foi possível concluir esta página/)).toBeInTheDocument();
        expect(screen.getByText('Voltar ao início')).toBeInTheDocument();
    });

    it('deve chamar reportError com source error-boundary', () => {
        render(
            <ErrorBoundary>
                <ThrowingComponent shouldThrow={true} />
            </ErrorBoundary>,
        );

        expect(mockedReportError).toHaveBeenCalledOnce();
        expect(mockedReportError).toHaveBeenCalledWith('Test rendering error', expect.any(String), 'error-boundary');
    });

    it('deve exibir detalhes do erro em modo dev', () => {
        render(
            <ErrorBoundary>
                <ThrowingComponent shouldThrow={true} />
            </ErrorBoundary>,
        );

        expect(screen.getByText('Detalhes técnicos')).toBeInTheDocument();
        expect(screen.getByText('Test rendering error')).toBeInTheDocument();
        expect(screen.getByText('ErrorBoundary.test.tsx')).toBeInTheDocument();
        expect(screen.getByText(/Linha \d+, coluna \d+/)).toBeInTheDocument();
    });

    it('deve ter link para pagina inicial', () => {
        render(
            <ErrorBoundary>
                <ThrowingComponent shouldThrow={true} />
            </ErrorBoundary>,
        );

        const link = screen.getByText('Voltar ao início');

        expect(link).toHaveAttribute('href', WEB_BASE_URL);
    });
});
