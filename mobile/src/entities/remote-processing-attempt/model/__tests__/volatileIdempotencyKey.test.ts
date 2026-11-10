import { createVolatileIdempotencyKey } from '../volatileIdempotencyKey';

it('creates a UUIDv7 bound to server time with opaque entropy', () => {
    const time = '2026-11-01T12:00:00.000Z';
    const key = createVolatileIdempotencyKey(time, '550e8400-e29b-41d4-a716-446655440000');
    expect(key).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-7[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
    expect(parseInt(key.replaceAll('-', '').slice(0, 12), 16)).toBe(Date.parse(time));
    expect(createVolatileIdempotencyKey(time, '550e8400-e29b-41d4-a716-446655440001')).not.toBe(key);
});
