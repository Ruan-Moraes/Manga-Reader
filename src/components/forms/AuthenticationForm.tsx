import CustomLink from '../links/elements/CustomLink';

type AuthenticationFormTypes = {
    onFormSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    title: string;
    children: React.ReactNode;
    helperText?: string;
    link?: string;
    linkText?: string;
};

const AuthenticationForm = ({
                                onFormSubmit,
                                title,
                                children,
                                helperText,
                                link,
                                linkText,
                            }: AuthenticationFormTypes) => {
    return (
        <div className="flex flex-col gap-2">
            <div>
                <form onSubmit={onFormSubmit}>
                    <fieldset className="flex flex-col gap-6 p-4 border-2 rounded-xs border-tertiary">
                        <legend className="px-2 text-lg font-bold text-shadow-highlight">
                            {title}
                        </legend>
                        {children}
                    </fieldset>
                </form>
            </div>
            {helperText && link && linkText && (
                <div>
                    <p className="text-sm text-center text-tertiary-default">
                        {helperText}{' '}
                        <CustomLink link={link} className="underline" text={linkText}/>
                    </p>
                </div>
            )}
        </div>
    );
};

export default AuthenticationForm;
