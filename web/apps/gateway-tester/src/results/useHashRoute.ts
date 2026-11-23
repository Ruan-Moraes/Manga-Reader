import { useEffect, useState } from 'react'

/** Path segments after "#/" (e.g. "#/resultados/<run>/<chapter>" → ["resultados", run, chapter]). */
export function parseHash(hash: string): string[] {
  return hash
    .replace(/^#\/?/, '')
    .split('/')
    .filter(Boolean)
    .map((segment) => {
      try {
        return decodeURIComponent(segment)
      } catch {
        return segment
      }
    })
}

export const hashHref = (...segments: string[]) => `#/${segments.map(encodeURIComponent).join('/')}`

/** Tiny hash router: links work on any device without server-side routes. */
export function useHashRoute(): string[] {
  const [route, setRoute] = useState(() => parseHash(window.location.hash))
  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}
