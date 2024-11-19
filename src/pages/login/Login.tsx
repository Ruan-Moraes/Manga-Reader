import Header from '../../layouts/Header';
import Main from '../../layouts/Main';
import Footer from '../../layouts/Footer';

import AuthenticationForm from '../../components/form/AuthenticationForm';
import Input from '../../components/inputs/Input';
import ButtonHighLight from '../../components/buttons/RaisedButton';

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
