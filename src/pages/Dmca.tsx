import Header from '../layouts/Header';
import Main from '../layouts/Main';
import Footer from '../layouts/Footer';

import { Link } from 'react-router-dom';

const Dmca = () => {
  return (
    <>
      <Header
        disabledAuth={true}
        disabledBreadcrumb={true}
        disabledSearch={true}
      />
      <Main>
        <section className="flex flex-col gap-4"></section>
      </Main>
      <Footer disabledLinks={true} />
    </>
  );
};

export default Dmca;
