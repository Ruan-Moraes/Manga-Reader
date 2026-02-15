import Header from '@app/layout/Header';
import Main from '@app/layout/Main';
import Footer from '@app/layout/Footer';

import ParagraphContainer from '@shared/component/paragraph/ParagraphContainer';
import SectionTitle from '@shared/component/title/SectionTitle';
import Paragraph from '@shared/component/paragraph/Paragraph';

const Dmca = () => {
    return (
        <>
            <Header disabledSearch={true} />
            <Main>
                <ParagraphContainer>
                    <SectionTitle
                        titleStyleClasses="text-lg"
                        title="Política de Direitos Autorais (DMCA)"
                        subTitle="Última atualização: XX de XXXXXXXX de XXXX"
                    />
                    <Paragraph
                        title="1. Politica de Direitos Autorais"
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
                        title="2. Coleta de informações pessoais"
                        paragraphContent={[
                            {
                                text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi. Nullam nec purus non dolor fermentum ultricies. Sed sagittis, justo nec',
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
                        ]}
                    />
                    <Paragraph
                        title="5. Cookies e tecnologias semelhantes"
                        paragraphContent={[
                            {
                                text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi. Nullam nec purus non dolor fermentum ultricies. Sed sagittis, justo nec',
                            },
                        ]}
                    />
                </ParagraphContainer>
            </Main>
            <Footer />
        </>
    );
};

export default Dmca;
