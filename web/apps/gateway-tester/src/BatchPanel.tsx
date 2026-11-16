import { useState } from 'react'
import { useBatchTranslation } from './hooks/useBatchTranslation'
import type { BatchItemStatus } from './hooks/useBatchTranslation'

interface LanguagePair {
  source: string
  target: string
}

interface Props {
  accessToken: string
  disclosureVersion: string
  languages: string[]
  /** Pairs the gateway translates; any other combination is refused with unsupported-pair. */
  pairs?: LanguagePair[]
  dailyQuota?: number
}

const STATUS_STYLE: Record<BatchItemStatus, string> = {
  pending: 'bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-200',
  submitting: 'bg-blue-200 text-blue-800',
  processing: 'bg-blue-200 text-blue-800',
  saving: 'bg-purple-200 text-purple-800',
  done: 'bg-green-200 text-green-800',
  error: 'bg-red-200 text-red-800',
}

const DEFAULT_LANGUAGES = ['ja', 'en', 'es', 'ko', 'zh-Hans', 'zh-Hant', 'pt-BR']

export default function BatchPanel({ accessToken, disclosureVersion, languages, pairs = [], dailyQuota }: Props) {
  const options = languages.length > 0 ? languages : DEFAULT_LANGUAGES
  // Only offer what the gateway translates: sources that have a pair, then that source's targets.
  const sources = pairs.length > 0 ? [...new Set(pairs.map((pair) => pair.source))] : options
  const targetsOf = (source: string) =>
    pairs.length > 0 ? pairs.filter((pair) => pair.source === source).map((pair) => pair.target) : options
  const [sourceLanguage, setSourceLanguage] = useState(sources.includes('ja') ? 'ja' : sources[0])
  const [targetLanguage, setTargetLanguage] = useState(() => {
    const targets = targetsOf(sourceLanguage)
    return targets.includes('pt-BR') ? 'pt-BR' : targets[0]
  })
  const targets = targetsOf(sourceLanguage)
  const chooseSource = (source: string) => {
    setSourceLanguage(source)
    const next = targetsOf(source)
    if (!next.includes(targetLanguage)) setTargetLanguage(next.includes('pt-BR') ? 'pt-BR' : next[0])
  }
  const [directory, setDirectory] = useState<FileSystemDirectoryHandle | null>(null)
  const { items, running, addFiles, clearFinished, start, stop } = useBatchTranslation()

  const canPickDirectory = typeof window !== 'undefined' && 'showDirectoryPicker' in window
  const pending = items.filter((item) => item.status === 'pending' || item.status === 'error').length
  const done = items.filter((item) => item.status === 'done').length

  const pickDirectory = async () => {
    try {
      const handle = await (
        window as unknown as { showDirectoryPicker: (o: object) => Promise<FileSystemDirectoryHandle> }
      ).showDirectoryPicker({ mode: 'readwrite' })
      setDirectory(handle)
    } catch {
      // user cancelled the picker
    }
  }

  const onFiles = (list: FileList | null) => {
    if (list) addFiles(Array.from(list))
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">📄 Batch Translate</h2>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Source language', value: sourceLanguage, set: chooseSource, codes: sources },
            { label: 'Target language', value: targetLanguage, set: setTargetLanguage, codes: targets },
          ].map(({ label, value, set, codes }) => (
            <div key={label}>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{label}</label>
              <select
                value={value}
                onChange={(e) => set(e.target.value)}
                disabled={running}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
              >
                {codes.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            onFiles(e.dataTransfer.files)
          }}
          className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center hover:border-slate-400 transition"
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            id="batch-file-input"
            className="hidden"
            onChange={(e) => {
              onFiles(e.target.files)
              e.target.value = ''
            }}
          />
          <label htmlFor="batch-file-input" className="cursor-pointer block">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Click or drop many pages here
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">JPEG, PNG or WebP — added to the queue</p>
          </label>
        </div>

        <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
          {canPickDirectory ? (
            <>
              <button
                onClick={pickDirectory}
                disabled={running}
                className="px-3 py-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 transition"
              >
                📁 Choose output folder
              </button>
              <span>{directory ? `Saving to: ${directory.name}/` : 'No folder chosen — files will download one by one'}</span>
            </>
          ) : (
            <span>This browser has no folder picker — translated pages download one by one.</span>
          )}
        </div>

        {dailyQuota !== undefined && items.length > dailyQuota && (
          <p className="text-xs text-yellow-700 dark:text-yellow-300">
            The gateway allows {dailyQuota} pages per installation per day; pages beyond that will fail with a quota
            error. Create a new installation to continue.
          </p>
        )}

        <div className="flex gap-2">
          <button
            onClick={() =>
              start({ accessToken, disclosureVersion, sourceLanguage, targetLanguage, directory })
            }
            disabled={running || pending === 0}
            className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold py-3 px-4 rounded-lg transition"
          >
            {running ? 'Translating…' : `🚀 Translate ${pending} page${pending === 1 ? '' : 's'}`}
          </button>
          {running && (
            <button onClick={stop} className="px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold">
              Stop
            </button>
          )}
          <button
            onClick={clearFinished}
            disabled={running}
            className="px-4 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 transition"
          >
            Clear finished
          </button>
        </div>

        {items.length > 0 && (
          <>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {done}/{items.length} saved
            </p>
            <ul className="space-y-2 max-h-96 overflow-y-auto">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg flex justify-between items-center gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-slate-800 dark:text-slate-200 truncate">{item.file.name}</p>
                    {item.savedAs && <p className="text-xs text-green-600 truncate">→ {item.savedAs}</p>}
                    {item.quality?.status === 'NEEDS_REVIEW' && (
                      <p
                        className="text-xs font-semibold text-amber-700 dark:text-amber-300"
                        title={item.quality.issues.join(', ')}
                      >
                        ⚠ Revisar: {item.quality.issues.includes('ALL_TEXT_NOT_RENDERED') ? 'nenhum texto traduzido foi desenhado' : 'parte do texto ficou no original'}
                      </p>
                    )}
                    {item.error && <p className="text-xs text-red-600 break-all">{item.error}</p>}
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ${STATUS_STYLE[item.status]}`}>
                    {item.gatewayStatus && item.status === 'processing' ? item.gatewayStatus : item.status}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
