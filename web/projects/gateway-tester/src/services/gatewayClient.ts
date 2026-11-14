import axios from 'axios'

const API_BASE_URL = 'http://localhost:8084/v1'

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
})

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
  }
}

export const gatewayClient = {
  async getCapabilities(): Promise<Capabilities> {
    const response = await client.get('/capabilities')
    return response.data
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
  ): Promise<Job> {
    const formData = new FormData()
    formData.append('page', file)
    formData.append('mimeType', file.type)
    formData.append('byteSize', file.size.toString())
    formData.append('widthPx', '1024')
    formData.append('heightPx', '1024')
    formData.append('sourceLanguage', sourceLanguage)
    formData.append('targetLanguage', targetLanguage)
    formData.append('disclosureVersion', '1.0')
    formData.append('attemptRef', crypto.randomUUID())

    const response = await client.post('/page-jobs', formData, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Idempotency-Key': crypto.randomUUID(),
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
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

export default gatewayClient
