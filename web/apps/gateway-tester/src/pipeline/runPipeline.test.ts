import { describe, expect, it, vi } from 'vitest'
import type { PageQuality, ProcessedPage } from '../services/gatewayClient'
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

/** The v2 result of one page: its manifest (1.2) and translated image, in the same response. */
const result = (file: string, extra: { quality?: PageQuality; terms?: Array<{ source: string; target: string }> } = {}): ProcessedPage => ({
  manifestJson: JSON.stringify({ version: '1.2', jobRef: `op-${file}`, terms: extra.terms ?? [], quality: extra.quality ?? { status: 'OK', issues: [] } }),
  image: new Blob(['webp'], { type: 'image/webp' }),
})

function setup(results: Record<string, ProcessedPage | Error>, gatewayOverrides: Partial<PipelineGateway> = {}) {
  const saved = new Map<string, unknown>()
  const processed: string[] = []
  const gateway: PipelineGateway = {
    createInstallation: vi.fn(async () => ({ installationRef: 'inst', credential: 'cred' })),
    createSession: vi.fn(async () => ({ accessToken: 'token' })),
    processPage: vi.fn(async (_token, file: File) => {
      processed.push(file.name)
      const outcome = results[file.name] ?? result(file.name)
      if (outcome instanceof Error) throw outcome
      return outcome
    }),
    seedGlossary: vi.fn(async () => undefined),
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
    imageSize: async () => ({ widthPx: 10, heightPx: 10 }),
    sleep: async () => undefined,
  }
  return { deps, gateway, saved, processed }
}

const gatewayError = (status: number, code: string, retryable = false) => Object.assign(new Error(code), { status, code, retryable })

