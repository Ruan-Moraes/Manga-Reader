import { describe, expect, it, vi } from 'vitest'
import type { Job, PageQuality } from '../services/gatewayClient'
import type { CorpusChapter } from './corpusApi'
import { renderGallery, runPipeline, type PipelineDeps, type PipelineGateway } from './runPipeline'

const chapter = (id: string, files: Array<[string, boolean?]>): CorpusChapter => ({
  id,
  work: 'Work',
  chapter: '01',
  format: 'manga',
  sourceLanguage: 'ja',
  targetLanguage: 'pt-BR',
  license: { name: 'CC BY 4.0', url: 'https://example.test', attribution: 'someone' },
  origin: 'https://example.test',
  scenarios: ['balloon'],
  pages: files.map(([file, available = true]) => ({ file, url: `https://example.test/${file}`, available })),
})

const readyJob = (jobRef: string, quality?: PageQuality): Job => ({
  contractVersion: '1.0',
  jobRef,
  status: 'READY',
  serverTime: '2026-11-17T00:00:00Z',
  result: {
    manifestVersion: '1.0',
    widthPx: 10,
    heightPx: 10,
    expiresAt: '2026-11-17T01:00:00Z',
    image: { url: `https://signed.test/${jobRef}.webp`, mimeType: 'image/webp', byteSize: 1, sha256: 'x', expiresAt: '' },
    manifest: { url: `https://signed.test/${jobRef}.json`, mimeType: 'application/json', byteSize: 1, sha256: 'x', expiresAt: '' },
    quality,
  },
})

function setup(jobs: Record<string, Job[]>, gatewayOverrides: Partial<PipelineGateway> = {}) {
  const saved = new Map<string, unknown>()
  const submitted: string[] = []
  const polls: Record<string, number> = {}
  const gateway: PipelineGateway = {
    createInstallation: vi.fn(async () => ({ installationRef: 'inst', credential: 'cred' })),
    createSession: vi.fn(async () => ({ accessToken: 'token' })),
    submitPage: vi.fn(async (_token, file: File) => {
      submitted.push(file.name)
      return { jobRef: `job-${file.name}`, status: 'QUEUED' }
    }),
    getJobByRef: vi.fn(async (_token, jobRef: string) => {
      const sequence = jobs[jobRef]
      const index = Math.min(polls[jobRef] ?? 0, sequence.length - 1)
      polls[jobRef] = index + 1
      return sequence[index]
    }),
    acknowledgeResult: vi.fn(async () => undefined),
    ...gatewayOverrides,
  }
  const deps: PipelineDeps = {
    gateway,
    corpus: {
      createRun: async () => ({ runId: 'run-1', path: '/corpus/runs/run-1' }),
      page: async () => new Blob(['img'], { type: 'image/jpeg' }),
      save: async (runId, path, body) => {
        saved.set(`${runId}/${path}`, body)
      },
    },
    download: async (url) => new Blob([url]),
    imageSize: async () => ({ widthPx: 10, heightPx: 10 }),
    sleep: async () => undefined,
  }
  return { deps, gateway, saved, submitted }
}

