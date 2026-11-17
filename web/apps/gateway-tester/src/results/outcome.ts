import type { PageOutcome, PageRecord } from '../pipeline/runPipeline'

export const OUTCOME_LABEL: Record<PageOutcome, string> = {
  pending: 'pendente',
  running: 'rodando',
  ok: 'ok',
  'needs-review': 'revisar',
  error: 'erro',
  skipped: 'pulada',
}

export const OUTCOME_BADGE: Record<PageOutcome, string> = {
  pending: 'bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-100',
  running: 'bg-blue-200 text-blue-800',
  ok: 'bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-100',
  'needs-review': 'bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-100',
  error: 'bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-100',
  skipped: 'bg-slate-300 text-slate-800 dark:bg-slate-600 dark:text-slate-100',
}

export function countOutcomes(pages: PageRecord[]) {
  return {
    ok: pages.filter((page) => page.outcome === 'ok').length,
    review: pages.filter((page) => page.outcome === 'needs-review').length,
    failed: pages.filter((page) => page.outcome === 'error' || page.outcome === 'skipped').length,
  }
}
