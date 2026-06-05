import type { LabelHTMLAttributes, ReactNode } from 'react';

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
    required?: boolean;
    children: ReactNode;
}

export const Label = ({ children, required, className, ...rest }: LabelProps) => (
    <label className={`mr-label ${className ?? ''}`} {...rest}>
        {children}
        {required && (
            <span aria-hidden className="ml-0.5 text-mr-danger">
                *
            </span>
        )}
    </label>
);

export default Label;
