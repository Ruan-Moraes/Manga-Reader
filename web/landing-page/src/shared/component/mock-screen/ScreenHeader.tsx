import type { ReactNode } from 'react';

export interface ScreenHeaderProps {
    children: ReactNode;
    action?: string;
}

export function ScreenHeader({ children, action }: ScreenHeaderProps) {
    return (
        <div className="mb-[11px] flex items-baseline justify-between">
            <h4 className="m-0 text-sm font-extrabold tracking-[.0625rem] text-fg">
                {children}
            </h4>
            {action && (
                <span className="text-[11px] font-bold text-accent-fg">
                    {action}
                </span>
            )}
        </div>
    );
}

export default ScreenHeader;
