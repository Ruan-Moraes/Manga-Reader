import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import gatewayClient, { downloadResultImage, readImageSize } from './services/gatewayClient'
import { corpusApi } from './pipeline/corpusApi'
import { runPipeline, type PageOutcome, type PipelineReport } from './pipeline/runPipeline'

interface Props {
  disclosureVersion: string
  /** Pairs the gateway translates; chapters outside them are shown but cannot be selected. */
  pairs: Array<{ source: string; target: string }>
}

const OUTCOME_STYLE: Record<PageOutcome, string> = {
  pending: 'bg-slate-300',
  running: 'bg-blue-400 animate-pulse',
  ok: 'bg-green-500',
  'needs-review': 'bg-amber-500',
  error: 'bg-red-500',
  skipped: 'bg-slate-500',
}

export default function ValidationPanel({ disclosureVersion, pairs }: Props) {
  const { data: manifest, error: manifestError, refetch } = useQuery({
    queryKey: ['corpus-manifest'],
    queryFn: () => corpusApi.manifest(),
  })
  const { data: pastRuns = [], refetch: refetchRuns } = useQuery({
    queryKey: ['corpus-runs'],
    queryFn: () => corpusApi.listRuns(),
  })
  const [selected, setSelected] = useState<Set<string> | null>(null)
  const [report, setReport] = useState<PipelineReport | null>(null)
  const [running, setRunning] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const supported = useMemo(
    () => (source: string, target: string) =>
      pairs.length === 0 || pairs.some((pair) => pair.source === source && pair.target === target),
    [pairs],
  )
  const chapters = manifest?.chapters ?? []
  const selectable = chapters.filter((chapter) => supported(chapter.sourceLanguage, chapter.targetLanguage))

  // Everything the gateway can translate is selected by default.
  useEffect(() => {
    if (selected === null && manifest) setSelected(new Set(selectable.map((chapter) => chapter.id)))
  }, [manifest, selected, selectable])

  const chosen = chapters.filter((chapter) => selected?.has(chapter.id))
  const pageCount = chosen.reduce((sum, chapter) => sum + chapter.pages.filter((page) => page.available).length, 0)
  const missing = chapters.reduce((sum, chapter) => sum + chapter.pages.filter((page) => !page.available).length, 0)

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev ?? [])
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const run = async () => {
    const controller = new AbortController()
    abortRef.current = controller
    setRunning(true)
    setFailure(null)
    setReport(null)
    try {
      await runPipeline(
        {
          gateway: gatewayClient,
          corpus: corpusApi,
          download: downloadResultImage,
          imageSize: readImageSize,
        },
        { chapters: chosen, disclosureVersion, signal: controller.signal },
        setReport,
      )
    } catch (error) {
      setFailure(error instanceof Error ? error.message : String(error))
    } finally {
      setRunning(false)
      abortRef.current = null
      refetchRuns()
    }
  }

  const totals = report?.totals
  const finished = report?.finishedAt !== undefined

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
      <div className="flex flex-wrap items-start gap-2 mb-2">
        <h2 className="flex-1 text-xl font-semibold text-slate-900 dark:text-white">🧪 Pipeline de validação</h2>
        <a href="#/resultados" className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition">
          📖 Resultados
        </a>
        <button
          onClick={() => refetch()}
          disabled={running}
          className="text-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 px-3 py-1 rounded transition"
        >
          🔄 Corpus
        </button>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
        Traduz os capítulos de <code>corpus/</code> e grava tudo em um único lote em <code>corpus/runs/&lt;lote&gt;/</code>{' '}
        (imagens, manifestos, <code>report.json</code> e galeria <code>index.html</code>).
      </p>

      {manifestError && (
        <p className="text-sm text-red-600 mb-3">
          Corpus indisponível ({String(manifestError)}). Rode o tester com <code>pnpm --filter gateway-tester dev</code>.
        </p>
      )}
      {missing > 0 && (
        <p className="text-xs text-amber-700 dark:text-amber-300 mb-3">
          {missing} página(s) do manifesto não estão no disco — rode <code>node scripts/fetch-corpus.mjs</code>.
        </p>
      )}

      <ul className="space-y-2 mb-4">
        {chapters.map((chapter) => {
          const canRun = supported(chapter.sourceLanguage, chapter.targetLanguage)
          const pages = report?.chapters.find((c) => c.id === chapter.id)?.pages
          return (
            <li key={chapter.id} className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <label className={`flex gap-3 items-start ${canRun ? 'cursor-pointer' : 'opacity-50'}`}>
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={selected?.has(chapter.id) ?? false}
                  disabled={!canRun || running}
                  onChange={() => toggle(chapter.id)}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {chapter.work} — {chapter.chapter}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {chapter.sourceLanguage} → {chapter.targetLanguage} · {chapter.format} · {chapter.pages.length} pág. ·{' '}
                    {chapter.license.name}
                    {!canRun && ' · par não habilitado no gateway'}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {chapter.scenarios.map((scenario) => (
                      <span
                        key={scenario}
                        title={manifest?.scenarioCatalog?.[scenario]}
                        className="text-[11px] px-2 rounded-full bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200"
                      >
                        {scenario}
                      </span>
                    ))}
                  </div>
                  {pages && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {pages.map((page) => (
                        <span
                          key={page.file}
                          title={`${page.file}: ${page.outcome}${page.gatewayStatus ? ` (${page.gatewayStatus})` : ''}${
                            page.error ? ` — ${page.error}` : ''
                          }`}
                          className={`w-3 h-3 rounded-sm ${OUTCOME_STYLE[page.outcome]}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </label>
            </li>
          )
        })}
      </ul>

      <div className="flex gap-2">
        <button
          onClick={run}
          disabled={running || pageCount === 0 || !disclosureVersion}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold py-3 px-4 rounded-lg transition"
        >
          {running ? 'Rodando…' : `▶ Rodar pipeline (${pageCount} páginas)`}
        </button>
        {running && (
          <button
            onClick={() => abortRef.current?.abort()}
            className="px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold"
          >
            Parar
          </button>
        )}
      </div>

      {failure && <p className="text-sm text-red-600 mt-3 break-all">Lote interrompido: {failure}</p>}

      {report && totals && (
        <div className="mt-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm text-slate-700 dark:text-slate-200 space-y-1">
          <p className="font-mono text-xs break-all">Lote {report.runId}</p>
          <p>
            {totals.ok} ok · {totals['needs-review']} revisar · {totals.error} erro · {totals.skipped} puladas /{' '}
            {totals.pages}
          </p>
          {finished && (
            <p className="text-xs">
              Salvo em <code className="break-all">{report.folder}</code> ·{' '}
              <a className="text-blue-600 underline" href={corpusApi.runUrl(report.runId, 'index.html')} target="_blank" rel="noreferrer">
                abrir galeria
              </a>{' '}
              ·{' '}
              <a className="text-blue-600 underline" href={corpusApi.runUrl(report.runId, 'report.json')} target="_blank" rel="noreferrer">
                report.json
              </a>
            </p>
          )}
        </div>
      )}

      {pastRuns.length > 0 && (
        <details className="mt-4 text-sm text-slate-600 dark:text-slate-300">
          <summary className="cursor-pointer">Lotes anteriores ({pastRuns.length})</summary>
          <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto">
            {pastRuns.map((runId) => (
              <li key={runId}>
                <a className="font-mono text-xs text-blue-600 underline" href={corpusApi.runUrl(runId, 'index.html')} target="_blank" rel="noreferrer">
                  {runId}
                </a>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
