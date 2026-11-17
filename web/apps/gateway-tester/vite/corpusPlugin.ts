import { createReadStream } from 'node:fs'
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { join, resolve, sep } from 'node:path'
import type { Plugin } from 'vite'

/**
 * Dev-server endpoints for the validation pipeline (never part of the build):
 *   GET  /__corpus/manifest                      corpus.json + which pages are on disk
 *   GET  /__corpus/pages/<chapter>/<file>        an original page
 *   POST /__corpus/runs                          opens a new batch folder, returns { runId }
 *   PUT  /__corpus/runs/<runId>/<path>           writes one output of the batch (raw body)
 *   GET  /__corpus/runs                          past batches (newest first)
 *   GET  /__corpus/runs/<runId>/<path>           reads a batch file (report, gallery, images)
 * Every batch lives in corpus/runs/<runId>/, so a run is one folder with its report and gallery.
 */
const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.json': 'application/json',
  '.html': 'text/html; charset=utf-8',
}
const MAX_BODY_BYTES = 40 * 1024 * 1024
const SAFE_SEGMENT = /^[A-Za-z0-9._-]+$/

const mimeOf = (path: string) => MIME[path.slice(path.lastIndexOf('.')).toLowerCase()] ?? 'application/octet-stream'

/** Joins only plain segments under root, so a request can never read or write outside it. */
function safeJoin(root: string, segments: string[]): string | null {
  if (segments.length === 0 || segments.some((s) => !SAFE_SEGMENT.test(s) || s === '.' || s === '..')) return null
  const path = resolve(root, ...segments)
  return path.startsWith(root + sep) ? path : null
}

function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolveBody, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        reject(new Error('body too large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolveBody(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

async function sendFile(res: ServerResponse, path: string | null) {
  const info = path ? await stat(path).catch(() => null) : null
  if (!path || !info?.isFile()) return sendJson(res, 404, { error: 'not found' })
  res.setHeader('Content-Type', mimeOf(path))
  res.setHeader('Content-Length', info.size)
  res.setHeader('Cache-Control', 'no-store')
  createReadStream(path).pipe(res)
}

function newRunId(now = new Date()): string {
  const stamp = now.toISOString().replace(/[:]/g, '-').replace(/\.\d+Z$/, 'Z')
  return `${stamp}-${Math.random().toString(36).slice(2, 6)}`
}

export function corpusPlugin(corpusDir: string): Plugin {
  const root = resolve(corpusDir)
  const runsDir = join(root, 'runs')

  return {
    name: 'gateway-tester-corpus',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__corpus', async (req, res) => {
        try {
          const url = new URL(req.url ?? '/', 'http://local')
          const parts = url.pathname.split('/').filter(Boolean).map(decodeURIComponent)
          const method = req.method ?? 'GET'

          if (method === 'GET' && parts[0] === 'manifest' && parts.length === 1) {
            const manifest = JSON.parse(await readFile(join(root, 'corpus.json'), 'utf8'))
            for (const chapter of manifest.chapters) {
              for (const page of chapter.pages) {
                const path = safeJoin(root, [chapter.id, page.file])
                page.available = path ? (await stat(path).catch(() => null))?.isFile() === true : false
              }
            }
            return sendJson(res, 200, manifest)
          }

          if (method === 'GET' && parts[0] === 'pages') {
            return sendFile(res, safeJoin(root, parts.slice(1)))
          }

          if (parts[0] === 'runs') {
            if (method === 'POST' && parts.length === 1) {
              const runId = newRunId()
              await mkdir(join(runsDir, runId), { recursive: true })
              return sendJson(res, 201, { runId, path: join(runsDir, runId) })
            }
            if (method === 'GET' && parts.length === 1) {
              const entries = await readdir(runsDir, { withFileTypes: true }).catch(() => [])
              const runs = entries
                .filter((e) => e.isDirectory())
                .map((e) => e.name)
                .sort()
                .reverse()
              return sendJson(res, 200, { runs })
            }
            const target = safeJoin(runsDir, parts.slice(1))
            if (method === 'GET') return sendFile(res, target)
            if (method === 'PUT') {
              const runFolder = safeJoin(runsDir, parts.slice(1, 2))
              if (!target || !runFolder || parts.length < 3) return sendJson(res, 400, { error: 'bad path' })
              if (!(await stat(runFolder).catch(() => null))?.isDirectory()) {
                return sendJson(res, 404, { error: 'unknown run' })
              }
              await mkdir(resolve(target, '..'), { recursive: true })
              await writeFile(target, await readBody(req))
              return sendJson(res, 200, { saved: parts.slice(1).join('/') })
            }
          }

          // Originals by their plain path, as the batch gallery links them (../../<chapter>/<file>).
          if (method === 'GET' && parts.length === 2) return sendFile(res, safeJoin(root, parts))

          sendJson(res, 404, { error: 'not found' })
        } catch (error) {
          sendJson(res, 500, { error: error instanceof Error ? error.message : String(error) })
        }
      })
    },
  }
}
