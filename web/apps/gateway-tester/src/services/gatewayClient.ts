import axios from 'axios'

const API_BASE_URL = '/api/v1'

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
})

/** A chapter name the gateway decided, as the result manifest (1.2) reports it. */
export interface ChapterTerm {
  source: string
  target: string
}

export interface Installation {
  contractVersion: string
  installationRef: string
  credential: string
  createdAt: string
}

export interface Session {
  contractVersion: string
  accessToken: string
  expiresAt: string
}

export interface Capabilities {
  generatedAt: string
  validUntil: string
  etag: string
  [key: string]: any
}

/** Page quality; absent for results rendered before the gateway persisted it. Never blocks READY. */
export interface PageQuality {
  status: 'OK' | 'NEEDS_REVIEW'
  issues: Array<'TEXT_NOT_RENDERED' | 'ALL_TEXT_NOT_RENDERED' | 'TEXT_TOO_SMALL'>
}

export interface Job {
  contractVersion: string
  jobRef: string
  status: string
  serverTime: string
  error?: {
    code: string
    retryable: boolean
  }
  result?: {
    manifestVersion: string
    widthPx: number
    heightPx: number
    expiresAt: string
    image: {
      url: string
      mimeType: string
      byteSize: number
      sha256: string
      expiresAt: string
    }
    manifest: {
      url: string
      mimeType: string
      byteSize: number
      sha256: string
      expiresAt: string
    }
    quality?: PageQuality
  }
}

/** The volatile contract (v2): one synchronous call per page; nothing is stored or downloaded later. */
const V2_BASE_URL = '/api/v2'
const RESULT_MAGIC = 0x54565231

/** A v2 call refused by the gateway; `code` is its problem code (e.g. `capabilities-unavailable`). */
export class GatewayV2Error extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly retryable: boolean,
  ) {
    super(code)
  }
}

/** The page's translated image and its manifest (1.2: regions, quality, the chapter names it used). */
export interface ProcessedPage {
  manifestJson: string
  image: Blob
}

