import { Link } from 'react-router-dom';

interface IAuthenticationForm {
  title: string;
  helperText?: string;
  onFormSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  linkText?: string;
  linkTo?: string;
  children: React.ReactNode;
}

const AuthenticationForm = ({
  title,
  onFormSubmit,
  helperText,
  linkText,
  linkTo,
  children,
}: IAuthenticationForm) => {
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
      {helperText && linkText && linkTo && (
        <div>
          <p className="text-sm text-center text-tertiary-default">
            {helperText}{' '}
            <Link to={linkTo} className="font-bold underline">
              {linkText}
            </Link>
          </p>
        </div>
      )}
    </div>
  );
};

export default AuthenticationForm;
