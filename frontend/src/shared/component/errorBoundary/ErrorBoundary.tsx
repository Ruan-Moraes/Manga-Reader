import { Component } from 'react';
import type { ReactNode } from 'react';

import ErrorFallback from './ErrorFallback';

import { reportError } from '@shared/service/errorReporting/errorReportingService';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Error Boundary global — captura erros de renderização React.
 *
 * - Envia o erro para o backend via {@link reportError} (fire-and-forget).
 * - Em produção: exibe mensagem amigável ao usuário.
 * - Em desenvolvimento: exibe mensagem amigável + stacktrace.
 */
class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error): void {
        reportError(error.message, error.stack ?? null, 'error-boundary');
    }

    render(): ReactNode {
        if (this.state.hasError && this.state.error) {
            return <ErrorFallback error={this.state.error} />;
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