describe('runPipeline', () => {
  it('saves every translated page, the report and the gallery in one run folder', async () => {
    const { deps, saved, gateway } = setup({
      'job-p01.jpg': [{ ...readyJob('job-p01.jpg'), status: 'PROCESSING', result: undefined }, readyJob('job-p01.jpg')],
      'job-p02.png': [readyJob('job-p02.png', { status: 'NEEDS_REVIEW', issues: ['TEXT_NOT_RENDERED'] })],
    })

    const report = await runPipeline(
      deps,
      { chapters: [chapter('ch-a', [['p01.jpg'], ['p02.png']])], disclosureVersion: 'd1' },
      () => undefined,
    )

    expect(report.totals).toEqual({ pages: 2, ok: 1, 'needs-review': 1, error: 0, skipped: 0 })
    expect([...saved.keys()].sort()).toEqual([
      'run-1/ch-a/p01.manifest.json',
      'run-1/ch-a/p01.translated.webp',
      'run-1/ch-a/p02.manifest.json',
      'run-1/ch-a/p02.translated.webp',
      'run-1/index.html',
      'run-1/report.json',
    ])
    expect(JSON.parse(saved.get('run-1/report.json') as string).totals.ok).toBe(1)
    expect(gateway.acknowledgeResult).toHaveBeenCalledTimes(2)
    expect(gateway.createInstallation).toHaveBeenCalledTimes(1)
  })

  it('records a failed job and keeps going; pages not on disk are skipped without being sent', async () => {
    const { deps, submitted } = setup({
      'job-p01.jpg': [{ ...readyJob('job-p01.jpg'), status: 'FAILED', result: undefined, error: { code: 'ocr-failed', retryable: false } }],
      'job-p02.jpg': [readyJob('job-p02.jpg')],
    })

    const report = await runPipeline(
      deps,
      { chapters: [chapter('ch-a', [['p01.jpg'], ['p02.jpg'], ['p03.jpg', false]])], disclosureVersion: 'd1', concurrency: 1 },
      () => undefined,
    )

    const pages = report.chapters[0].pages
    expect(pages.map((page) => page.outcome)).toEqual(['error', 'ok', 'skipped'])
    expect(pages[0].error).toBe('ocr-failed')
    expect(submitted).toEqual(['p01.jpg', 'p02.jpg'])
  })

  it('renews the session once when the gateway answers 401', async () => {
    let first = true
    const { deps, gateway } = setup(
      { 'job-p01.jpg': [readyJob('job-p01.jpg')] },
      {
        submitPage: vi.fn(async (_token: string, file: File) => {
          if (first) {
            first = false
            throw Object.assign(new Error('unauthorized'), { response: { status: 401 } })
          }
          return { jobRef: `job-${file.name}`, status: 'QUEUED' }
        }),
      },
    )

    const report = await runPipeline(deps, { chapters: [chapter('ch-a', [['p01.jpg']])], disclosureVersion: 'd1' }, () => undefined)

    expect(report.totals.ok).toBe(1)
    expect(gateway.createSession).toHaveBeenCalledTimes(2)
  })

  it('stops picking new pages once aborted and still writes the report', async () => {
    const controller = new AbortController()
    const { deps, saved } = setup({ 'job-p01.jpg': [readyJob('job-p01.jpg')], 'job-p02.jpg': [readyJob('job-p02.jpg')] })
    controller.abort()

    const report = await runPipeline(
      deps,
      { chapters: [chapter('ch-a', [['p01.jpg'], ['p02.jpg']])], disclosureVersion: 'd1', signal: controller.signal },
      () => undefined,
    )

    expect(report.aborted).toBe(true)
    expect(report.totals.skipped).toBe(2)
    expect(saved.has('run-1/report.json')).toBe(true)
  })
})

describe('renderGallery', () => {
  it('escapes text and links originals relative to the run folder', () => {
    const html = renderGallery({
      runId: 'r',
      folder: '/x',
      startedAt: 's',
      aborted: false,
      totals: { pages: 1, ok: 0, 'needs-review': 0, error: 1, skipped: 0 },
      chapters: [
        {
          id: 'ch',
          work: '<b>W</b>',
          chapter: '1',
          format: 'manga',
          sourceLanguage: 'ja',
          targetLanguage: 'pt-BR',
          scenarios: [],
          license: 'PD',
          pages: [{ chapterId: 'ch', file: 'p 1.jpg', outcome: 'error', error: '<oops>' }],
        },
      ],
    })
    expect(html).toContain('&lt;b&gt;W&lt;/b&gt;')
    expect(html).toContain('&lt;oops&gt;')
    expect(html).toContain('src="../../ch/p%201.jpg"')
  })
})
