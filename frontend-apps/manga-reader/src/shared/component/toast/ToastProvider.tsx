import 'react-toastify/dist/ReactToastify.css';

import { ToastContainer } from 'react-toastify';

import { TOAST_POSITIONS } from '@shared/constant/TOAST_POSITIONS';

const ToastProvider = () => (
    <>
        <ToastContainer
            position={TOAST_POSITIONS.BOTTOM_RIGHT}
            autoClose={2500}
            closeButton={true}
            closeOnClick={true}
            pauseOnHover={true}
            draggable={false}
            theme="dark"
            limit={2}
            newestOnTop={true}
        />
    </>
);

export default ToastProvider;
