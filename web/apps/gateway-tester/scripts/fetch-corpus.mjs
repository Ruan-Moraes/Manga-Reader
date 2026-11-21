#!/usr/bin/env node
// Downloads the validation corpus listed in corpus/corpus.json into corpus/<chapter-id>/.
// Pages already on disk are kept, so re-running only fetches what is missing.
// Usage: node scripts/fetch-corpus.mjs [chapter-id ...]
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'corpus')
const manifest = JSON.parse(await readFile(join(root, 'corpus.json'), 'utf8'))
const only = new Set(process.argv.slice(2))
const IMAGE_SIGNATURES = [
  [0xff, 0xd8, 0xff], // JPEG
  [0x89, 0x50, 0x4e, 0x47], // PNG
  [0x52, 0x49, 0x46, 0x46], // RIFF (WebP)
]

const exists = (path) => stat(path).then(() => true, () => false)
const isImage = (bytes) => IMAGE_SIGNATURES.some((sig) => sig.every((b, i) => bytes[i] === b))
const run = promisify(execFile)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Downloads with curl: upload.wikimedia.org answers 429 to Node's built-in fetch, while curl gets through.
// Retries 429/5xx with backoff (--retry honours Retry-After).
async function download(url) {
  const { stdout } = await run(
    'curl',
    ['-sSfL', '--retry', '4', '--retry-delay', '5', '--max-time', '120', '-A', 'toonlira-validation-corpus/1.0', url],
    { encoding: 'buffer', maxBuffer: 64 * 1024 * 1024 },
  )
  return new Uint8Array(stdout)
}

let fetched = 0
let failed = 0
for (const chapter of manifest.chapters) {
  if (only.size > 0 && !only.has(chapter.id)) continue
  const dir = join(root, chapter.id)
  await mkdir(dir, { recursive: true })
  for (const page of chapter.pages) {
    const target = join(dir, page.file)
    if (await exists(target)) continue
    try {
      const bytes = await download(page.url)
      if (!isImage(bytes)) throw new Error('response is not a JPEG/PNG/WebP image')
      await writeFile(target, bytes)
      await sleep(1500) // stay polite with shared hosts (upload.wikimedia.org rate-limits bursts)
      fetched++
      console.log(`ok   ${chapter.id}/${page.file} (${(bytes.length / 1024).toFixed(0)} KiB)`)
    } catch (error) {
      failed++
      console.error(`FAIL ${chapter.id}/${page.file}: ${error.stderr?.toString().trim() || error.message} <- ${page.url}`)
    }
  }
}
console.log(`${fetched} page(s) downloaded, ${failed} failure(s)`)
process.exitCode = failed > 0 ? 1 : 0
