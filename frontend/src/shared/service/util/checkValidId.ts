import { ERROR_MESSAGES } from '@shared/constant/API_CONSTANTS';

const checkValidId = (id: number): void => {
    if (isNaN(id)) {
        throw new Error(ERROR_MESSAGES.INVALID_ID_ERROR);
    }
};

export default checkValidId;
