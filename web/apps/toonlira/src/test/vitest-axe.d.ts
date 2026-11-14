import 'vitest';

// Bridges jest-axe's matcher onto Vitest's expect typing.
interface AxeMatchers<R = unknown> {
    toHaveNoViolations(): R;
}

declare module 'vitest' {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface Assertion<T = unknown> extends AxeMatchers<T> {}
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface AsymmetricMatchersContaining extends AxeMatchers {}
}
