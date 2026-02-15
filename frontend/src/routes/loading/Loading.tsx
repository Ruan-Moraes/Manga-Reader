import Header from '../../layouts/Header';
import Main from '../../layouts/Main';
import Footer from '../../layouts/Footer';

const Loading = () => {
    return (
        <>
            <Header />
            <Main className="my-auto">
                <div className="flex flex-col items-center justify-start h-full gap-4">
                    <div className="relative">
                        <span className="loader"></span>
                    </div>
                    <div className="text-center">
                        <h2 className="text-xl font-bold">Carregando...</h2>
                        <p className="text-sm">
                            Por favor, aguarde um momento.
                        </p>
                    </div>
                </div>
            </Main>
            <Footer styles={{ marginTop: 0 }} />
        </>
    );
};

export default Loading;
