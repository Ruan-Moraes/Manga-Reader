import type { ChapterTerm, PageQuality, ProcessedPage } from '../services/gatewayClient'
import type { CorpusApi, CorpusChapter } from './corpusApi'

/** Gateway calls the pipeline needs; the real ones come from services/gatewayClient. */
export interface PipelineGateway {
  createInstallation(): Promise<{ installationRef: string; credential: string }>
  createSession(installationRef: string, credential: string): Promise<{ accessToken: string }>
  /** v2: one synchronous call per page; the result exists only in this response. */
  processPage(
    accessToken: string,
    file: File,
    sourceLanguage: string,
    targetLanguage: string,
    options: { widthPx: number; heightPx: number; disclosureVersion: string; contextRef?: string },
  ): Promise<ProcessedPage>
  seedGlossary(
    accessToken: string,
    contextRef: string,
    sourceLanguage: string,
    targetLanguage: string,
    disclosureVersion: string,
    terms: ChapterTerm[],
  ): Promise<void>
}

export interface PipelineDeps {
  gateway: PipelineGateway
  corpus: Pick<CorpusApi, 'createRun' | 'page' | 'save'>
  imageSize(file: File): Promise<{ widthPx: number; heightPx: number }>
  now?: () => number
  sleep?: (ms: number) => Promise<void>
}

export interface PipelineOptions {
  chapters: CorpusChapter[]
  disclosureVersion: string
  /**
   * Chapters translated at the same time. The pages of one chapter go one after another, in reading order: a name
   * the first page decides is then kept by the next ones (chapter memory, contextRef). The volatile gateway renders
   * one page at a time and answers "busy" to the others, which wait and try again.
   */
  concurrency?: number
  /** Send each chapter's glossary (the names its results reported) with its next pages. Default true. */
  sendGlossary?: boolean
  /** Wait before trying again a page the gateway was too busy to take. */
  pollMs?: number
  timeoutMs?: number
  signal?: AbortSignal
}

export type PageOutcome = 'pending' | 'running' | 'ok' | 'needs-review' | 'error' | 'skipped'

export interface PageRecord {
  chapterId: string
  file: string
  outcome: PageOutcome
  gatewayStatus?: string
  jobRef?: string
  durationMs?: number
  quality?: PageQuality
  error?: string
  /** Paths inside the run folder. */
  translated?: string
  manifest?: string
}

export interface PipelineReport {
  runId: string
  folder: string
  startedAt: string
  finishedAt?: string
  aborted: boolean
  totals: Record<Exclude<PageOutcome, 'pending' | 'running'>, number> & { pages: number }
  chapters: Array<
    Pick<CorpusChapter, 'id' | 'work' | 'chapter' | 'format' | 'sourceLanguage' | 'targetLanguage' | 'scenarios'> & {
      license: string
      pages: PageRecord[]
    }
  >
}

const MIME_BY_EXTENSION: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }

const baseName = (file: string) => file.replace(/\.[^.]+$/, '')

export function errorMessage(error: unknown): string {
  const code = (error as { code?: unknown }).code
  if (typeof code === 'string' && code) return code
  const response = (error as { response?: { status?: number; data?: { code?: string } } }).response
  if (response?.data?.code) return response.data.code
  if (response?.status) return `HTTP ${response.status}`
  return error instanceof Error ? error.message : String(error)
}

const statusOf = (error: unknown) =>
  (error as { status?: number }).status ?? (error as { response?: { status?: number } }).response?.status
const isUnauthorized = (error: unknown) => statusOf(error) === 401
/** The gateway was rendering another page: same answer to a retry a moment later. */
const isBusy = (error: unknown) => statusOf(error) === 503 && (error as { retryable?: boolean }).retryable === true

export function summarize(pages: PageRecord[]): PipelineReport['totals'] {
  const totals = { pages: pages.length, ok: 0, 'needs-review': 0, error: 0, skipped: 0 }
  for (const page of pages) {
    if (page.outcome in totals && page.outcome !== 'pending' && page.outcome !== 'running') {
      totals[page.outcome as keyof Omit<typeof totals, 'pages'>]++
    }
  }
  return totals
}

/**
 * Translates every page of the chosen chapters and writes the whole batch into one run folder:
 * <chapter>/<page>.translated.<ext>, <chapter>/<page>.manifest.json, report.json and index.html.
 * A page that fails is recorded and the run goes on; the report is written even when aborted.
 */
