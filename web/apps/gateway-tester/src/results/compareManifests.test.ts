import { describe, expect, it } from 'vitest'
import { compareManifests, type ManifestRegion } from './compareManifests'

const region = (sourceText: string, translatedText: string, extra: Partial<ManifestRegion> = {}): ManifestRegion => ({
  sourceText,
  translatedText,
  fontSizePx: 20,
  ...extra,
})

describe('compareManifests', () => {
  it('sees no change when the same regions come back in another order or spacing', () => {
    const before = [region('HELLO', 'Olá'), region('BYE', 'Tchau')]
    const after = [region('BYE\n', 'Tchau'), region('HELLO', ' Olá')]
    expect(compareManifests(after, before)).toEqual({ changed: 0, removed: 0 })
  })

  it('counts a new translation, a render decision and a region that disappeared', () => {
    const before = [region('A', 'a'), region('B', 'b'), region('C', 'c')]
    const after = [region('A', 'á'), region('B', 'b', { kept: true })]
    expect(compareManifests(after, before)).toEqual({ changed: 2, removed: 3 })
  })

  it('treats a font size change as a change', () => {
    expect(compareManifests([region('A', 'a', { fontSizePx: 24 })], [region('A', 'a')])).toEqual({ changed: 1, removed: 1 })
  })
})
