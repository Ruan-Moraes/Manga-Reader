import Header from '@app/layout/Header';
import MainContent from '@/app/layout/Main';
import Footer from '@app/layout/Footer';

import TextSection from '@shared/component/paragraph/TextSection';
import SectionTitle from '@shared/component/title/SectionTitle';
import TextBlock from '@shared/component/paragraph/TextBlock';

const TermsOfUse = () => {
    return (
        <>
            <Header disabledSearch={true} />
            <MainContent>
                <TextSection>
                    <SectionTitle
                        titleStyleClasses="text-lg"
                        title="Termos de uso e Políticas de privacidade"
                        subTitle="Última atualização: XX de XXXXXXXX de XXXX"
                    />
                    <TextBlock
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
                    <TextBlock
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
                    <TextBlock
                        title="3. Uso de informações pessoais"
                        paragraphContent={[
                            {
                                text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi. Nullam nec purus non dolor fermentum ultricies. Sed sagittis, justo nec',
                            },
                        ]}
                    />
                    <TextBlock
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
                    <TextBlock
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
                </TextSection>
            </MainContent>
            <Footer />
        </>
    );
};

export default TermsOfUse;
