import Header from '@app/layout/Header';
import MainContent from '@/app/layout/Main';
import Footer from '@app/layout/Footer';

import AuthenticationForm from '@shared/component/form/AuthenticationForm';
import BaseInput from '@shared/component/input/BaseInput';
import RaisedButton from '@shared/component/button/RaisedButton';

import useForgotPassword from '@feature/auth/hook/useForgotPassword';

const ForgotPassword = () => {
    const { email, isLoading, isSubmitted, handleEmailChange, handleSubmit } =
        useForgotPassword();

    return (
        <>
            <Header showSearch={true} />
            <MainContent>
                {isSubmitted ? (
                    <section className="flex flex-col items-center justify-center max-w-md gap-4 p-8 mx-auto mt-12 text-center">
                        <h2 className="text-2xl font-bold text-shadow-default">
                            Email enviado!
                        </h2>
                        <p className="text-sm">
                            Se o email informado estiver cadastrado, você
                            receberá um link para redefinir sua senha. Verifique
                            sua caixa de entrada e spam.
                        </p>
                        <a
                            href="/Manga-Reader/login"
                            className="text-sm font-bold text-link hover:underline"
                        >
                            Voltar para o login
                        </a>
                    </section>
                ) : (
                    <AuthenticationForm
                        onFormSubmit={handleSubmit}
                        title="Recuperação de senha"
                        helperText="Lembrou da senha?"
                        link="/login"
                        linkText="Clique aqui"
                    >
                        <BaseInput
                            label="Email"
                            type="email"
                            placeholder="Digite seu email"
                            value={email}
                            onChange={handleEmailChange}
                            disabled={isLoading}
                        />
                        <RaisedButton
                            text={isLoading ? 'Enviando...' : 'Recuperar senha'}
                        />
                    </AuthenticationForm>
                )}
            </MainContent>
            <Footer showLinks={true} />
        </>
    );
};

export default ForgotPassword;
