import { useTranslation } from 'react-i18next';

export const NAV_IDS = [
    'translation',
    'demo',
    'benefits',
    'plans',
    'app',
    'faq',
] as const;
export type NavId = (typeof NAV_IDS)[number];

interface NavLinksProps {
    variant?: 'desktop' | 'drawer';
    onNav: (id: string) => void;
}

export function NavLinks({ variant = 'desktop', onNav }: NavLinksProps) {
    const { t } = useTranslation();

    const isDrawer = variant === 'drawer';
    const linkClass = isDrawer
        ? 'cursor-pointer border-b border-border py-4 text-[1.05rem] font-extrabold tracking-[0.03em] text-copy no-underline transition-colors hover:text-accent-fg'
        : 'cursor-pointer rounded-lg px-3 py-2 text-[0.8125rem] font-extrabold tracking-[0.03em] text-copy no-underline transition-[color,background-color] duration-[180ms] hover:bg-surface-hover hover:text-accent-fg';

    return (
        <>
            {NAV_IDS.map(id => (
                <a
                    key={id}
                    href={`#${id}`}
                    className={linkClass}
                    onClick={event => {
                        event.preventDefault();
                        onNav(id);
                    }}
                >
                    {t(`nav.${id}`)}
                </a>
            ))}
        </>
    );
}
