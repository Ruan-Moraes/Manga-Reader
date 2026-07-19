import type { LucideIcon } from 'lucide-react';

export interface FooterLink {
    label: string;
    href: string;
    onClick?: (e: React.MouseEvent) => void;
    external?: boolean;
}

export interface FooterColumn {
    title: string;
    links: FooterLink[];
}

export interface FooterAppLink {
    os: 'ios' | 'android';
    label: string;
    osName: string;
    href: string;
    ariaLabel: string;
}

export interface FooterSocialLink {
    name: string;
    href: string;
    icon: LucideIcon;
    ariaLabel: string;
}

export interface FooterStatusInfo {
    title: string;
    meta: string;
    linkLabel?: string;
    href?: string;
    statusAriaLabel?: string;
}

export interface FooterPreferenceItem {
    key: string;
    label: string;
    icon?: LucideIcon;
    value?: string;
    showChevron?: boolean;
    accent?: boolean;
    ariaLabel: string;
    onClick?: () => void;
}

export interface FooterTexts {
    tagline?: string;
    newsletterLabel?: string;
    newsletterPlaceholder?: string;
    newsletterSubmitAria?: string;
    newsletterHint?: string;
    newsletterSuccess?: string;
    appsLabel?: string;
    socialsLabel?: string;
    navAriaLabel?: string;
    expandLabel?: string;
    collapseLabel?: string;
}

export const DEFAULT_TEXTS: Required<FooterTexts> = {
    tagline: 'Leia, descubra e acompanhe seus mangás, manhwas e manhuas favoritos.',
    newsletterLabel: 'Receba os destaques da semana',
    newsletterPlaceholder: 'seu@email.com',
    newsletterSubmitAria: 'Inscrever-se na newsletter',
    newsletterHint: 'Sem spam. Cancele quando quiser.',
    newsletterSuccess: 'Pronto! Você vai receber os destaques toda sexta.',
    appsLabel: 'Baixe o app',
    socialsLabel: 'Siga nas redes',
    navAriaLabel: 'Rodapé',
    expandLabel: 'Expandir seção',
    collapseLabel: 'Recolher seção',
};

export const LINK_CLASSES =
    'group/link relative block py-[7px] pl-3 text-[13px] font-mr-semibold text-mr-fg-muted no-underline transition-[color,padding-left] duration-200 ease-mr ' +
    "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-[10px] before:w-[2px] before:bg-mr-accent before:opacity-0 before:transition-opacity before:duration-200 before:content-[''] " +
    'hover:pl-4 hover:text-mr-accent-fg hover:before:opacity-100 ' +
    'focus-visible:pl-4 focus-visible:text-mr-accent-fg focus-visible:before:opacity-100 focus-visible:outline-2 focus-visible:outline-mr-focus-ring focus-visible:outline-offset-2 rounded-[2px]';

export const COLUMN_DESKTOP_TITLE_CLASSES =
    'relative inline-block pb-[6px] mb-3 text-[11px] font-mr-extrabold uppercase tracking-[0.12em] text-mr-fg ' +
    "after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-6 after:bg-mr-accent after:content-['']";
