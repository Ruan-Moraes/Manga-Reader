import Header from '@app/layout/Header';
import Footer from '@app/layout/Footer';
import MainContent from '@/app/layout/Main';

import TextSection from '@shared/component/paragraph/TextSection';
import SectionTitle from '@shared/component/title/SectionTitle';
import TextBlock from '@shared/component/paragraph/TextBlock';

const AboutUs = () => {
    return (
        <>
            <Header disabledSearch={true} />
            <MainContent>
                <TextSection>
                    <SectionTitle
                        titleStyleClasses="text-lg"
                        title="Quem Somos?"
                    />
                    <TextBlock
                        paragraphContent={[
                            {
                                text: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquid sed deserunt rerum sit inventore iste unde? Ea alias, unde quaerat commodi corrupti ipsum maiores id corporis deleniti numquam facere! Tenetur.',
                            },
                            {
                                text: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquid sed deserunt rerum sit inventore iste unde? Ea alias, unde quaerat commodi corrupti ipsum maiores id corporis deleniti numquam facere! Tenetur.',
                            },
                        ]}
                    />
                    <TextBlock
                        paragraphContent={[
                            {
                                text: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquid sed deserunt rerum sit inventore iste unde? Ea alias, unde quaerat commodi corrupti ipsum maiores id corporis deleniti numquam facere! Tenetur.',
                            },
                            {
                                text: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquid sed deserunt rerum sit inventore iste unde? Ea alias, unde quaerat commodi corrupti ipsum maiores id corporis deleniti numquam facere! Tenetur. Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquid sed deserunt rerum sit inventore iste unde? Ea alias, unde quaerat commodi corrupti ipsum maiores id corporis deleniti numquam facere! Tenetur.',
                            },
                        ]}
                    />
                    <TextBlock
                        paragraphContent={[
                            {
                                text: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquid sed deserunt rerum sit inventore iste unde? Ea alias, unde quaerat commodi corrupti ipsum maiores id corporis deleniti numquam facere! Tenetur.',
                            },
                            {
                                text: 'Lorem ipsum dolor sit amet consectetur adipisicing elit!',
                            },
                        ]}
                    />
                </TextSection>
            </MainContent>
            <Footer />
        </>
    );
};

export default AboutUs;
