import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { corpusApi } from '../pipeline/corpusApi'
import { OUTCOME_BADGE, OUTCOME_LABEL } from './outcome'
import { hashHref } from './useHashRoute'

interface Props {
  runId: string
  chapterId: string
}

type View = 'original' | 'translated'

/**
 * Reads one chapter of a batch. The two buttons swap every page between the original and the
 * translation in place, so the same spot can be compared without losing the scroll position.
 */
export default function ChapterViewer({ runId, chapterId }: Props) {
  const [view, setView] = useState<View>('translated')
  const report = useQuery({ queryKey: ['corpus-report', runId], queryFn: () => corpusApi.report(runId) })
  const chapter = report.data?.chapters.find((c) => c.id === chapterId)

  const button = (target: View, label: string) => (
    <button
      onClick={() => setView(target)}
      aria-pressed={view === target}
      className={`flex-1 py-3 rounded-lg font-semibold transition ${
        view === target
          ? 'bg-blue-600 text-white shadow'
          : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
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
          <div className="flex gap-2 mt-2">
            {button('original', 'Original')}
            {button('translated', 'Tradução')}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-4">
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
            const translated = page.translated ? corpusApi.runUrl(runId, page.translated) : null
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
                  {page.quality?.issues.map((issue) => (
                    <span key={issue} className="text-amber-700 dark:text-amber-400">
                      {issue}
                    </span>
                  ))}
                </figcaption>
                {view === 'original' || translated ? (
                  <img
                    src={view === 'original' || !translated ? original : translated}
                    alt={`${page.file} (${view === 'original' ? 'original' : 'tradução'})`}
                    loading="lazy"
                    className="w-full h-auto rounded-lg shadow bg-white"
                  />
                ) : (
                  <div className="p-6 rounded-lg bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-sm">
                    Sem tradução: {page.error ?? OUTCOME_LABEL[page.outcome]}
                  </div>
                )}
              </figure>
            )
          })}
        </div>
      </div>
    </div>
  )
}
