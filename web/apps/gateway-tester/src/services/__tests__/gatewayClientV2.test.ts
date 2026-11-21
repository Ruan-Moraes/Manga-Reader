import { describe, expect, it } from 'vitest'
import { readProcessedPage, uuidV7 } from '../gatewayClient'

describe('gateway v2 client', () => {
  it('splits the binary result into manifest and image', async () => {
    const manifest = new TextEncoder().encode('{"version":"1.2"}')
    const image = new Uint8Array([1, 2, 3])
    const bytes = new ArrayBuffer(12 + manifest.length + image.length)
    const view = new DataView(bytes)
    view.setUint32(0, 0x54565231)
    view.setUint32(4, manifest.length)
    new Uint8Array(bytes, 8, manifest.length).set(manifest)
    view.setUint32(8 + manifest.length, image.length)
    new Uint8Array(bytes, 12 + manifest.length).set(image)
    const page = readProcessedPage(bytes)
    expect(page.manifestJson).toBe('{"version":"1.2"}')
    expect(new Uint8Array(await page.image.arrayBuffer())).toEqual(image)
    expect(() => readProcessedPage(bytes.slice(0, bytes.byteLength - 1))).toThrow('invalid-result')
  })

  it('draws time-ordered UUIDv7 keys, as the gateway requires', () => {
    const key = uuidV7(Date.UTC(2026, 10, 21))
    expect(key).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    expect(key.slice(0, 13).replace('-', '')).toBe(Date.UTC(2026, 10, 21).toString(16).padStart(12, '0'))
  })
})
