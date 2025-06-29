import { ERROR_MESSAGES } from '../../constants/API_CONSTANTS';

const checkValidId = (id: number): void => {
    if (isNaN(id)) {
        throw new Error(ERROR_MESSAGES.INVALID_ID_ERROR);
    }
};

export default checkValidId;