export async function runPipeline(
  deps: PipelineDeps,
  options: PipelineOptions,
  onUpdate: (report: PipelineReport) => void,
): Promise<PipelineReport> {
  const now = deps.now ?? Date.now
  const sleep = deps.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)))
  const { concurrency = 1, pollMs = 2000, timeoutMs = 5 * 60 * 1000, signal } = options

  const { runId, path: folder } = await deps.corpus.createRun()
  const report: PipelineReport = {
    runId,
    folder,
    startedAt: new Date(now()).toISOString(),
    aborted: false,
    totals: summarize([]),
    chapters: options.chapters.map((chapter) => ({
      id: chapter.id,
      work: chapter.work,
      chapter: chapter.chapter,
      format: chapter.format,
      sourceLanguage: chapter.sourceLanguage,
      targetLanguage: chapter.targetLanguage,
      scenarios: chapter.scenarios,
      license: chapter.license.name,
      pages: chapter.pages.map((page) => ({
        chapterId: chapter.id,
        file: page.file,
        outcome: page.available === false ? 'skipped' : 'pending',
        error: page.available === false ? 'page not downloaded (node scripts/fetch-corpus.mjs)' : undefined,
      })),
    })),
  }
  const allPages = () => report.chapters.flatMap((chapter) => chapter.pages)
  const publish = () => {
    report.totals = summarize(allPages())
    onUpdate(structuredClone(report))
  }
  const patch = (record: PageRecord, changes: Partial<PageRecord>) => {
    Object.assign(record, changes)
    publish()
  }
  publish()

  // One anonymous installation per run; the session is renewed if it expires mid-run.
  const installation = await deps.gateway.createInstallation()
  let accessToken = (await deps.gateway.createSession(installation.installationRef, installation.credential)).accessToken
  const withSession = async <T>(call: (token: string) => Promise<T>): Promise<T> => {
    try {
      return await call(accessToken)
    } catch (error) {
      if (!isUnauthorized(error)) throw error
      accessToken = (await deps.gateway.createSession(installation.installationRef, installation.credential)).accessToken
      return call(accessToken)
    }
  }

  const chapterOf = new Map(options.chapters.map((chapter) => [chapter.id, chapter]))
  // One chapter memory per chapter and run: its pages translate a name the same way.
  const contextOf = new Map(options.chapters.map((chapter) => [chapter.id, crypto.randomUUID()]))
  // The client's copy of each chapter's names, as the app keeps it: the first decision stays.
  const glossaryOf = new Map(options.chapters.map((chapter) => [chapter.id, new Map<string, string>()]))
  const translatePage = async (record: PageRecord) => {
    const chapter = chapterOf.get(record.chapterId)!
    const started = now()
    patch(record, { outcome: 'running', error: undefined })
    try {
      const blob = await deps.corpus.page(chapter.id, record.file)
      const extension = record.file.split('.').pop()?.toLowerCase() ?? ''
      const file = new File([blob], record.file, { type: MIME_BY_EXTENSION[extension] ?? blob.type })
      const size = await deps.imageSize(file)
      const contextRef = contextOf.get(chapter.id)!
      const glossary = [...glossaryOf.get(chapter.id)!].slice(0, 256).map(([source, target]) => ({ source, target }))
      // The names this chapter's earlier pages decided go first, as the app does (best effort).
      if (options.sendGlossary !== false && glossary.length) {
        try {
          await withSession((token) =>
            deps.gateway.seedGlossary(token, contextRef, chapter.sourceLanguage, chapter.targetLanguage, options.disclosureVersion, glossary),
          )
        } catch {
          // The page is still translated; only the refill is lost.
        }
      }
      let processed: ProcessedPage | undefined
      while (!processed) {
        if (signal?.aborted) throw new Error('Stopped by user')
        if (now() - started > timeoutMs) throw new Error('Timed out waiting for the gateway')
        try {
          processed = await withSession((token) =>
            deps.gateway.processPage(token, file, chapter.sourceLanguage, chapter.targetLanguage, {
              ...size,
              disclosureVersion: options.disclosureVersion,
              contextRef,
            }),
          )
        } catch (error) {
          if (!isBusy(error)) throw error
          patch(record, { gatewayStatus: 'BUSY' })
          await sleep(pollMs)
        }
      }
      const base = `${chapter.id}/${baseName(record.file)}`
      const translated = `${base}.translated.webp`
      const manifest = `${base}.manifest.json`
      await deps.corpus.save(runId, translated, processed.image)
      await deps.corpus.save(runId, manifest, processed.manifestJson)
      rememberTerms(glossaryOf.get(chapter.id)!, processed.manifestJson)
      const quality = qualityOf(processed.manifestJson)
      const operation = operationOf(processed.manifestJson)
      patch(record, {
        gatewayStatus: 'READY',
        jobRef: operation,
        outcome: quality?.status === 'NEEDS_REVIEW' ? 'needs-review' : 'ok',
        quality,
        translated,
        manifest,
        durationMs: now() - started,
      })
    } catch (error) {
      patch(record, { outcome: 'error', error: errorMessage(error), durationMs: now() - started })
    }
  }

  const pending = allPages().filter((page) => page.outcome === 'pending')
  const queue = [...new Set(pending.map((page) => page.chapterId))].map((id) => pending.filter((page) => page.chapterId === id))
  let cursor = 0
  const worker = async () => {
    while (!signal?.aborted) {
      const chapterPages = queue[cursor++]
      if (!chapterPages) return
      for (const page of chapterPages) {
        if (signal?.aborted) return
        await translatePage(page)
      }
    }
  }
  await Promise.all(Array.from({ length: Math.max(1, Math.min(concurrency, queue.length)) }, worker))

  report.aborted = signal?.aborted ?? false
  for (const page of allPages()) {
    if (page.outcome === 'pending') Object.assign(page, { outcome: 'skipped', error: 'Stopped by user' })
  }
  report.finishedAt = new Date(now()).toISOString()
  publish()
  await deps.corpus.save(runId, 'report.json', JSON.stringify(report, null, 2))
  await deps.corpus.save(runId, 'index.html', renderGallery(report))
  return report
}

