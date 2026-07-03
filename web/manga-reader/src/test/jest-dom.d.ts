/**
 * DT-53 (types): o d.ts de `@testing-library/jest-dom/vitest` aumenta o módulo
 * 'vitest' resolvido a partir do PACOTE jest-dom — com múltiplas instâncias de
 * vitest no workspace pnpm (peer-hash), a augmentation cai na cópia errada e
 * `toBeInTheDocument` some do type-check (`tsc -b`). Esta augmentation local
 * aplica os matchers à instância de vitest que ESTE app resolve.
 */
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

declare module 'vitest' {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    interface Assertion<T = any> extends TestingLibraryMatchers<typeof expect.stringContaining, T> {}
    interface AsymmetricMatchersContaining extends TestingLibraryMatchers<typeof expect.stringContaining, unknown> {}
}
