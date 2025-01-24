import CustomLinkBase from '../links/elements/CustomLinkBase';

type AuthenticationFormTypes = {
  onFormSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  title: string;
  children: React.ReactNode;
  helperText?: string;
  href?: string;
  hrefText?: string;
};

const AuthenticationForm = ({
  onFormSubmit,
  title,
  children,
  helperText,
  href,
  hrefText,
}: AuthenticationFormTypes) => {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <form onSubmit={onFormSubmit}>
          <fieldset className="flex flex-col gap-6 p-4 border-2 rounded-sm border-tertiary">
            <legend className="px-2 text-lg font-bold text-shadow-highlight">
              {title}
            </legend>
            {children}
          </fieldset>
        </form>
      </div>
      {helperText && href && hrefText && (
        <div>
          <p className="text-sm text-center text-tertiary-default">
            {helperText}{' '}
            <CustomLinkBase href={href} className="underline" text={hrefText} />
          </p>
        </div>
      )}
    </div>
  );
};

export default AuthenticationForm;