/** The gateway's opaque operation reference of the page (the manifest's `jobRef`), for tracing a run. */
export function operationOf(manifestJson: string): string | undefined {
  try {
    return (JSON.parse(manifestJson) as { jobRef?: string }).jobRef
  } catch {
    return undefined
  }
}

/** The page quality the result manifest (1.2) reports; absent in older manifests. */
export function qualityOf(manifestJson: string): PageQuality | undefined {
  try {
    return (JSON.parse(manifestJson) as { quality?: PageQuality }).quality
  } catch {
    return undefined
  }
}

/** Adds the names a result manifest (1.2, `terms`) reports; a name already kept is not changed. */
export function rememberTerms(glossary: Map<string, string>, manifestJson: string) {
  try {
    const terms = (JSON.parse(manifestJson) as { terms?: ChapterTerm[] }).terms ?? []
    for (const term of terms) if (!glossary.has(term.source)) glossary.set(term.source, term.target)
  } catch {
    // A manifest that is not JSON reports no names.
  }
}

const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

/**
 * Side-by-side review page for the batch. Paths are relative (runs/<id>/ sits inside corpus/),
 * so it works both from the dev server and opened straight from disk.
 */
export function renderGallery(report: PipelineReport): string {
  const t = report.totals
  const chapters = report.chapters
    .map((chapter) => {
      const rows = chapter.pages
        .map((page) => {
          const original = `../../${encodeURIComponent(chapter.id)}/${encodeURIComponent(page.file)}`
          const result = page.translated
            ? `<img loading="lazy" src="${page.translated.split('/').map(encodeURIComponent).join('/')}">`
            : `<div class="missing">${escapeHtml(page.error ?? page.outcome)}</div>`
          const issues = page.quality?.issues?.length ? ` · ${escapeHtml(page.quality.issues.join(', '))}` : ''
          const seconds = page.durationMs !== undefined ? ` · ${(page.durationMs / 1000).toFixed(1)}s` : ''
          return `<figure class="${page.outcome}"><figcaption><b>${escapeHtml(page.file)}</b> — ${page.outcome}${seconds}${issues}${
            page.manifest ? ` · <a href="${page.manifest.split('/').map(encodeURIComponent).join('/')}">manifest</a>` : ''
          }</figcaption><div class="pair"><img loading="lazy" src="${original}">${result}</div></figure>`
        })
        .join('\n')
      return `<section><h2>${escapeHtml(chapter.work)} — ${escapeHtml(chapter.chapter)} <small>${escapeHtml(
        `${chapter.sourceLanguage} → ${chapter.targetLanguage} · ${chapter.format} · ${chapter.license}`,
      )}</small></h2><p class="tags">${chapter.scenarios.map((s) => `<span>${escapeHtml(s)}</span>`).join('')}</p>${rows}</section>`
    })
    .join('\n')
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Lote ${escapeHtml(report.runId)}</title><style>
body{font-family:system-ui,sans-serif;margin:16px;background:#f1f5f9;color:#0f172a}
h1{font-size:20px}h2{font-size:17px;margin-top:32px}small{color:#64748b;font-weight:normal}
.tags span{display:inline-block;background:#e2e8f0;border-radius:9px;padding:1px 8px;margin:0 4px 4px 0;font-size:12px}
figure{margin:12px 0;background:#fff;border-radius:8px;padding:8px;border-left:5px solid #94a3b8}
figure.ok{border-color:#16a34a}figure.needs-review{border-color:#d97706}figure.error,figure.skipped{border-color:#dc2626}
figcaption{font-size:13px;margin-bottom:6px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.pair img{width:100%;height:auto;display:block}.missing{display:flex;align-items:center;justify-content:center;background:#fee2e2;color:#991b1b;padding:16px}
@media (max-width:640px){.pair{grid-template-columns:1fr}}
</style></head><body><h1>Lote ${escapeHtml(report.runId)}</h1>
<p>${escapeHtml(report.startedAt)} → ${escapeHtml(report.finishedAt ?? '…')}${report.aborted ? ' (interrompido)' : ''} ·
${t.pages} páginas · ${t.ok} ok · ${t['needs-review']} revisar · ${t.error} erro · ${t.skipped} puladas · <a href="report.json">report.json</a></p>
${chapters}</body></html>
`
}
