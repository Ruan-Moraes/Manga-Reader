import { ChevronDown, Download } from 'lucide-react';

import { cn } from '@shared/lib/cn';

import type { FooterAppLink, FooterPreferenceItem, FooterSocialLink } from './footer.types';

export const AppButton = ({ app }: { app: FooterAppLink }) => (
    <a
        href={app.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={app.ariaLabel}
        className="flex-1 inline-flex items-center gap-2 rounded-[2px] border border-mr-gray-700 bg-mr-secondary px-3 py-2 no-underline transition-colors duration-200 hover:border-mr-accent"
    >
        <Download className="size-4 text-mr-fg-subtle" aria-hidden="true" />
        <span className="flex flex-col text-left leading-tight ">
            <span className="text-[10px] uppercase tracking-[1px] text-mr-fg-subtle">{app.label}</span>
            <span className="text-[12px] font-mr-bold text-mr-fg">{app.osName}</span>
        </span>
    </a>
);

export const SocialButton = ({ social }: { social: FooterSocialLink }) => {
    const Icon = social.icon;

    return (
        <a
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={social.ariaLabel}
            className="inline-flex size-10 items-center justify-center rounded-[2px] border border-mr-gray-700 bg-mr-secondary text-mr-fg-muted no-underline transition-colors duration-200 hover:border-mr-accent hover:text-mr-accent focus-visible:border-mr-accent focus-visible:outline-2 focus-visible:outline-mr-accent focus-visible:outline-offset-2"
        >
            <Icon className="size-[18px]" aria-hidden="true" />
        </a>
    );
};

export const PreferenceButton = ({ item }: { item: FooterPreferenceItem }) => {
    const Icon = item.icon;
    const accent = item.accent;

    return (
        <button
            type="button"
            onClick={item.onClick}
            aria-label={item.ariaLabel}
            className={cn(
                'inline-flex min-h-[36px] items-center gap-2 rounded-[2px] border px-3 py-1.5 text-[12px] font-mr-semibold transition-colors duration-200',
                'focus-visible:outline-2 focus-visible:outline-mr-accent focus-visible:outline-offset-2',
                accent
                    ? 'border-transparent bg-transparent text-mr-accent'
                    : 'border-mr-gray-700 bg-transparent text-mr-fg-muted hover:border-mr-accent hover:text-mr-accent',
            )}
        >
            {Icon && <Icon className="size-[14px]" aria-hidden="true" />}
            <span>{item.label}</span>
            {item.value && <span className="text-mr-fg">{item.value}</span>}
            {item.showChevron && <ChevronDown className="size-[14px]" aria-hidden="true" />}
        </button>
    );
};
