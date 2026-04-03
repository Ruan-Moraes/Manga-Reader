import FormWrapper from '@shared/component/form/FormWrapper';

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
        <FormWrapper
            onFormSubmit={onFormSubmit}
            title={title}
            helperText={helperText}
            link={link}
            linkText={linkText}
        >
            {children}
        </FormWrapper>
    );
};

export default AuthenticationForm;
