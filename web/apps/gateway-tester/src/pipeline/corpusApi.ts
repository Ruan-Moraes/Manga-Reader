/** Client for the dev-server corpus endpoints (vite/corpusPlugin.ts). */
import type { PipelineReport } from './runPipeline'

export interface CorpusPage {
  file: string
  url: string
  /** True when the image is on disk (run `node scripts/fetch-corpus.mjs` to fetch missing ones). */
  available?: boolean
}

export interface CorpusChapter {
  id: string
  work: string
  chapter: string
  format: string
  sourceLanguage: string
  targetLanguage: string
  license: { name: string; url: string; attribution: string }
  origin: string
  scenarios: string[]
  notes?: string
  pages: CorpusPage[]
}

export interface CorpusManifest {
  version: number
  description?: string
  scenarioCatalog?: Record<string, string>
  chapters: CorpusChapter[]
}

const BASE = '/__corpus'

async function ok(response: Response): Promise<Response> {
  if (!response.ok) throw new Error(`${response.url}: HTTP ${response.status}`)
  return response
}

const encodePath = (path: string) => path.split('/').map(encodeURIComponent).join('/')

export const corpusApi = {
  async manifest(): Promise<CorpusManifest> {
    return (await ok(await fetch(`${BASE}/manifest`))).json()
  },

  async page(chapterId: string, file: string): Promise<Blob> {
    return (await ok(await fetch(`${BASE}/pages/${encodePath(`${chapterId}/${file}`)}`))).blob()
  },

  async createRun(): Promise<{ runId: string; path: string }> {
    return (await ok(await fetch(`${BASE}/runs`, { method: 'POST' }))).json()
  },

  async listRuns(): Promise<string[]> {
    return (await (await ok(await fetch(`${BASE}/runs`))).json()).runs
  },

  async save(runId: string, path: string, body: Blob | string): Promise<void> {
    await ok(await fetch(`${BASE}/runs/${encodePath(`${runId}/${path}`)}`, { method: 'PUT', body }))
  },

  async report(runId: string): Promise<PipelineReport> {
    return (await ok(await fetch(`${BASE}/runs/${encodeURIComponent(runId)}/report.json`))).json()
  },

  pageUrl(chapterId: string, file: string): string {
    return `${BASE}/pages/${encodePath(`${chapterId}/${file}`)}`
  },

  runUrl(runId: string, path: string): string {
    return `${BASE}/runs/${encodePath(`${runId}/${path}`)}`
  },
}

export type CorpusApi = typeof corpusApi
