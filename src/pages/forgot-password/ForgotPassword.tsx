import Header from '../../layouts/Header';
import Main from '../../layouts/Main';
import Footer from '../../layouts/Footer';

import AuthenticationForm from '../../components/form/AuthenticationForm';
import BaseInput from '../../components/inputs/BaseInput';
import RaisedButton from '../../components/buttons/RaisedButton';

const ForgotPassword = () => {
  return (
    <>
      <Header disabledSearch={true} disabledBreadcrumb={true} />
      <Main>
        <AuthenticationForm
          title="Recuperação de senha"
          onFormSubmit={(e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();

            console.log('Form submitted');
          }}
          helperText="Lembrou da senha?"
          linkText="Clique aqui"
          href="/login"
        >
          <BaseInput
            label="Email"
            type="email"
            placeholder="Digite seu email"
          />
          <RaisedButton text="Recuperar senha" />
        </AuthenticationForm>
      </Main>
      <Footer disabledLinks={true} />
    </>
  );
};

export default ForgotPassword;
