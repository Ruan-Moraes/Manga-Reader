import { act, renderHook } from '@testing-library/react-native';

import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('mantém o valor anterior até o delay e então publica o mais recente', () => {
        const { result, rerender } = renderHook<string, { value: string; delay: number }>(({ value, delay }) => useDebounce(value, delay), {
            initialProps: { value: 'first', delay: 300 },
        });

        rerender({ value: 'second', delay: 300 });
        act(() => jest.advanceTimersByTime(299));
        expect(result.current).toBe('first');

        act(() => jest.advanceTimersByTime(1));
        expect(result.current).toBe('second');
    });

    it('cancela o timer anterior quando o valor muda', () => {
        const { result, rerender } = renderHook<string, { value: string }>(({ value }) => useDebounce(value, 300), {
            initialProps: { value: 'first' },
        });

        rerender({ value: 'second' });
        act(() => jest.advanceTimersByTime(200));
        rerender({ value: 'third' });
        act(() => jest.advanceTimersByTime(100));
        expect(result.current).toBe('first');

        act(() => jest.advanceTimersByTime(200));
        expect(result.current).toBe('third');
    });
});
