import { interruptVolatileDelivery, putVolatileDelivery, reserveVolatileDelivery, takeVolatileDelivery } from '../volatileDelivery';

afterEach(() => interruptVolatileDelivery('attempt'));
it('keeps one client delivery owned until its consumer disposes it', () => {
    const bytes = { manifest: new Uint8Array([1]), image: new Uint8Array([2]), dispose: jest.fn() };
    reserveVolatileDelivery('attempt', jest.fn());
    putVolatileDelivery('attempt', 'operation', 'a'.repeat(64), bytes);
    const delivery = takeVolatileDelivery('attempt');
    expect(delivery?.originalSha256).toBe('a'.repeat(64));
    expect(takeVolatileDelivery('attempt')).toBeNull();
    expect(() => reserveVolatileDelivery('other', jest.fn())).toThrow();
    delivery?.dispose();
    expect(bytes.dispose).toHaveBeenCalledTimes(1);
    reserveVolatileDelivery('attempt', jest.fn());
});
it('aborts and discards an unclaimed response without inventing remote cancellation', () => {
    const cancel = jest.fn();
    const dispose = jest.fn();
    reserveVolatileDelivery('attempt', cancel);
    putVolatileDelivery('attempt', 'operation', 'a'.repeat(64), { manifest: new Uint8Array([1]), image: new Uint8Array([2]), dispose });
    interruptVolatileDelivery('attempt');
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(dispose).toHaveBeenCalledTimes(1);
    expect(takeVolatileDelivery('attempt')).toBeNull();
});

it('signals a taken delivery without clearing its borrowed buffer or releasing capacity early', () => {
    const dispose = jest.fn();
    const image = new Uint8Array([2]);
    reserveVolatileDelivery('attempt', jest.fn());
    putVolatileDelivery('attempt', 'operation', 'a'.repeat(64), { manifest: new Uint8Array([1]), image, dispose });
    const delivery = takeVolatileDelivery('attempt')!;
    interruptVolatileDelivery('attempt');
    expect(delivery.signal.aborted).toBe(true);
    expect(image[0]).toBe(2);
    expect(dispose).not.toHaveBeenCalled();
    expect(() => reserveVolatileDelivery('attempt', jest.fn())).toThrow();
    delivery.dispose();
    delivery.dispose();
    expect(dispose).toHaveBeenCalledTimes(1);
    reserveVolatileDelivery('attempt', jest.fn());
});
it('does not touch a new lease when an abort listener disposes and replaces the old one synchronously', () => {
    const cancelOld = jest.fn(),
        cancelNew = jest.fn();
    reserveVolatileDelivery('attempt', cancelOld);
    putVolatileDelivery('attempt', 'operation', 'a'.repeat(64), { manifest: new Uint8Array([1]), image: new Uint8Array([2]), dispose: jest.fn() });
    const old = takeVolatileDelivery('attempt')!;
    old.signal.addEventListener(
        'abort',
        () => {
            old.dispose();
            reserveVolatileDelivery('new-attempt', cancelNew);
            putVolatileDelivery('new-attempt', 'new-operation', 'b'.repeat(64), {
                manifest: new Uint8Array([3]),
                image: new Uint8Array([4]),
                dispose: jest.fn(),
            });
        },
        { once: true },
    );
    expect(() => interruptVolatileDelivery('attempt')).not.toThrow();
    expect(cancelOld).toHaveBeenCalledTimes(1);
    expect(cancelNew).not.toHaveBeenCalled();
    const next = takeVolatileDelivery('new-attempt');
    expect(next?.bytes.image[0]).toBe(4);
    next?.dispose();
});
