import { POSITIONS } from '../../constants/POSITIONS';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const toastClassName = {
  success:
    'bg-secondary flex items-center justify-center p-4 border-2 border-tertiary border-r-0 border-b-0 rounded-l font-bold mt-2',
  error:
    'bg-secondary flex items-center justify-center p-4 border-2 border-tertiary border-r-0 rounded-l font-bold mt-2',
  info: 'bg-secondary flex items-center justify-center p-4 border-2 border-tertiary border-r-0 rounded-l font-bold mt-2',
  warning:
    'bg-secondary flex items-center justify-center p-4 border-2 border-tertiary border-r-0 rounded-l font-bold mt-2',
  default:
    'bg-secondary flex items-center justify-center p-4 border-2 border-tertiary border-r-0 rounded-l font-bold mt-2',
  dark: 'bg-secondary flex items-center justify-center p-4 border-2 border-tertiary border-r-0 rounded-l font-bold mt-2',
};

const Toast = () => (
  <ToastContainer
    position={POSITIONS.TOP_RIGHT}
    autoClose={1000}
    closeButton={false}
    closeOnClick={true}
    toastClassName={(context) => toastClassName[context?.type || 'default']}
  />
);

export default Toast;
