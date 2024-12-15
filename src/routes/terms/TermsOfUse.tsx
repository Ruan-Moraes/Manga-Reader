import Header from '../../layouts/Header';
import Main from '../../layouts/Main';
import Footer from '../../layouts/Footer';

import ParagraphsSection from '../../components/sections/ParagraphsSection';
import SectionTitle from '../../components/titles/SectionTitle';
import Paragraph from '../../components/paragraph/Paragraph';

const TermsOfUse = () => {
  return (
    <>
      <Header disabledSearch={true} />
      <Main>
        <ParagraphsSection>
          <SectionTitle
            titleStyleClasses="text-lg"
            title="Termos de uso e Políticas de privacidade"
            subTitle="Última atualização: XX de XXXXXXXX de XXXX"
          />
          <Paragraph
            title="1. Introdução"
            paragraphContent={[
              {
                text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi. Nullam nec purus non dolor fermentum ultricies. Sed sagittis, justo nec',
              },
              {
                text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi. Nullam nec purus non dolor fermentum ultricies. Sed sagittis, justo nec',
              },
            ]}
          />
          <Paragraph
            title="2. Coleta de informações pessoais"
            paragraphContent={[
              {
                text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi. Nullam nec purus non dolor fermentum ultricies. Sed sagittis, justo nec',
              },
              {
                text: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quam nesciunt dolorem suscipit deserunt, reiciendis cum esse cupiditate mollitia fugit eligendi. Laudantium sequi similique natus dicta doloremque velit earum, nihil exercitationem.',
              },
            ]}
          />
          <Paragraph
            title="3. Uso de informações pessoais"
            paragraphContent={[
              {
                text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi. Nullam nec purus non dolor fermentum ultricies. Sed sagittis, justo nec',
              },
            ]}
          />
          <Paragraph
            title="4. Compartilhamento de informações pessoais"
            paragraphContent={[
              {
                text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi. Nullam nec purus non dolor fermentum ultricies. Sed sagittis, justo nec',
              },
              {
                text: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quam nesciunt dolorem suscipit deserunt, reiciendis cum esse cupiditate mollitia fugit eligendi. Laudantium sequi similique natus dicta doloremque velit earum, nihil exercitationem.',
              },
            ]}
          />
          <Paragraph
            title="5. Cookies e tecnologias semelhantes"
            paragraphContent={[
              {
                text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi. Nullam nec purus non dolor fermentum ultricies. Sed sagittis, justo nec',
              },
              {
                text: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quam nesciunt dolorem suscipit deserunt, reiciendis cum esse cupiditate mollitia fugit eligendi. Laudantium sequi similique natus dicta doloremque velit earum, nihil exercitationem.',
              },
            ]}
          />
        </ParagraphsSection>
      </Main>
      <Footer />
    </>
  );
};

export default TermsOfUse;
