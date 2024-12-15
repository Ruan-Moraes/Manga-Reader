import Header from '../../layouts/Header';
import Footer from '../../layouts/Footer';
import Main from '../../layouts/Main';

import ParagraphsSection from '../../components/sections/ParagraphsSection';
import SectionTitle from '../../components/titles/SectionTitle';
import Paragraph from '../../components/paragraph/Paragraph';

const AboutUs = () => {
  return (
    <>
      <Header disabledSearch={true} />
      <Main>
        <ParagraphsSection>
          <SectionTitle titleStyleClasses="text-lg" title="Quem Somos?" />
          <Paragraph
            paragraphContent={[
              {
                text: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquid sed deserunt rerum sit inventore iste unde? Ea alias, unde quaerat commodi corrupti ipsum maiores id corporis deleniti numquam facere! Tenetur.',
              },
              {
                text: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquid sed deserunt rerum sit inventore iste unde? Ea alias, unde quaerat commodi corrupti ipsum maiores id corporis deleniti numquam facere! Tenetur.',
              },
            ]}
          />
          <Paragraph
            paragraphContent={[
              {
                text: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquid sed deserunt rerum sit inventore iste unde? Ea alias, unde quaerat commodi corrupti ipsum maiores id corporis deleniti numquam facere! Tenetur.',
              },
              {
                text: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquid sed deserunt rerum sit inventore iste unde? Ea alias, unde quaerat commodi corrupti ipsum maiores id corporis deleniti numquam facere! Tenetur. Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquid sed deserunt rerum sit inventore iste unde? Ea alias, unde quaerat commodi corrupti ipsum maiores id corporis deleniti numquam facere! Tenetur.',
              },
            ]}
          />
          <Paragraph
            paragraphContent={[
              {
                text: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquid sed deserunt rerum sit inventore iste unde? Ea alias, unde quaerat commodi corrupti ipsum maiores id corporis deleniti numquam facere! Tenetur.',
              },
              {
                text: 'Lorem ipsum dolor sit amet consectetur adipisicing elit!',
              },
            ]}
          />
        </ParagraphsSection>
      </Main>
      <Footer />
    </>
  );
};

export default AboutUs;
