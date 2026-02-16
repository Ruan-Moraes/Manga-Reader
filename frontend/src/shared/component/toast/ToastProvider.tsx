import 'react-toastify/dist/ReactToastify.css';

import { ToastContainer } from 'react-toastify';

import { TOAST_POSITIONS } from '@shared/constant/TOAST_POSITIONS';

// const contextClass = {
//   info: 'bg-primary-default overflow-hidden text-primary p-2 rounded-xs flex gap-2 items-center',
//   success:
//     'bg-primary-default overflow-hidden text-primary p-2 rounded-xs flex gap-2 items-center',
//   error:
//     'bg-primary-default overflow-hidden text-primary p-2 rounded-xs flex gap-2 items-center',
//   warning:
//     'bg-primary-default overflow-hidden text-primary p-2 rounded-xs flex gap-2 items-center',
//   default:
//     'bg-primary-default overflow-hidden text-primary p-2 rounded-xs flex gap-2 items-center',
// };

const ToastProvider = () => (
    <>
        <ToastContainer
            position={TOAST_POSITIONS.TOP_RIGHT}
            autoClose={2000}
            closeButton={false}
            closeOnClick={true}
            theme="dark"
            limit={1}
            newestOnTop={true}
        />
    </>
);

export default ToastProvider;
