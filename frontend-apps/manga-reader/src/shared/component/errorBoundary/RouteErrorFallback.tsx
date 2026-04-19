import { useRouteError } from 'react-router-dom';

import { reportError } from '@shared/service/errorReporting/errorReportingService';

import ErrorFallback from './ErrorFallback';

/**
 * Fallback para erros capturados pelo React Router.
 *
 * O React Router possui seu próprio error boundary interno que captura
 * erros de renderização em componentes de rota ANTES do ErrorBoundary
 * externo. Este componente é usado como `errorElement` nas rotas para
 * exibir nossa interface customizada e reportar o erro ao backend.
 */
function RouteErrorFallback() {
    const routeError = useRouteError();

    const error =
        routeError instanceof Error
            ? routeError
            : new Error(String(routeError));

    reportError(error.message, error.stack ?? null, 'error-boundary');

    return <ErrorFallback error={error} />;
}

export default RouteErrorFallback;
