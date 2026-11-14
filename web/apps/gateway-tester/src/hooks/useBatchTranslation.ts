import { useCallback, useRef, useState } from 'react'
import gatewayClient, { downloadResultImage, readImageSize } from '../services/gatewayClient'

export type BatchItemStatus = 'pending' | 'submitting' | 'processing' | 'saving' | 'done' | 'error'

export interface BatchItem {
  id: string
  file: File
  status: BatchItemStatus
  gatewayStatus?: string
  jobRef?: string
  savedAs?: string
  error?: string
}

interface BatchConfig {
  accessToken: string
  disclosureVersion: string
  sourceLanguage: string
  targetLanguage: string
  /** Chosen output folder (File System Access API). Falls back to browser downloads when null. */
  directory: FileSystemDirectoryHandle | null
}

const CONCURRENCY = 2
const POLL_MS = 2000
const POLL_TIMEOUT_MS = 5 * 60 * 1000
const TERMINAL_FAILURES = new Set(['FAILED', 'CANCELLED', 'RESULT_EXPIRED'])

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function outputName(original: string, mimeType: string): string {
  const base = original.replace(/\.[^.]+$/, '')
  const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'png'
  return `${base}.translated.${ext}`
}

async function saveBlob(blob: Blob, name: string, directory: FileSystemDirectoryHandle | null) {
  if (directory) {
    const handle = await directory.getFileHandle(name, { create: true })
    const writable = await handle.createWritable()
    await writable.write(blob)
    await writable.close()
    return
  }
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export function useBatchTranslation() {
  const [items, setItems] = useState<BatchItem[]>([])
  const [running, setRunning] = useState(false)
  const stopRef = useRef(false)

  const patch = useCallback((id: string, changes: Partial<BatchItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...changes } : item)))
  }, [])

  const addFiles = useCallback((files: File[]) => {
    const images = files.filter((file) => file.type.startsWith('image/'))
    setItems((prev) => [
      ...prev,
      ...images.map((file) => ({ id: crypto.randomUUID(), file, status: 'pending' as const })),
    ])
  }, [])

  const clearFinished = useCallback(() => {
    setItems((prev) => prev.filter((item) => item.status !== 'done' && item.status !== 'error'))
  }, [])

  const stop = useCallback(() => {
    stopRef.current = true
  }, [])

  const processItem = useCallback(
    async (item: BatchItem, config: BatchConfig) => {
      try {
        patch(item.id, { status: 'submitting', error: undefined })
        const size = await readImageSize(item.file)
        const submitted = await gatewayClient.submitPage(
          config.accessToken,
          item.file,
          config.sourceLanguage,
          config.targetLanguage,
          { ...size, disclosureVersion: config.disclosureVersion },
        )
        patch(item.id, { status: 'processing', jobRef: submitted.jobRef, gatewayStatus: submitted.status })

        const deadline = Date.now() + POLL_TIMEOUT_MS
        for (;;) {
          if (stopRef.current) throw new Error('Stopped by user')
          if (Date.now() > deadline) throw new Error('Timed out waiting for the job')
          const job = await gatewayClient.getJobByRef(config.accessToken, submitted.jobRef)
          patch(item.id, { gatewayStatus: job.status })
          if (TERMINAL_FAILURES.has(job.status)) {
            throw new Error(job.error?.code ?? job.status)
          }
          if (job.status === 'READY') {
            if (!job.result) throw new Error('Job is READY but has no result')
            patch(item.id, { status: 'saving' })
            const blob = await downloadResultImage(job.result.image.url)
            const name = outputName(item.file.name, job.result.image.mimeType)
            await saveBlob(blob, name, config.directory)
            await gatewayClient.acknowledgeResult(config.accessToken, submitted.jobRef)
            patch(item.id, { status: 'done', savedAs: name })
            return
          }
          await sleep(POLL_MS)
        }
      } catch (error) {
        const message =
          (error as { response?: { data?: { code?: string } } }).response?.data?.code ??
          (error instanceof Error ? error.message : 'Unknown error')
        patch(item.id, { status: 'error', error: message })
      }
    },
    [patch],
  )

  const start = useCallback(
    async (config: BatchConfig) => {
      stopRef.current = false
      setRunning(true)
      const queue = items.filter((item) => item.status === 'pending' || item.status === 'error')
      let cursor = 0
      const worker = async () => {
        while (!stopRef.current) {
          const next = queue[cursor++]
          if (!next) return
          await processItem(next, config)
        }
      }
      await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker))
      setRunning(false)
    },
    [items, processItem],
  )

  return { items, running, addFiles, clearFinished, start, stop }
}
