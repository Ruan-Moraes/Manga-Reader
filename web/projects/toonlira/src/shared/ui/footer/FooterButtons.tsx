import { ChevronDown, Download } from 'lucide-react';

import { cn } from '@shared/lib/cn';

import type { FooterAppLink, FooterPreferenceItem, FooterSocialLink } from './footer.types';

export const AppButton = ({ app }: { app: FooterAppLink }) => (
    <a
        href={app.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={app.ariaLabel}
        className="flex-1 inline-flex items-center gap-2 rounded-[2px] border border-ui-gray-700 bg-ui-secondary px-3 py-2 no-underline transition-colors duration-200 hover:border-ui-accent-border"
    >
        <Download className="size-4 text-ui-fg-subtle" aria-hidden="true" />
        <span className="flex flex-col text-left leading-tight ">
            <span className="text-[10px] uppercase tracking-[1px] text-ui-fg-subtle">{app.label}</span>
            <span className="text-[12px] font-ui-bold text-ui-fg">{app.osName}</span>
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
            className="inline-flex size-10 items-center justify-center rounded-[2px] border border-ui-gray-700 bg-ui-secondary text-ui-fg-muted no-underline transition-colors duration-200 hover:border-ui-accent-border hover:text-ui-accent-fg focus-visible:border-ui-accent-border ui-focus-ring"
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
                'inline-flex min-h-[36px] items-center gap-2 rounded-[2px] border px-3 py-1.5 text-[12px] font-ui-semibold transition-colors duration-200',
                'ui-focus-ring',
                accent
                    ? 'border-transparent bg-transparent text-ui-accent-fg'
                    : 'border-ui-gray-700 bg-transparent text-ui-fg-muted hover:border-ui-accent-border hover:text-ui-accent-fg',
            )}
        >
            {Icon && <Icon className="size-[14px]" aria-hidden="true" />}
            <span>{item.label}</span>
            {item.value && <span className="text-ui-fg">{item.value}</span>}
            {item.showChevron && <ChevronDown className="size-[14px]" aria-hidden="true" />}
        </button>
    );
};
