import Header from '@app/layout/Header';
import Footer from '@app/layout/Footer';
import Main from '@app/layout/Main';

import ParagraphContainer from '@shared/component/paragraph/ParagraphContainer';
import SectionTitle from '@shared/component/title/SectionTitle';
import Paragraph from '@shared/component/paragraph/Paragraph';

const AboutUs = () => {
    return (
        <>
            <Header disabledSearch={true} />
            <Main>
                <ParagraphContainer>
                    <SectionTitle
                        titleStyleClasses="text-lg"
                        title="Quem Somos?"
                    />
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
                </ParagraphContainer>
            </Main>
            <Footer />
        </>
    );
};

export default AboutUs;
