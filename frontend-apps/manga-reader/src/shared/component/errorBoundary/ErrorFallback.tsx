import { useState } from 'react';

interface ErrorFallbackProps {
    error: Error;
}

function ErrorFallback({ error }: ErrorFallbackProps) {
    const isDev = import.meta.env.DEV;

    const [copied, setCopied] = useState(false);

    const handleCopyStack = () => {
        if (!error.stack) return;

        navigator.clipboard.writeText(error.stack).then(() => {
            setCopied(true);

            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-primary-default px-4">
            <div className="flex flex-col w-full min-h-screen max-w-xl py-4 gap-y-4">
                {isDev && (
                    <div>
                        <div className="rounded-xs bg-secondary p-4 text-left">
                            <h3 className="mb-2 text-sm font-bold text-quaternary-default">
                                [DEV] Detalhes do erro
                            </h3>
                            <p className="mb-3 text-sm text-quinary-default">
                                {error.message}
                            </p>
                            {error.stack && (
                                <>
                                    <div className="mb-1 flex items-center justify-between">
                                        <h4 className="text-xs font-bold text-quaternary-default">
                                            Stack Trace
                                        </h4>
                                        <button
                                            onClick={handleCopyStack}
                                            className="rounded-xs border border-tertiary px-2 py-0.5 text-xs text-quaternary-default transition-colors hover:bg-primary-default"
                                        >
                                            {copied ? 'Copiado!' : 'Copiar'}
                                        </button>
                                    </div>
                                    <pre className="max-h-64 overflow-auto rounded-xs bg-primary-default p-3 text-xs text-tertiary">
                                        {error.stack}
                                    </pre>
                                </>
                            )}
                        </div>
                    </div>
                )}
                <div>
                    <div className="flex flex-col items-center justify-center gap-2 rounded-xs border-2 border-quinary-default p-6 text-center">
                        <h2 className="text-xl font-bold text-quinary-default">
                            Ops! Algo deu errado.
                        </h2>
                        <p className="text-xs">
                            Ocorreu um erro inesperado. Estamos trabalhando para
                            solucioná-lo.
                        </p>
                    </div>
                    <div className="mt-3 text-center">
                        <a
                            href="/Manga-Reader"
                            className="text-sm font-bold text-quinary-default transition-all duration-300 hover:text-shadow-highlight"
                        >
                            Voltar à página inicial
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ErrorFallback;
