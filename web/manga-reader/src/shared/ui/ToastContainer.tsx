import 'react-toastify/dist/ReactToastify.css';

import { ToastContainer as ToastifyContainer } from 'react-toastify';

import { TOAST_POSITIONS } from '@shared/constant/TOAST_POSITIONS';

// react-toastify viewport for toastService notifications (distinct from the
// kit's context ToastProvider in @ui/Toast).
const ToastContainer = () => (
    <>
        <ToastifyContainer
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

export default ToastContainer;
