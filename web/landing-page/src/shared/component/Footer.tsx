import { useTranslation } from 'react-i18next';

import BrandWordmark from '@/shared/component/BrandWordmark';
import Icon from '@/shared/component/Icon';
import { APP_LINKS } from '@/shared/config/appLinks';
import { goToSection } from '@/shared/util/smoothScroll';

interface FooterLinks {
    access: string;
    benefits: string;
    plans: string;
    app: string;
    faq: string;
    help: string;
    contact: string;
    status: string;
    terms: string;
    privacy: string;
    cookies: string;
}
const LANDING_LINKS = new Set(['benefits', 'plans', 'app', 'faq']);

export default function Footer() {
    const { t } = useTranslation();
    const labels = t('footer.links', { returnObjects: true }) as FooterLinks;
    const columns = [
        {
            title: t('footer.colProduct'),
            items: [
                ['access', labels.access],
                ['benefits', labels.benefits],
                ['plans', labels.plans],
                ['app', labels.app],
                ['faq', labels.faq],
            ],
        },
        {
            title: t('footer.colSupport'),
            items: [
                ['help', labels.help],
                ['contact', labels.contact],
                ['status', labels.status],
            ],
        },
        {
            title: t('footer.colLegal'),
            items: [
                ['terms', labels.terms],
                ['privacy', labels.privacy],
                ['cookies', labels.cookies],
            ],
        },
    ];

    return (
        <footer className="relative overflow-hidden bg-primary pt-[60px] pb-8">
            <div className="mx-auto grid w-full max-w-[1240px] gap-[42px] px-[clamp(20px,4vw,32px)] md:grid-cols-[minmax(200px,0.8fr)_minmax(0,2.2fr)] min-[940px]:max-[1327px]:pr-[120px]">
                <div className="max-w-[340px]">
                    <BrandWordmark />
                    <p className="m-[18px_0_0] max-w-[310px] text-[0.875rem] leading-[1.7] text-copy-muted">
                        {t('footer.tagline')}
                    </p>
                </div>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-[30px]">
                    {columns.map(column => (
                        <div key={column.title}>
                            <h2 className="m-[0_0_14px] text-xs font-black uppercase tracking-[0.09em] text-fg">
                                {column.title}
                            </h2>
                            <ul className="m-0 grid list-none gap-1 p-0">
                                {column.items.map(([id, label]) => {
                                    const local = LANDING_LINKS.has(id);
                                    const href = local
                                        ? `#${id}`
                                        : APP_LINKS[
                                              id as keyof typeof APP_LINKS
                                          ];
                                    return (
                                        <li key={id}>
                                            <a
                                                className="inline-flex min-h-11 cursor-pointer items-center rounded px-1 text-[0.875rem] text-copy-muted no-underline transition-colors duration-[180ms] hover:text-accent-fg active:text-accent-fg"
                                                href={href}
                                                onClick={
                                                    local
                                                        ? event => {
                                                              event.preventDefault();
                                                              goToSection(id);
                                                          }
                                                        : undefined
                                                }
                                            >
                                                {label}
                                            </a>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
            <div className="mx-auto mt-10 flex w-full max-w-[1240px] flex-wrap items-center justify-between gap-4 border-t border-border px-[clamp(20px,4vw,32px)] pt-[22px] text-[0.8125rem] text-tertiary min-[940px]:max-[1327px]:pr-[120px]">
                <span>
                    © {new Date().getFullYear()} Manga Reader.{' '}
                    {t('footer.rights')}
                </span>
                <button
                    className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-[9px] border border-border-strong bg-card px-3.5 font-extrabold text-copy shadow-[var(--shadow-floating)] transition-[border-color,color,background-color,box-shadow,translate,scale] duration-[180ms] hover:-translate-y-0.5 hover:border-accent-border hover:text-accent-fg active:translate-y-0 active:scale-[0.98] [&>svg]:-rotate-90 [&>svg]:transition-[rotate,translate] [&>svg]:duration-[180ms] hover:[&>svg]:-translate-y-px active:[&>svg]:translate-y-0"
                    type="button"
                    onClick={() => goToSection('top')}
                >
                    <Icon name="arrowR" size={14} />
                    {t('footer.backToTop')}
                </button>
            </div>
        </footer>
    );
}
