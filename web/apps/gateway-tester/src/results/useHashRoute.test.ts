import { describe, expect, it } from 'vitest'
import { hashHref, parseHash } from './useHashRoute'

describe('hash routes', () => {
  it('parses the results routes', () => {
    expect(parseHash('')).toEqual([])
    expect(parseHash('#/')).toEqual([])
    expect(parseHash('#/resultados')).toEqual(['resultados'])
    expect(parseHash('#/resultados/2026-11-17T16-35-33Z-w1x6/pepper-carrot-en-ep06')).toEqual([
      'resultados',
      '2026-11-17T16-35-33Z-w1x6',
      'pepper-carrot-en-ep06',
    ])
  })

  it('round-trips segments that need encoding and tolerates malformed escapes', () => {
    expect(parseHash(hashHref('resultados', 'a b', 'c/d'))).toEqual(['resultados', 'a b', 'c/d'])
    expect(parseHash('#/resultados/%E0')).toEqual(['resultados', '%E0'])
  })
})
