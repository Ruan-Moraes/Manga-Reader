// @ts-expect-error - ignore import error
import '@splidejs/react-splide/css';

import Header from '../../layouts/static/Header';
import Main from '../../layouts/not-static/Main';

import Warning from '../../common/warnings/Warning';
import Carousel from '../../common/carousel/Carousel';
import HighlightCards from '../../common/cards/highlight-cards/HighlightCards';
// import HorizontalCard from '../../common/cards/horizontal-cards/HorizontalCards';

const Index = () => {
  // const horizontalCardProps = {
  //   title: 'Popular',
  //   sub: 'Find out what is trending',
  // };

  return (
    <>
      <Header />
      <Main
        Warning={Warning}
        Carousel={Carousel}
        HighlightCards={HighlightCards}
        // HorizontalCards={(props) => (
        //   <HorizontalCard {...horizontalCardProps} {...props} />
        // )}
      />
    </>
  );
};

export default Index;
