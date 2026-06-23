import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@shared/lib/cn';

export type PageContainerSize = 'narrow' | 'default' | 'wide' | 'fluid';
export type PageContainerPaddingY = 'none' | 'sm' | 'md' | 'lg';

export interface PageContainerProps extends HTMLAttributes<HTMLElement> {
    size?: PageContainerSize;
    paddingY?: PageContainerPaddingY;
    asMain?: boolean;
    children: ReactNode;
}

const sizeMap: Record<PageContainerSize, string> = {
    narrow: 'max-w-[720px]',
    default: 'max-w-mr-container',
    wide: 'max-w-[1440px]',
    fluid: 'max-w-none',
};

const paddingYMap: Record<PageContainerPaddingY, string> = {
    none: '',
    sm: 'py-4 md:py-6',
    md: 'py-4 md:py-7',
    lg: 'py-6 md:py-10',
};

export const PageContainer = ({ size = 'default', paddingY = 'md', asMain, children, className, ...rest }: PageContainerProps) => {
    const Comp = asMain ? 'main' : 'div';

    return (
        <Comp
            className={cn('mx-auto w-full px-4 sm:px-5 lg:px-6', sizeMap[size], paddingYMap[paddingY], className)}
            {...(rest as HTMLAttributes<HTMLDivElement>)}
        >
            {children}
        </Comp>
    );
};

export default PageContainer;
