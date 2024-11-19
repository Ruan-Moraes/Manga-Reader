import Header from '../../layouts/Header';
import Main from '../../layouts/Main';
import Footer from '../../layouts/Footer';

import AuthenticationForm from '../../components/form/AuthenticationForm';
import Input from '../../components/inputs/Input';
import ButtonHighLight from '../../components/buttons/RaisedButton';

const ForgotPassword = () => {
  return (
    <>
      <Header disabledSearch={true} disabledBreadcrumb={true} />
      <Main>
        <AuthenticationForm
          title="Recuperação de senha"
          onFormSubmit={() => console.log('Form submitted')}
        >
          <Input label="Email" type="email" placeholder="Digite seu email" />
          <ButtonHighLight text="Recuperar senha" />
        </AuthenticationForm>
      </Main>
      <Footer disabledLinks={true} />
    </>
  );
};

export default ForgotPassword;
