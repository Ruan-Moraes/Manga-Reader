import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { corpusApi } from '../pipeline/corpusApi'
import type { PageRecord } from '../pipeline/runPipeline'
import { compareManifests, type ManifestRegion } from './compareManifests'
import { OUTCOME_BADGE, OUTCOME_LABEL } from './outcome'
import { hashHref } from './useHashRoute'

interface Props {
  runId: string
  chapterId: string
}

type View = 'original' | 'translated' | 'previous'

const fetchManifest = async (url: string): Promise<ManifestRegion[]> => {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`)
  return (await response.json()).regions ?? []
}

/** Badge: how many regions of this page changed since the previous batch (text, kept/overflow or font size). */
function ChangeBadge({ runId, previousRunId, current, previous }: {
  runId: string
  previousRunId: string
  current: PageRecord
  previous?: PageRecord
}) {
  const diff = useQuery({
    queryKey: ['manifest-diff', runId, previousRunId, current.chapterId, current.file],
    queryFn: async () =>
      compareManifests(
        await fetchManifest(corpusApi.runUrl(runId, current.manifest!)),
        await fetchManifest(corpusApi.runUrl(previousRunId, previous!.manifest!)),
      ),
    enabled: !!current.manifest && !!previous?.manifest,
  })
  if (!previous?.manifest || !current.manifest) return <span className="text-slate-500">sem lote anterior</span>
  if (!diff.data) return null
  return diff.data.changed === 0 && diff.data.removed === 0 ? (
    <span className="text-slate-500">igual ao anterior</span>
  ) : (
    <span className="px-2 py-0.5 rounded-full font-semibold bg-violet-200 text-violet-900 dark:bg-violet-900 dark:text-violet-100">
      mudou: {diff.data.changed} região(ões){diff.data.removed > diff.data.changed ? ` · ${diff.data.removed - diff.data.changed} a menos` : ''}
    </span>
  )
}

/**
 * Reads one chapter of a batch. The buttons swap every page in place between the original, the
 * translation and the translation of the previous batch, so the same spot can be compared without
 * losing the scroll position (regressions show up as a change between two batches).
 */
export default function ChapterViewer({ runId, chapterId }: Props) {
  const [view, setView] = useState<View>('translated')
  const report = useQuery({ queryKey: ['corpus-report', runId], queryFn: () => corpusApi.report(runId) })
  const chapter = report.data?.chapters.find((c) => c.id === chapterId)
  const runs = useQuery({ queryKey: ['corpus-runs'], queryFn: () => corpusApi.listRuns() })
  const index = runs.data?.indexOf(runId) ?? -1
  const previousRunId = index >= 0 ? runs.data?.[index + 1] : undefined
  const previousReport = useQuery({
    queryKey: ['corpus-report', previousRunId],
    queryFn: () => corpusApi.report(previousRunId!),
    enabled: !!previousRunId,
    retry: false,
  })
  const previousPages = previousReport.data?.chapters.find((c) => c.id === chapterId)?.pages ?? []

  const button = (target: View, label: string, disabled = false) => (
    <button
      onClick={() => setView(target)}
      disabled={disabled}
      aria-pressed={view === target}
      className={`flex-1 py-3 rounded-lg font-semibold transition ${
        view === target
          ? 'bg-blue-600 text-white shadow'
          : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 disabled:opacity-40'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white">
      <div className="sticky top-0 z-10 bg-slate-100/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <a href={hashHref('resultados', runId)} className="text-sm text-blue-600 dark:text-blue-400">
            ← Obras e capítulos
          </a>
          {chapter && (
            <p className="font-semibold truncate mt-1">
              {chapter.work} / {chapter.chapter}{' '}
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                {chapter.sourceLanguage} → {chapter.targetLanguage}
              </span>
            </p>
          )}
        </div>
      </div>

      {/* pb-28 keeps the last page clear of the fixed bottom bar. */}
      <div className="mx-auto max-w-3xl px-4 pt-4 pb-28">
        {report.isLoading && <p className="text-slate-500">Carregando…</p>}
        {report.data && !chapter && <p className="text-red-600">Capítulo {chapterId} não está neste lote.</p>}
        {chapter && chapter.scenarios.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {chapter.scenarios.map((scenario) => (
              <span key={scenario} className="text-[11px] px-2 rounded-full bg-slate-200 dark:bg-slate-700">
                {scenario}
              </span>
            ))}
          </div>
        )}

        <div className="space-y-6">
          {chapter?.pages.map((page) => {
            const original = corpusApi.pageUrl(chapter.id, page.file)
            const previous = previousPages.find((p) => p.file === page.file)
            const translated =
              view === 'previous'
                ? previous?.translated && previousRunId
                  ? corpusApi.runUrl(previousRunId, previous.translated)
                  : null
                : page.translated
                  ? corpusApi.runUrl(runId, page.translated)
                  : null
            return (
              <figure key={page.file}>
                <figcaption className="flex flex-wrap items-center gap-2 text-xs mb-1">
                  <span className="font-mono">{page.file}</span>
                  <span className={`px-2 py-0.5 rounded-full font-semibold ${OUTCOME_BADGE[page.outcome]}`}>
                    {OUTCOME_LABEL[page.outcome]}
                  </span>
                  {page.durationMs !== undefined && (
                    <span className="text-slate-500">{(page.durationMs / 1000).toFixed(1)}s</span>
                  )}
                  {previousRunId && (
                    <ChangeBadge runId={runId} previousRunId={previousRunId} current={page} previous={previous} />
                  )}
                  {page.quality?.issues.map((issue) => (
                    <span key={issue} className="text-amber-700 dark:text-amber-400">
                      {issue}
                    </span>
                  ))}
                </figcaption>
                {view === 'original' || translated ? (
                  <img
                    src={view === 'original' || !translated ? original : translated}
                    alt={`${page.file} (${view === 'original' ? 'original' : view === 'previous' ? 'lote anterior' : 'tradução'})`}
                    loading="lazy"
                    className="w-full h-auto rounded-lg shadow bg-white"
                  />
                ) : (
                  <div className="p-6 rounded-lg bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-sm">
                    Sem tradução{view === 'previous' ? ' no lote anterior' : `: ${page.error ?? OUTCOME_LABEL[page.outcome]}`}
                  </div>
                )}
              </figure>
            )
          })}
        </div>
      </div>

      {/* Fixed at the bottom so the view can be swapped anywhere in the chapter, under the thumb. */}
      <nav
        className="fixed inset-x-0 bottom-0 z-20 bg-slate-100/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200 dark:border-slate-800"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-auto max-w-3xl px-4 py-3 flex gap-2">
          {button('original', 'Original')}
          {button('translated', 'Tradução')}
          {button('previous', 'Anterior', !previousRunId)}
        </div>
      </nav>
    </div>
  )
}
