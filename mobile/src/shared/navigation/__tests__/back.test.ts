import { router } from 'expo-router';

import { navigateBackOrReplace } from '../back';

jest.mock('expo-router', () => ({
    router: {
        back: jest.fn(),
        canGoBack: jest.fn(),
        replace: jest.fn(),
    },
}));

const mockedRouter = router as jest.Mocked<typeof router>;

describe('navigateBackOrReplace', () => {
    beforeEach(() => jest.clearAllMocks());

    it('retorna ao histórico real quando disponível', () => {
        mockedRouter.canGoBack.mockReturnValue(true);

        navigateBackOrReplace('/');

        expect(mockedRouter.back).toHaveBeenCalledTimes(1);
        expect(mockedRouter.replace).not.toHaveBeenCalled();
    });

    it('substitui pela rota segura quando não há histórico', () => {
        mockedRouter.canGoBack.mockReturnValue(false);

        navigateBackOrReplace('/');

        expect(mockedRouter.back).not.toHaveBeenCalled();
        expect(mockedRouter.replace).toHaveBeenCalledWith('/');
    });
});
