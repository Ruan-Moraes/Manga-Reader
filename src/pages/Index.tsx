// @ts-expect-error - ignore import error
import '@splidejs/react-splide/css';

import Header from '../layouts/Header';
import Main from '../layouts/Main';

import Warning from '../components/notifications/Warning';
import Carousel from '../components/carousel/Carousel';
import Highlight_Cards from '../components/cards/highlight/Cards_Container';
// import HorizontalCard from '../../common/cards/horizontal-cards/HorizontalCards';

const Index = () => {
  return (
    <>
      <Header />
      <Main>
        <Warning
          title="Atenção!"
          message="Site em desenvolvimento, algumas funcionalidades podem não estar disponíveis."
          color="quaternary"
        />
        <Carousel />
        <Highlight_Cards />
        {/* <HorizontalCard /> */}
      </Main>
    </>
  );
};

export default Index;
