import { Link } from 'react-router-dom';

interface IAuthenticationForm {
  title: string;
  helperText: string;
  linkText: string;
  linkTo: string;
  children: React.ReactNode;
}

const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  console.log('Form submitted');
};

const AuthenticationForm = ({
  title,
  helperText,
  linkText,
  linkTo,
  children,
}: IAuthenticationForm) => {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <form onSubmit={handleFormSubmit}>
          <fieldset className="flex flex-col gap-6 p-4 border-2 rounded-sm border-tertiary">
            <legend className="px-2 text-lg font-bold text-shadow-highlight">
              {title}
            </legend>
            {children}
          </fieldset>
        </form>
      </div>
      <div>
        <p className="text-sm text-center text-tertiary-default">
          {helperText}{' '}
          <Link to={linkTo} className="font-bold underline">
            {linkText}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AuthenticationForm;
