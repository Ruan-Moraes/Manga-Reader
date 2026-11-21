/** Region of a result manifest (RenderManifestService), as far as a batch comparison needs it. */
export interface ManifestRegion {
  sourceText: string
  translatedText: string
  kept?: boolean
  overflow?: boolean
  fontSizePx?: number
}

export interface ManifestDiff {
  /** Regions of the current page with no identical region in the previous one. */
  changed: number
  /** Regions of the previous page that disappeared. */
  removed: number
}

const signature = (region: ManifestRegion) =>
  [
    region.sourceText.replace(/\s+/g, ' ').trim(),
    region.translatedText.replace(/\s+/g, ' ').trim(),
    region.kept ? 'kept' : '',
    region.overflow ? 'overflow' : '',
    region.fontSizePx ?? 0,
  ].join('\u0000')

/** Counts what changed between two renders of the same page, matching regions by content (order-independent). */
export function compareManifests(current: ManifestRegion[], previous: ManifestRegion[]): ManifestDiff {
  const pool = new Map<string, number>()
  for (const region of previous) pool.set(signature(region), (pool.get(signature(region)) ?? 0) + 1)
  let changed = 0
  for (const region of current) {
    const key = signature(region)
    const left = pool.get(key) ?? 0
    if (left > 0) pool.set(key, left - 1)
    else changed++
  }
  const removed = [...pool.values()].reduce((sum, n) => sum + n, 0)
  return { changed, removed }
}
