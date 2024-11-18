import Header from '../layouts/Header';
import Main from '../layouts/Main';
import Footer from '../layouts/Footer';

import AuthenticationForm from '../components/form/AuthenticationForm';
import Input from '../components/inputs/Input';
import ButtonHighLight from '../components/buttons/RaisedButton';
import Checkbox from '../components/inputs/CheckboxInput';

const SignUp = () => {
  return (
    <>
      <Header disabledBreadcrumb={true} disabledSearch={true} />
      <Main>
        <AuthenticationForm
          title="Cadastro de usuário"
          helperText="Já possui uma conta?"
          linkText="Faça login"
          linkTo="/login"
        >
          <Input label="Nome:" type="text" placeholder="Nome de usuário" />
          <Input label="Email:" type="email" placeholder="Digite seu email" />
          <Input
            label="Senha:"
            type="password"
            placeholder="Digite sua senha"
          />
          <Input
            label="Confirmar senha:"
            type="password"
            placeholder="Confirme sua senha"
          />
          <div className="flex flex-col gap-2">
            <Checkbox
              labelText="Eu aceito os"
              linkTo="/terms-of-use"
              linkText="Termos de uso."
            />
            <Checkbox
              labelText="Eu aceito as políticas de "
              linkTo="/dmca"
              linkText="DMCA."
            />
          </div>
          <ButtonHighLight text="Cadastrar" />
        </AuthenticationForm>
      </Main>
      <Footer disabledLinks={true} />
    </>
  );
};

export default SignUp;
