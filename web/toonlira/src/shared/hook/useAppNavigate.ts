import { useNavigate, type NavigateOptions } from 'react-router-dom';
import { withWebBasePath } from '../constant/WEB_BASE_URL';

const useAppNavigate = () => {
    const navigate = useNavigate();

    return (path: string, options?: NavigateOptions) => {
        navigate(path.startsWith('/') ? withWebBasePath(path) : path, options);
    };
};

export default useAppNavigate;
