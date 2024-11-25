import Header from '../../layouts/Header';
import Main from '../../layouts/Main';
import Footer from '../../layouts/Footer';

import AuthenticationForm from '../../components/form/AuthenticationForm';
import BaseInput from '../../components/inputs/BaseInput';
import RaisedButton from '../../components/buttons/RaisedButton';

const Login = () => {
  return (
    <>
      <Header disabledSearch={true} disabledBreadcrumb={true} />
      <Main>
        <AuthenticationForm
          title="Login de usuário"
          onFormSubmit={() => console.log('Form submitted')}
          helperText="Esqueceu sua senha?"
          linkText="Clique aqui"
          linkTo="/forgot-password"
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
