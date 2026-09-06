module.exports = {
    preset: 'jest-expo',
    clearMocks: true,
    restoreMocks: true,
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/src/app/'],
};
