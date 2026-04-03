import AppLink from '@shared/component/link/element/AppLink';

type FormWrapperTypes = {
    onFormSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    title: string;
    children: React.ReactNode;
    subtitle?: string;
    helperText?: string;
    link?: string;
    linkText?: string;
};

const FormWrapper = ({
    onFormSubmit,
    title,
    children,
    subtitle,
    helperText,
    link,
    linkText,
}: FormWrapperTypes) => {
    return (
        <div className="flex flex-col gap-2">
            <div>
                <form onSubmit={onFormSubmit}>
                    <fieldset className="flex flex-col gap-6 p-4 border-2 rounded-xs border-tertiary">
                        <legend className="px-2 text-lg font-bold text-shadow-highlight">
                            {title}
                        </legend>
                        {subtitle && (
                            <p className="text-sm text-tertiary-default">
                                {subtitle}
                            </p>
                        )}
                        {children}
                    </fieldset>
                </form>
            </div>
            {helperText && link && linkText && (
                <div>
                    <p className="text-sm text-center text-tertiary-default">
                        {helperText}{' '}
                        <AppLink
                            link={link}
                            className="underline"
                            text={linkText}
                        />
                    </p>
                </div>
            )}
        </div>
    );
};

export default FormWrapper;
