import Header from '@app/layout/Header';
import Main from '@app/layout/Main';
import Footer from '@app/layout/Footer';

import ParagraphContainer from '@shared/component/paragraph/ParagraphContainer';
import SectionTitle from '@shared/component/title/SectionTitle';
import Paragraph from '@shared/component/paragraph/Paragraph';

import ContactForm from '@shared/component/form/ContactForm';

const PublishWork = () => {
    return (
        <>
            <Header disabledSearch={true} />
            <Main>
                <ParagraphContainer>
                    <SectionTitle
                        titleStyleClasses="text-lg"
                        title="Publicar Trabalho"
                    />
                    <Paragraph
                        paragraphContent={[
                            {
                                text: 'Se você é um autor e deseja publicar seu trabalho em nosso site, entre em contato conosco para obter mais informações sobre como enviar seu trabalho para revisão e publicação.',
                            },
                            {
                                text: 'Nós aceitamos mangas, webtoons, fanfics, fanarts, e outros tipos de trabalhos criativos. Se você tem uma história para contar ou uma arte para compartilhar, nós adoraríamos ajudá-lo a compartilhar seu trabalho com o mundo.',
                            },
                        ]}
                    />
                </ParagraphContainer>
                <ContactForm />
            </Main>
            <Footer disabledLinks={true} />
        </>
    );
};

export default PublishWork;
