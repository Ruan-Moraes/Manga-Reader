import Header from '../layouts/Header';
import Main from '../layouts/Main';
import Footer from '../layouts/Footer';

import AuthenticationForm from '../components/form/AuthenticationForm';
import Input from '../components/inputs/Input';
import ButtonHighLight from '../components/buttons/RaisedButton';

const Login = () => {
  return (
    <>
      <Header disabledBreadcrumb={true} disabledSearch={true} />
      <Main>
        <AuthenticationForm
          title="Login de usuário"
          helperText="Não possui uma conta?"
          linkText="Cadastre-se"
          linkTo="/sign-up"
        >
          <Input label="Email" type="email" placeholder="Digite seu email" />
          <Input
            label="Senha:"
            type="password"
            placeholder="Digite sua senha"
          />
          <ButtonHighLight text="Entrar:" />
        </AuthenticationForm>
      </Main>
      <Footer disabledLinks={true} />
    </>
  );
};

export default Login;
