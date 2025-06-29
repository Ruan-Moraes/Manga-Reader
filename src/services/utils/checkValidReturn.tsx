import { ERROR_MESSAGES } from '../../constants/API_CONSTANTS';

const checkValidReturn = (response: Response): void => {
    if (response === null || response === undefined || !response.ok) {
        throw new Error(ERROR_MESSAGES.FETCH_TITLES_ERROR);
    }
};

export default checkValidReturn;
