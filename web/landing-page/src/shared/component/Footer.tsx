import { useTranslation } from 'react-i18next';

import Icon from '@/shared/component/Icon';
import LanguageSwitcher from '@/shared/component/LanguageSwitcher';
import { Wordmark } from '@/shared/component/Primitives';

import { goToSection } from '@/shared/util/smoothScroll';

interface FooterLinks {
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

const NAV_IDS = ['benefits', 'plans', 'app', 'faq'];

export default function Footer() {
    const { t } = useTranslation();

    const L = t('footer.links', { returnObjects: true }) as FooterLinks;

    const cols: { title: string; items: [string, string][] }[] = [
        {
            title: t('footer.colProduct'),
            items: [
                ['benefits', L.benefits],
                ['plans', L.plans],
                ['app', L.app],
                ['faq', L.faq],
            ],
        },
        {
            title: t('footer.colSupport'),
            items: [
                ['help', L.help],
                ['contact', L.contact],
                ['status', L.status],
            ],
        },
        {
            title: t('footer.colLegal'),
            items: [
                ['terms', L.terms],
                ['privacy', L.privacy],
                ['cookies', L.cookies],
            ],
        },
    ];

    return (
        <footer className="relative overflow-hidden border-t border-[#2d2d2d] bg-primary px-5 pb-9">
            {/* faixa de acento + glow superior */}
            <div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-0.5"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(221,218,42,0.7), transparent)' }}
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 h-60 w-[min(900px,100%)] -translate-x-1/2"
                style={{
                    top: -120,
                    background: 'radial-gradient(ellipse at center top, rgba(221,218,42,0.06), transparent 65%)',
                }}
            />

            <div
                className="lp-footer-grid relative mx-auto grid max-w-[1200px] grid-cols-1 pt-[60px]"
                style={{ gap: 'clamp(36px,5vw,56px)' }}
            >
                <div className="max-w-[340px]">
                    <Wordmark size={20} />
                    <p className="mt-[18px] max-w-[300px] text-sm leading-relaxed text-[#999]">
                        {t('footer.tagline')}
                    </p>
                    <div className="mt-5 max-w-[210px]">
                        <LanguageSwitcher block />
                    </div>
                </div>
                <div
                    className="grid gap-x-7 gap-y-8"
                    style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}
                >
                    {cols.map(col => (
                        <div key={col.title}>
                            <div className="mb-4 text-xs font-extrabold uppercase tracking-wider text-white">
                                {col.title}
                            </div>
                            <ul className="m-0 flex list-none flex-col gap-3 p-0">
                                {col.items.map(([id, label]) => (
                                    <li key={id}>
                                        <a
                                            href={`#${id}`}
                                            onClick={e => {
                                                e.preventDefault();
                                                if (NAV_IDS.includes(id)) goToSection(id);
                                            }}
                                            className="text-sm tracking-wider text-[#999] no-underline transition-colors hover:text-accent"
                                        >
                                            {label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            <div className="relative mx-auto mt-12 flex max-w-[1200px] flex-wrap items-center justify-between gap-x-5 gap-y-3 border-t border-[#2d2d2d] pt-6">
                <span className="text-[13px] tracking-wider text-tertiary">
                    © {new Date().getFullYear()} Manga Reader. {t('footer.rights')}
                </span>
                <button
                    onClick={() => goToSection('top')}
                    className="inline-flex h-[34px] cursor-pointer items-center gap-2 rounded-xs border border-[#444] bg-transparent px-3.5 text-xs font-bold tracking-wider text-[#cccccc] transition-colors hover:border-accent-muted hover:text-accent"
                >
                    <Icon name="arrowR" size={14} style={{ transform: 'rotate(-90deg)' }} />
                    {t('footer.backToTop')}
                </button>
            </div>
        </footer>
    );
}
