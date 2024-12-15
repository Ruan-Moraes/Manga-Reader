import Header from '../../layouts/Header';
import Main from '../../layouts/Main';
import Footer from '../../layouts/Footer';

import ParagraphsSection from '../../components/sections/ParagraphsSection';
import SectionTitle from '../../components/titles/SectionTitle';
import Paragraph from '../../components/paragraph/Paragraph';

import ContactForm from '../../components/forms/ContactForm';

const PublishWork = () => {
  return (
    <>
      <Header disabledSearch={true} />
      <Main>
        <ParagraphsSection>
          <SectionTitle titleStyleClasses="text-lg" title="Publicar Trabalho" />
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
        </ParagraphsSection>
        <ContactForm />
      </Main>
      <Footer disabledLinks={true} />
    </>
  );
};

export default PublishWork;
