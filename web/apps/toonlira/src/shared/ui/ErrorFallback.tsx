import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Check, ChevronDown, Clipboard, Home, RefreshCw } from 'lucide-react';

import { WEB_BASE_URL } from '@shared/constant/WEB_BASE_URL';
import { getErrorLocation, getFileName } from '@shared/lib/errorLocation';

import { Button } from './Button';

interface ErrorFallbackProps {
    error: Error;
}

const COPIED_FEEDBACK_MS = 2000;

function ErrorFallback({ error }: ErrorFallbackProps) {
    const { t } = useTranslation('common');
    const [copied, setCopied] = useState(false);
    const location = useMemo(() => getErrorLocation(error.stack), [error.stack]);
    const diagnostic = [error.name + ': ' + error.message, location && `${location.file}:${location.line}:${location.column}`, error.stack]
        .filter(Boolean)
        .join('\n\n');

    const handleCopyDiagnostic = async () => {
        if (!navigator.clipboard) return;

        try {
            await navigator.clipboard.writeText(diagnostic);
            setCopied(true);
            window.setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
        } catch {
            setCopied(false);
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-ui-primary px-4 py-8">
            <section className="w-full max-w-2xl overflow-hidden rounded-ui-lg border border-ui-separator bg-ui-surface shadow-ui-elevated">
                <div className="h-1.5 bg-ui-danger" />
                <div className="p-6 sm:p-10">
                    <div className="mb-6 flex size-14 items-center justify-center rounded-full bg-ui-danger-15 text-ui-danger">
                        <AlertTriangle className="size-7" aria-hidden="true" />
                    </div>
                    <p className="mb-2 text-ui-small font-ui-bold uppercase tracking-mr text-ui-danger">{t('errorPage.eyebrow')}</p>
                    <h1 className="text-ui-h2 font-ui-extrabold text-ui-fg">{t('errorPage.title')}</h1>
                    <p className="mt-3 max-w-xl text-ui-body text-ui-fg-muted">{t('errorPage.description')}</p>

                    <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                        <Button variant="primary" icon={RefreshCw} onClick={() => window.location.reload()}>
                            {t('errorPage.reload')}
                        </Button>
                        <a href={WEB_BASE_URL} className="inline-flex min-h-10 items-center justify-center gap-ui-sm rounded-ui-xs border border-ui-tertiary bg-ui-surface px-4 text-ui-body font-ui-bold text-ui-fg transition-colors hover:bg-ui-accent-25 ui-focus-ring">
                            <Home className="size-4" aria-hidden="true" />
                            {t('errorPage.goHome')}
                        </a>
                    </div>

                    {import.meta.env.DEV && (
                        <details className="group mt-8 overflow-hidden rounded-ui-md border border-ui-separator bg-ui-primary">
                            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 font-ui-bold text-ui-fg marker:hidden">
                                <span>{t('errorPage.technicalDetails')}</span>
                                <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
                            </summary>
                            <div className="border-t border-ui-separator p-4">
                                <dl className="grid gap-4 text-ui-small sm:grid-cols-3">
                                    <div className="sm:col-span-3"><dt className="text-ui-fg-subtle">{t('errorPage.message')}</dt><dd className="mt-1 break-words font-mono text-ui-danger">{error.message}</dd></div>
                                    <div className="sm:col-span-2"><dt className="text-ui-fg-subtle">{t('errorPage.file')}</dt><dd className="mt-1 break-all font-mono text-ui-fg" title={location?.file}>{location ? getFileName(location.file) : t('errorPage.unavailable')}</dd></div>
                                    <div><dt className="text-ui-fg-subtle">{t('errorPage.position')}</dt><dd className="mt-1 font-mono text-ui-fg">{location ? t('errorPage.lineColumn', { line: location.line, column: location.column }) : t('errorPage.unavailable')}</dd></div>
                                </dl>
                                {error.stack && <pre className="mt-4 max-h-56 overflow-auto rounded-ui-xs bg-ui-secondary p-3 text-ui-tiny text-ui-fg-muted">{error.stack}</pre>}
                                <Button className="mt-4" size="sm" variant="ghost" icon={copied ? Check : Clipboard} onClick={handleCopyDiagnostic}>
                                    {copied ? t('errorPage.copied') : t('errorPage.copyDiagnostic')}
                                </Button>
                            </div>
                        </details>
                    )}
                </div>
            </section>
        </main>
    );
}

export default ErrorFallback;
