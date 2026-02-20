import Header from '@app/layout/Header';
import MainContent from '@/app/layout/Main';
import Footer from '@app/layout/Footer';

import AuthenticationForm from '@shared/component/form/AuthenticationForm';
import BaseInput from '@shared/component/input/BaseInput';
import RaisedButton from '@shared/component/button/RaisedButton';

import useResetPassword from '@feature/auth/hook/useResetPassword';

const ResetPassword = () => {
    const {
        token,
        password,
        confirmPassword,
        isLoading,
        handlePasswordChange,
        handleConfirmPasswordChange,
        handleSubmit,
    } = useResetPassword();

    if (!token) {
        return (
            <>
                <Header showSearch={true} />
                <MainContent>
                    <section className="flex flex-col items-center justify-center gap-4 p-8 mx-auto mt-12 max-w-md text-center">
                        <h2 className="text-2xl font-bold text-shadow-default">
                            Link inválido
                        </h2>
                        <p className="text-sm text-primary-default">
                            O link de recuperação de senha é inválido ou
                            expirou. Solicite um novo link.
                        </p>
                        <a
                            href="/Manga-Reader/forgot-password"
                            className="text-sm font-bold text-link hover:underline"
                        >
                            Solicitar novo link
                        </a>
                    </section>
                </MainContent>
                <Footer showLinks={true} />
            </>
        );
    }

    return (
        <>
            <Header showSearch={true} />
            <MainContent>
                <AuthenticationForm
                    onFormSubmit={handleSubmit}
                    title="Redefinir senha"
                    helperText="Lembrou da senha?"
                    link="/login"
                    linkText="Clique aqui"
                >
                    <BaseInput
                        label="Nova senha"
                        type="password"
                        placeholder="Digite sua nova senha"
                        value={password}
                        onChange={handlePasswordChange}
                        disabled={isLoading}
                    />
                    <BaseInput
                        label="Confirmar senha"
                        type="password"
                        placeholder="Confirme sua nova senha"
                        value={confirmPassword}
                        onChange={handleConfirmPasswordChange}
                        disabled={isLoading}
                    />
                    <RaisedButton
                        text={isLoading ? 'Redefinindo...' : 'Redefinir senha'}
                    />
                </AuthenticationForm>
            </MainContent>
            <Footer showLinks={true} />
        </>
    );
};

export default ResetPassword;
