import type {
    AnchorHTMLAttributes,
    ButtonHTMLAttributes,
    ReactNode,
} from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface CommonProps {
    children: ReactNode;
    className?: string;
    icon?: ReactNode;
    iconAfter?: ReactNode;
    size?: ButtonSize;
    variant?: ButtonVariant;
}

type NativeButtonProps = CommonProps &
    ButtonHTMLAttributes<HTMLButtonElement> & {
        href?: never;
    };

type LinkButtonProps = CommonProps &
    AnchorHTMLAttributes<HTMLAnchorElement> & {
        href: string;
    };

export type ButtonProps = NativeButtonProps | LinkButtonProps;

const VARIANT_CLASS: Record<ButtonVariant, string> = {
    primary:
        'border-accent bg-accent text-on-accent shadow-[0_8px_22px_rgb(221_218_42_/_16%)] hover:border-accent-hover hover:bg-accent-hover hover:shadow-[0_12px_30px_rgb(221_218_42_/_25%)]',
    secondary:
        'border-border-strong bg-surface text-fg shadow-[0_8px_22px_rgb(0_0_0_/_14%)] hover:border-accent-border hover:bg-surface-hover hover:shadow-[0_12px_26px_rgb(0_0_0_/_18%)]',
    outline:
        'border-accent-border/60 bg-accent-5 text-fg hover:border-accent-border hover:bg-accent-subtle hover:text-accent-fg hover:shadow-[0_10px_26px_rgb(221_218_42_/_10%)]',
    ghost: 'border-transparent bg-card text-copy hover:border-line hover:bg-surface-hover hover:text-accent-fg',
};

const SIZE_CLASS: Record<ButtonSize, string> = {
    sm: 'min-h-11 px-4 text-[0.8125rem]',
    md: 'min-h-12 px-[22px] text-[0.9375rem]',
    lg: 'min-h-[54px] px-7 text-base',
};

export default function Button({
    children,
    className = '',
    icon,
    iconAfter,
    size = 'md',
    variant = 'primary',
    ...props
}: ButtonProps) {
    const classes = `relative inline-flex min-w-0 cursor-pointer items-center justify-center gap-[9px] rounded-[10px] border text-center font-extrabold leading-none tracking-[0.04em] whitespace-nowrap no-underline transition-[translate,scale,border-color,background-color,color,box-shadow,opacity] duration-[180ms] ease-out hover:not-disabled:-translate-y-0.5 active:not-disabled:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none ${VARIANT_CLASS[variant]} ${SIZE_CLASS[size]} ${className}`;
    const content = (
        <>
            {icon}
            <span>{children}</span>
            {iconAfter}
        </>
    );

    if ('href' in props && props.href) {
        return (
            <a {...props} className={classes}>
                {content}
            </a>
        );
    }

    return (
        <button
            {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}
            className={classes}
        >
            {content}
        </button>
    );
}
