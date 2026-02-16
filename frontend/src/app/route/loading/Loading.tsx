import Header from '@app/layout/Header';
import MainContent from '@/app/layout/Main';
import Footer from '@app/layout/Footer';

const Loading = () => {
    return (
        <>
            <Header />
            <MainContent className="my-auto">
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
            </MainContent>
            <Footer styles={{ marginTop: 0 }} />
        </>
    );
};

export default Loading;
