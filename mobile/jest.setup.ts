jest.mock('react-native-worklets', () => {
    const workletsMock = require('react-native-worklets/src/mock');

    return {
        ...workletsMock,
        scheduleOnRN: jest.fn((callback: (...args: unknown[]) => unknown, ...args: unknown[]) => callback(...args)),
    };
});

require('react-native-reanimated').setUpTests();

// O BottomSheet usa gesture-handler (MOB-FEAT-070); sem o setup, qualquer tela com folha falha ao montar.
require('react-native-gesture-handler/jestSetup');

jest.mock('expo-secure-store', () => ({
    getItemAsync: jest.fn(),
    setItemAsync: jest.fn(),
    deleteItemAsync: jest.fn(),
}));
