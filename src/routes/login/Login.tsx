import { useCallback } from 'react';

import Header from '../../layouts/Header';
import Main from '../../layouts/Main';
import Footer from '../../layouts/Footer';

import AuthenticationForm from '../../components/forms/AuthenticationForm';
import BaseInput from '../../components/inputs/BaseInput';
import RaisedButton from '../../components/buttons/RaisedButton';

const Login = () => {
  const handleFormSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      console.log('Formulário enviado');
    },
    []
  );

  return (
    <>
      <Header disabledSearch={true} />
      <Main>
        <AuthenticationForm
          onFormSubmit={handleFormSubmit}
          title="Login de usuário"
          helperText="Esqueceu sua senha?"
          link="/forgot-password"
          linkText="Clique aqui"
        >
          <BaseInput
            label="Email"
            type="email"
            placeholder="Digite seu email"
          />
          <BaseInput
            label="Senha:"
            type="password"
            placeholder="Digite sua senha"
          />
          <RaisedButton text="Entrar:" />
        </AuthenticationForm>
      </Main>
      <Footer disabledLinks={true} />
    </>
  );
};

export default Login;
