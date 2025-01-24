import { POSITIONS } from '../../constants/POSITIONS';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Toast = () => (
  <>
    <ToastContainer
      position={POSITIONS.TOP_RIGHT}
      autoClose={750}
      closeButton={false}
      closeOnClick={true}
      theme="dark"
      toastClassName={(context) => {
        return (
          context?.defaultClassName +
          ' border border-tertiary border-b-none overflow-hidden mr-2 mt-2'
        );
      }}
      limit={1}
    />
    <div className="rounded-r-none"></div>
  </>
);

export default Toast;
