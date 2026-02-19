import Header from '@app/layout/Header';
import MainContent from '@/app/layout/Main';
import Footer from '@app/layout/Footer';

import TextSection from '@shared/component/paragraph/TextSection';
import SectionTitle from '@shared/component/title/SectionTitle';
import TextBlock from '@shared/component/paragraph/TextBlock';

import ContactForm from '@shared/component/form/ContactForm';

const PublishWork = () => {
    return (
        <>
            <Header showSearch={true} />
            <MainContent>
                <TextSection>
                    <SectionTitle
                        titleStyleClasses="text-lg"
                        title="Publicar Trabalho"
                    />
                    <TextBlock
                        paragraphContent={[
                            {
                                text: 'Se você é um autor e deseja publicar seu trabalho em nosso site, entre em contato conosco para obter mais informações sobre como enviar seu trabalho para revisão e publicação.',
                            },
                            {
                                text: 'Nós aceitamos mangas, webtoons, fanfics, fanarts, e outros tipos de trabalhos criativos. Se você tem uma história para contar ou uma arte para compartilhar, nós adoraríamos ajudá-lo a compartilhar seu trabalho com o mundo.',
                            },
                        ]}
                    />
                </TextSection>
                <ContactForm />
            </MainContent>
            <Footer showLinks={true} />
        </>
    );
};

export default PublishWork;
