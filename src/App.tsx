// @ts-expect-error - ignore import error
import '@splidejs/react-splide/css';

import Main from './components/layout/Main';
import Header from './components/layout/Header';

function App() {
  return (
    <>
      <Header />
      <Main />
    </>
  );
}

export default App;
