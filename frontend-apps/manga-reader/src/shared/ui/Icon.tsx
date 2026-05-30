import type { LucideIcon, LucideProps } from 'lucide-react';

export type IconSize = 12 | 16 | 20 | 24 | 28;

export interface IconProps extends Omit<LucideProps, 'size'> {
    icon: LucideIcon;
    size?: IconSize;
    /** Decorativo = esconde de leitores de tela. Padrão: true */
    decorative?: boolean;
}

export const Icon = ({ icon: LucideElement, size = 20, decorative = true, ...rest }: IconProps) => (
    <LucideElement width={size} height={size} strokeWidth={2} aria-hidden={decorative || undefined} role={decorative ? undefined : 'img'} {...rest} />
);

export default Icon;
