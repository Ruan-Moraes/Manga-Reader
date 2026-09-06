jest.mock('react-native-worklets', () => {
    const workletsMock = require('react-native-worklets/src/mock');

    return {
        ...workletsMock,
        scheduleOnRN: jest.fn((callback: (...args: unknown[]) => unknown, ...args: unknown[]) => callback(...args)),
    };
});

require('react-native-reanimated').setUpTests();

jest.mock('expo-secure-store', () => ({
    getItemAsync: jest.fn(),
    setItemAsync: jest.fn(),
    deleteItemAsync: jest.fn(),
}));
