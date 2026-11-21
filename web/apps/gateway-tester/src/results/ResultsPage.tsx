import { useQuery } from '@tanstack/react-query'
import { corpusApi } from '../pipeline/corpusApi'
import { countOutcomes } from './outcome'
import { hashHref } from './useHashRoute'

interface Props {
  /** Batch to show; the newest one when absent. */
  runId?: string
}

/** Every work/chapter of a pipeline batch, each opening the chapter viewer. */
export default function ResultsPage({ runId }: Props) {
  const runs = useQuery({ queryKey: ['corpus-runs'], queryFn: () => corpusApi.listRuns() })
  const current = runId ?? runs.data?.[0]
  const report = useQuery({
    queryKey: ['corpus-report', current],
    queryFn: () => corpusApi.report(current!),
    enabled: !!current,
  })

  const works = new Map<string, NonNullable<typeof report.data>['chapters']>()
  for (const chapter of report.data?.chapters ?? []) {
    works.set(chapter.work, [...(works.get(chapter.work) ?? []), chapter])
  }
  const totals = report.data?.totals

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <a href="#/" className="text-sm text-blue-600 dark:text-blue-400">
          ← Gateway Tester
        </a>
        <h1 className="text-2xl font-bold mt-2">Resultados do pipeline</h1>

        {runs.data && runs.data.length === 0 && (
          <p className="mt-4 text-slate-600 dark:text-slate-300">Nenhum lote ainda. Rode o pipeline no Gateway Tester.</p>
        )}

        {runs.data && runs.data.length > 0 && (
          <label className="block mt-4 text-sm">
            <span className="text-slate-600 dark:text-slate-300">Lote</span>
            <select
              value={current}
              onChange={(e) => (window.location.hash = hashHref('resultados', e.target.value))}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 font-mono text-xs"
            >
              {runs.data.map((id) => (
                <option key={id} value={id}>
                  {id}
                  {id === runs.data[0] ? ' (mais recente)' : ''}
                </option>
              ))}
            </select>
          </label>
        )}

        {report.isError && (
          <p className="mt-4 text-sm text-red-600">
            Lote sem report.json (ainda rodando ou interrompido antes de terminar).
          </p>
        )}

        {totals && (
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            {totals.pages} páginas · <span className="text-green-700 dark:text-green-400">{totals.ok} ok</span> ·{' '}
            <span className="text-amber-700 dark:text-amber-400">{totals['needs-review']} revisar</span> ·{' '}
            <span className="text-red-700 dark:text-red-400">{totals.error + totals.skipped} erro/puladas</span>
          </p>
        )}

        {[...works.entries()].map(([work, chapters]) => (
          <section key={work} className="mt-6">
            <h2 className="text-lg font-semibold">{work}</h2>
            <ul className="mt-2 space-y-2">
              {chapters.map((chapter) => {
                const counts = countOutcomes(chapter.pages)
                const cover = chapter.pages.find((page) => page.translated) ?? chapter.pages[0]
                return (
                  <li key={chapter.id}>
                    <a
                      href={hashHref('resultados', current!, chapter.id)}
                      className="flex gap-3 items-center p-3 rounded-xl bg-white dark:bg-slate-800 shadow hover:shadow-md active:scale-[0.99] transition"
                    >
                      {cover && (
                        <img
                          src={corpusApi.pageUrl(chapter.id, cover.file)}
                          alt=""
                          loading="lazy"
                          className="w-14 h-20 object-cover rounded-md bg-slate-200 shrink-0"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">
                          {work} / {chapter.chapter}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {chapter.sourceLanguage} → {chapter.targetLanguage} · {chapter.format} · {chapter.pages.length} pág.
                        </p>
                        <p className="text-xs mt-1 flex gap-2">
                          <span className="text-green-700 dark:text-green-400">{counts.ok} ok</span>
                          {counts.review > 0 && <span className="text-amber-700 dark:text-amber-400">{counts.review} revisar</span>}
                          {counts.failed > 0 && <span className="text-red-700 dark:text-red-400">{counts.failed} erro</span>}
                        </p>
                      </div>
                      <span className="text-slate-400 text-xl">›</span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
