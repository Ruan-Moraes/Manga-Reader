import Header from '../../layouts/Header';
import Main from '../../layouts/Main';
import Footer from '../../layouts/Footer';

import AuthenticationForm from '../../components/form/AuthenticationForm';
import BaseInput from '../../components/inputs/BaseInput';
import ButtonHighLight from '../../components/buttons/RaisedButton';
import Checkbox from '../../components/inputs/CheckboxInput';

const SignUp = () => {
  return (
    <>
      <Header disabledBreadcrumb={true} disabledSearch={true} />
      <Main>
        <AuthenticationForm
          title="Cadastro de usuário"
          onFormSubmit={() => console.log('Form submitted')}
        >
          <BaseInput label="Nome:" type="text" placeholder="Nome de usuário" />
          <BaseInput
            label="Email:"
            type="email"
            placeholder="Digite seu email"
          />
          <BaseInput
            label="Senha:"
            type="password"
            placeholder="Digite sua senha"
          />
          <BaseInput
            label="Confirmar senha:"
            type="password"
            placeholder="Confirme sua senha"
          />
          <div className="flex flex-col gap-2">
            <Checkbox
              labelText="Eu aceito os"
              href="/terms-of-use"
              linkText="Termos de uso."
            />
            <Checkbox
              labelText="Eu aceito as políticas de "
              href="/dmca"
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
