import { useNavigate, type NavigateOptions } from 'react-router-dom';
import { WEB_BASE_URL } from '../constant/WEB_BASE_URL';

const useAppNavigate = () => {
    const navigate = useNavigate();

    return (path: string, options?: NavigateOptions) => {
        navigate(path.startsWith('/') ? `${WEB_BASE_URL}${path}` : path, options);
    };
};

export default useAppNavigate;