/** UUIDv7 (time-ordered): the v2 gateway only accepts these as Idempotency-Key. */
export function uuidV7(now: number = Date.now()): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  let time = BigInt(now)
  for (let index = 5; index >= 0; index--) {
    bytes[index] = Number(time & 0xffn)
    time >>= 8n
  }
  bytes[6] = (bytes[6]! & 0x0f) | 0x70
  bytes[8] = (bytes[8]! & 0x3f) | 0x80
  const hex = [...bytes].map((value) => value.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

async function v2Failure(response: Response): Promise<GatewayV2Error> {
  let code = `HTTP ${response.status}`
  let retryable = false
  try {
    const body = (await response.json()) as { code?: string; retryable?: boolean }
    if (body.code) code = body.code
    retryable = body.retryable === true
  } catch {
    // Not a problem document.
  }
  return new GatewayV2Error(response.status, code, retryable)
}

/** Splits the binary result: magic, manifest frame, image frame (VolatileTranslationController). */
export function readProcessedPage(bytes: ArrayBuffer): ProcessedPage {
  const view = new DataView(bytes)
  if (bytes.byteLength < 12 || view.getUint32(0) !== RESULT_MAGIC) throw new Error('invalid-result')
  const manifestLength = view.getUint32(4)
  const imageOffset = 8 + manifestLength
  if (imageOffset + 4 > bytes.byteLength) throw new Error('invalid-result')
  const imageLength = view.getUint32(imageOffset)
  if (imageOffset + 4 + imageLength !== bytes.byteLength) throw new Error('invalid-result')
  return {
    manifestJson: new TextDecoder().decode(new Uint8Array(bytes, 8, manifestLength)),
    image: new Blob([new Uint8Array(bytes, imageOffset + 4, imageLength)], { type: 'image/webp' }),
  }
}

export const gatewayClient = {
  async getCapabilities(): Promise<Capabilities> {
    const response = await fetch(`${V2_BASE_URL}/capabilities`)
    if (!response.ok) throw await v2Failure(response)
    return { ...(await response.json()), etag: response.headers.get('etag') ?? '' }
  },

  /** One page, synchronously: OCR, translation and render; the result comes back in this response only. */
  async processPage(
    accessToken: string,
    file: File,
    sourceLanguage: string,
    targetLanguage: string,
    options: { widthPx: number; heightPx: number; disclosureVersion: string; contextRef?: string },
  ): Promise<ProcessedPage> {
    const response = await fetch(`${V2_BASE_URL}/page-translations`, {
      method: 'POST',
      body: file,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': file.type,
        'Idempotency-Key': uuidV7(),
        'X-Image-Byte-Size': String(file.size),
        'X-Image-Width': String(options.widthPx),
        'X-Image-Height': String(options.heightPx),
        'X-Source-Language': sourceLanguage,
        'X-Target-Language': targetLanguage,
        'X-Disclosure-Version': options.disclosureVersion,
        // Pages of one chapter share it, so a name is translated the same way on all of them.
        ...(options.contextRef ? { 'X-Context-Ref': options.contextRef } : {}),
      },
    })
    if (response.status !== 200) throw await v2Failure(response)
    return readProcessedPage(await response.arrayBuffer())
  },

  /** Names the gateway already decided for the chapter: refills its memory, e.g. after a long pause. */
  async seedGlossary(
    accessToken: string,
    contextRef: string,
    sourceLanguage: string,
    targetLanguage: string,
    disclosureVersion: string,
    terms: ChapterTerm[],
  ): Promise<void> {
    const query = new URLSearchParams({ sourceLanguage, targetLanguage })
    const response = await fetch(`${V2_BASE_URL}/page-translations/chapter-contexts/${contextRef}/glossary?${query}`, {
      method: 'PUT',
      body: JSON.stringify(terms),
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'X-Disclosure-Version': disclosureVersion },
    })
    if (response.status !== 204) throw await v2Failure(response)
  },

  async createInstallation(): Promise<Installation> {
    const response = await client.post('/anonymous/installations')
    return response.data
  },

  async createSession(installationRef: string, credential: string): Promise<Session> {
    const response = await client.post('/anonymous/sessions', {
      installationRef,
    }, {
      headers: {
        'Authorization': `Bearer ${credential}`,
      },
    })
    return response.data
  },

  async submitPage(
    accessToken: string,
    file: File,
    sourceLanguage: string,
    targetLanguage: string,
    options: {
      widthPx: number
      heightPx: number
      disclosureVersion: string
      contextRef?: string
      glossary?: ChapterTerm[]
    },
  ): Promise<Job & { idempotencyKey: string }> {
    const idempotencyKey = crypto.randomUUID()
    const formData = new FormData()
    formData.append('page', file)
    formData.append('mimeType', file.type)
    formData.append('byteSize', file.size.toString())
    formData.append('widthPx', String(options.widthPx))
    formData.append('heightPx', String(options.heightPx))
    formData.append('sourceLanguage', sourceLanguage)
    formData.append('targetLanguage', targetLanguage)
    formData.append('disclosureVersion', options.disclosureVersion)
    formData.append('attemptRef', crypto.randomUUID())
    // Pages of one chapter share it, so a name is translated the same way on all of them.
    if (options.contextRef) formData.append('contextRef', options.contextRef)
    // Names the gateway already decided for the chapter: refills its memory after a long pause.
    if (options.contextRef && options.glossary?.length) formData.append('glossary', JSON.stringify(options.glossary))

    const response = await client.post('/page-jobs', formData, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Idempotency-Key': idempotencyKey,
        'Content-Type': 'multipart/form-data',
      },
    })
    return { ...response.data, idempotencyKey }
  },

  async getJobByRef(accessToken: string, jobRef: string): Promise<Job> {
    const response = await client.get(`/page-jobs/${jobRef}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })
    return response.data
  },

  async getJobByIdempotency(accessToken: string, idempotencyKey: string): Promise<Job> {
    const response = await client.get(`/page-jobs/by-idempotency/${idempotencyKey}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })
    return response.data
  },

  async cancelJob(accessToken: string, jobRef: string): Promise<Job> {
    const response = await client.post(`/page-jobs/${jobRef}/cancel`, {}, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })
    return response.data
  },

  async acknowledgeResult(accessToken: string, jobRef: string): Promise<void> {
    await client.post(`/page-jobs/${jobRef}/ack`, {}, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })
  },
}

export async function readImageSize(file: File): Promise<{ widthPx: number; heightPx: number }> {
  const bitmap = await createImageBitmap(file)
  try {
    return { widthPx: bitmap.width, heightPx: bitmap.height }
  } finally {
    bitmap.close()
  }
}

export async function downloadResultImage(url: string): Promise<Blob> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Result download failed (HTTP ${response.status})`)
  return response.blob()
}

export default gatewayClient
