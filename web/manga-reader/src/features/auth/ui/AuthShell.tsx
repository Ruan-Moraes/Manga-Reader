import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export interface AuthShellProps {
    eyebrow?: string;
    title: string;
    subtitle?: string;
    children: ReactNode;
    footer?: ReactNode;
}

export const AuthShell = ({ eyebrow, title, subtitle, children, footer }: AuthShellProps) => {
    const { t } = useTranslation('auth');

    const sideFeatures = [t('shell.feature1'), t('shell.feature2'), t('shell.feature3'), t('shell.feature4')];

    return (
        <div className="mx-auto w-full max-w-[880px] px-4 py-6">
            <div className="grid grid-cols-1 overflow-hidden rounded-mr-xs border border-mr-border bg-mr-gray-900 lg:grid-cols-[360px_minmax(0,1fr)]">
                <aside
                    className="relative hidden min-h-[480px] overflow-hidden border-r border-mr-border p-8 lg:block"
                    style={{
                        background: 'linear-gradient(135deg, var(--mr-surface-muted) 0%, var(--mr-surface) 100%)',
                    }}
                >
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0"
                        style={{
                            backgroundImage: 'radial-gradient(circle at 30% 20%, var(--mr-accent-10), transparent 50%)',
                        }}
                    />
                    <div className="relative">
                        <div className="mb-8 flex items-center gap-2.5">
                            <img src={`${import.meta.env.BASE_URL}favicon-64x64.png`} width={32} height={32} alt="" />
                            <span className="font-mr-sans text-[18px] font-mr-extrabold italic tracking-mr-logo text-mr-fg">
                                Manga <span className="text-mr-accent-fg">Reader</span>
                            </span>
                        </div>

                        <div className="mb-2 text-mr-tiny font-mr-extrabold uppercase tracking-[0.12em] text-mr-accent-fg">{t('shell.communityLabel')}</div>
                        <h2 className="mb-4 text-[24px] font-mr-extrabold leading-tight tracking-mr text-mr-fg">{t('shell.communityTitle')}</h2>
                        <p className="mb-6 text-[13px] leading-relaxed text-mr-gray-200">{t('shell.communitySubtitle')}</p>
                        <ul className="flex flex-col gap-2.5">
                            {sideFeatures.map(text => (
                                <li key={text} className="flex items-start gap-2.5 text-mr-small leading-snug text-mr-gray-200">
                                    <span className="mt-0.5 text-[12px] text-mr-accent-fg" aria-hidden>
                                        ▸
                                    </span>
                                    <span>{text}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </aside>
                <main className="px-6 pb-8 pt-7">
                    {eyebrow && <div className="mb-1.5 text-mr-tiny font-mr-extrabold uppercase tracking-[0.12em] text-mr-accent-fg">{eyebrow}</div>}
                    <h1 className="mb-2 text-[clamp(22px,4vw,28px)] font-mr-extrabold leading-tight tracking-mr text-mr-fg">{title}</h1>
                    {subtitle && <p className="mb-6 max-w-[420px] text-[13px] leading-snug text-mr-fg-subtle">{subtitle}</p>}
                    {children}
                    {footer && <div className="mt-6 border-t border-mr-border pt-5 text-center text-[13px] text-mr-fg-subtle">{footer}</div>}
                </main>
            </div>
        </div>
    );
};

export default AuthShell;