describe('runPipeline (volatile v2)', () => {
  it('saves every translated page, the report and the gallery in one run folder', async () => {
    const { deps, saved, gateway } = setup({ 'p02.png': result('p02.png', { quality: { status: 'NEEDS_REVIEW', issues: ['TEXT_NOT_RENDERED'] } }) })

    const report = await runPipeline(deps, { chapters: [chapter('ch-a', [['p01.jpg'], ['p02.png']])], disclosureVersion: 'd1' }, () => undefined)

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
    expect(report.chapters[0].pages[0].jobRef).toBe('op-p01.jpg')
    expect(gateway.createInstallation).toHaveBeenCalledTimes(1)
  })

  it('sends one chapter reference per chapter, shared by its pages', async () => {
    const { deps, gateway } = setup({})
    await runPipeline(
      deps,
      { chapters: [chapter('ch-a', [['p01.jpg'], ['p02.jpg']]), chapter('ch-b', [['p03.jpg']])], disclosureVersion: 'd1' },
      () => undefined,
    )
    const contextOf = (name: string) => vi.mocked(gateway.processPage).mock.calls.find(([, file]) => file.name === name)?.[4].contextRef
    expect(contextOf('p01.jpg')).toMatch(/^[0-9a-f-]{36}$/)
    expect(contextOf('p02.jpg')).toBe(contextOf('p01.jpg'))
    expect(contextOf('p03.jpg')).not.toBe(contextOf('p01.jpg'))
  })

  it("sends each chapter's glossary, the names its earlier results reported, before its next pages", async () => {
    const { deps, gateway } = setup({
      'p01.jpg': result('p01.jpg', { terms: [{ source: 'Coriander', target: 'Coriander' }] }),
      'p02.jpg': result('p02.jpg', { terms: [{ source: 'Coriander', target: 'Coentro' }, { source: 'Saffron', target: 'Saffron' }] }),
    })
    await runPipeline(deps, { chapters: [chapter('ch-a', [['p01.jpg'], ['p02.jpg'], ['p03.jpg']])], disclosureVersion: 'd1' }, () => undefined)

    const seeds = vi.mocked(gateway.seedGlossary).mock.calls
    // The first page has no glossary yet; the first decision stays.
    expect(seeds.map((call) => call[5])).toEqual([
      [{ source: 'Coriander', target: 'Coriander' }],
      [
        { source: 'Coriander', target: 'Coriander' },
        { source: 'Saffron', target: 'Saffron' },
      ],
    ])
    expect(seeds[0][1]).toBe(vi.mocked(gateway.processPage).mock.calls[0][4].contextRef)
  })

  it('sends no glossary when asked not to (to measure the difference), and a refused one never fails the page', async () => {
    const { deps, gateway } = setup({ 'p01.jpg': result('p01.jpg', { terms: [{ source: 'Coriander', target: 'Coriander' }] }) })
    await runPipeline(deps, { chapters: [chapter('ch-a', [['p01.jpg'], ['p02.jpg']])], disclosureVersion: 'd1', sendGlossary: false }, () => undefined)
    expect(gateway.seedGlossary).not.toHaveBeenCalled()

    const refused = setup(
      { 'p01.jpg': result('p01.jpg', { terms: [{ source: 'Coriander', target: 'Coriander' }] }) },
      { seedGlossary: vi.fn(async () => Promise.reject(gatewayError(409, 'consent-required'))) },
    )
    const report = await runPipeline(refused.deps, { chapters: [chapter('ch-a', [['p01.jpg'], ['p02.jpg']])], disclosureVersion: 'd1' }, () => undefined)
    expect(report.totals.ok).toBe(2)
  })

  it('translates the pages of one chapter in reading order, one after another', async () => {
    const events: string[] = []
    const { deps } = setup(
      {},
      {
        processPage: vi.fn(async (_token: string, file: File) => {
          events.push(`start ${file.name}`)
          await Promise.resolve()
          events.push(`done ${file.name}`)
          return result(file.name)
        }),
      },
    )
    await runPipeline(deps, { chapters: [chapter('ch-a', [['p01.jpg'], ['p02.jpg']])], disclosureVersion: 'd1', concurrency: 3 }, () => undefined)
    expect(events).toEqual(['start p01.jpg', 'done p01.jpg', 'start p02.jpg', 'done p02.jpg'])
  })

  it('waits and tries again while the gateway renders another page', async () => {
    let busy = 2
    const { deps } = setup(
      {},
      {
        processPage: vi.fn(async (_token: string, file: File) => {
          if (busy-- > 0) throw gatewayError(503, 'capabilities-unavailable', true)
          return result(file.name)
        }),
      },
    )
    const report = await runPipeline(deps, { chapters: [chapter('ch-a', [['p01.jpg']])], disclosureVersion: 'd1' }, () => undefined)
    expect(report.totals.ok).toBe(1)
  })

  it('records a failed page and keeps going; pages not on disk are skipped without being sent', async () => {
    const { deps, processed } = setup({ 'p01.jpg': gatewayError(422, 'translation-invalid-response') })
    const report = await runPipeline(
      deps,
      { chapters: [chapter('ch-a', [['p01.jpg'], ['p02.jpg'], ['p03.jpg', false]])], disclosureVersion: 'd1', concurrency: 1 },
      () => undefined,
    )
    const pages = report.chapters[0].pages
    expect(pages.map((page) => page.outcome)).toEqual(['error', 'ok', 'skipped'])
    expect(pages[0].error).toBe('translation-invalid-response')
    expect(processed).toEqual(['p01.jpg', 'p02.jpg'])
  })

  it('renews the session once when the gateway answers 401', async () => {
    let first = true
    const { deps, gateway } = setup(
      {},
      {
        processPage: vi.fn(async (_token: string, file: File) => {
          if (first) {
            first = false
            throw gatewayError(401, 'unauthorized')
          }
          return result(file.name)
        }),
      },
    )
    const report = await runPipeline(deps, { chapters: [chapter('ch-a', [['p01.jpg']])], disclosureVersion: 'd1' }, () => undefined)
    expect(report.totals.ok).toBe(1)
    expect(gateway.createSession).toHaveBeenCalledTimes(2)
  })

  it('stops picking new pages once aborted and still writes the report', async () => {
    const controller = new AbortController()
    const { deps, saved } = setup({})
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
