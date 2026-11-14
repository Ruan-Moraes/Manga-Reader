import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import gatewayClient from './services/gatewayClient'
import BatchPanel from './BatchPanel'
import type { Installation, Session, Job } from './services/gatewayClient'

export default function App() {
  const [installation, setInstallation] = useState<Installation | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [currentJobRef, setCurrentJobRef] = useState<string | null>(null)
  const [jobHistory, setJobHistory] = useState<Job[]>([])

  // Capabilities query
  const { data: capabilities, isLoading: capLoading } = useQuery({
    queryKey: ['capabilities'],
    queryFn: () => gatewayClient.getCapabilities(),
    refetchInterval: 10000,
  })

  // Installation mutation
  const createInstallationMutation = useMutation({
    mutationFn: () => gatewayClient.createInstallation(),
    onSuccess: (data) => {
      setInstallation(data)
      setSession(null)
    },
  })

  // Session mutation
  const createSessionMutation = useMutation({
    mutationFn: () =>
      gatewayClient.createSession(installation!.installationRef, installation!.credential),
    onSuccess: (data) => {
      setSession(data)
    },
  })

  // Get job query
  const { data: currentJob, isLoading: jobLoading, refetch: refetchJob } = useQuery({
    queryKey: ['job', currentJobRef],
    queryFn: () => gatewayClient.getJobByRef(session!.accessToken, currentJobRef!),
    enabled: !!session && !!currentJobRef,
    refetchInterval: (query) => (query.state.data?.status === 'READY' ? false : 2000),
  })

  const handleCreateInstallation = () => {
    createInstallationMutation.mutate()
  }

  const handleCreateSession = () => {
    createSessionMutation.mutate()
  }

  const handleCancelJob = async () => {
    if (currentJobRef && session) {
      const result = await gatewayClient.cancelJob(session.accessToken, currentJobRef)
      setJobHistory((prev) =>
        prev.map((job) => (job.jobRef === currentJobRef ? result : job))
      )
    }
  }

  const handleAcknowledgeResult = async () => {
    if (currentJobRef && session) {
      await gatewayClient.acknowledgeResult(session.accessToken, currentJobRef)
      refetchJob()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8 pt-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            🚀 Gateway Tester
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Ferramenta para testar e debugar o Translation Gateway
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Status & Setup */}
          <div className="space-y-6">
            {/* Capabilities Status */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">
                📊 Status Gateway
              </h2>
              {capLoading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                </div>
              ) : capabilities ? (
                <div className="space-y-2 text-sm">
                  <p className="text-green-600 dark:text-green-400">✅ Gateway Online</p>
                  <p className="text-slate-600 dark:text-slate-300">
                    Gerado: {new Date(capabilities.generatedAt).toLocaleTimeString()}
                  </p>
                  <p className="text-slate-600 dark:text-slate-300">
                    Válido até: {new Date(capabilities.validUntil).toLocaleTimeString()}
                  </p>
                  <p className="font-mono text-xs text-slate-500 dark:text-slate-400 break-all">
                    ETag: {capabilities.etag}
                  </p>
                </div>
              ) : (
                <p className="text-red-600 dark:text-red-400">❌ Gateway Offline</p>
              )}
            </div>

            {/* Installation Setup */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">
                🔧 Setup
              </h2>
              <button
                onClick={handleCreateInstallation}
                disabled={createInstallationMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                {createInstallationMutation.isPending ? 'Criando...' : 'Criar Instalação'}
              </button>

              {installation && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg space-y-2">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                    Instalação Criada ✓
                  </p>
                  <p className="text-xs font-mono text-blue-700 dark:text-blue-300 break-all">
                    Ref: {installation.installationRef}
                  </p>
                  <p className="text-xs font-mono text-blue-700 dark:text-blue-300 break-all">
                    Cred: {installation.credential}
                  </p>

                  <button
                    onClick={handleCreateSession}
                    disabled={createSessionMutation.isPending || !installation}
                    className="w-full mt-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-2 px-4 rounded-lg transition"
                  >
                    {createSessionMutation.isPending ? 'Criando Sessão...' : 'Criar Sessão'}
                  </button>
                </div>
              )}

              {session && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 rounded-lg space-y-2">
                  <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                    Sessão Ativa ✓
                  </p>
                  <p className="text-xs font-mono text-green-700 dark:text-green-300 break-all">
                    Token: {session.accessToken.slice(0, 20)}...
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    Válida até: {new Date(session.expiresAt).toLocaleTimeString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Center Column - Job Submission */}
          <div className="lg:col-span-2 space-y-6">
            {session && (
              <BatchPanel
                accessToken={session.accessToken}
                disclosureVersion={capabilities?.disclosure?.version ?? ''}
                languages={capabilities?.supportedLanguages ?? []}
                dailyQuota={capabilities?.dailyInstallationQuota}
              />
            )}

            {/* Current Job Status */}
            {currentJobRef && session && (
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                    📦 Job em Andamento
                  </h2>
                  <button
                    onClick={() => refetchJob()}
                    className="text-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 px-3 py-1 rounded transition"
                  >
                    🔄 Recarregar
                  </button>
                </div>

                {jobLoading ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
                  </div>
                ) : currentJob ? (
                  <div className="space-y-3">
                    <p className="font-mono text-xs text-slate-600 dark:text-slate-400 break-all">
                      Ref: {currentJob.jobRef}
                    </p>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          currentJob.status === 'READY'
                            ? 'bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-100'
                            : currentJob.status === 'PROCESSING'
                              ? 'bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-100'
                              : 'bg-yellow-200 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100'
                        }`}
                      >
                        {currentJob.status}
                      </span>
                      {currentJob.status === 'PROCESSING' && (
                        <div className="animate-spin">⌛</div>
                      )}
                    </div>

                    {currentJob.error && (
                      <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                        <p className="text-sm font-semibold text-red-600 dark:text-red-300">
                          Erro: {currentJob.error.code}
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-300">
                          Retentável: {currentJob.error.retryable ? 'Sim' : 'Não'}
                        </p>
                      </div>
                    )}

                    {currentJob.result && (
                      <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg space-y-2">
                        <p className="text-sm font-semibold text-green-600 dark:text-green-300">
                          ✓ Resultado Disponível
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-300">
                          Dimensões: {currentJob.result.widthPx}x{currentJob.result.heightPx}
                        </p>
                        {currentJob.result.quality?.status === 'NEEDS_REVIEW' && (
                          <p
                            className="text-xs font-semibold text-amber-700 dark:text-amber-300"
                            title={currentJob.result.quality.issues.join(', ')}
                          >
                            ⚠ Revisar: parte do texto ficou no idioma original
                          </p>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Horário: {new Date(currentJob.serverTime).toLocaleTimeString()}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      {currentJob.status !== 'READY' && (
                        <button
                          onClick={handleCancelJob}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                        >
                          ❌ Cancelar
                        </button>
                      )}
                      {currentJob.status === 'READY' && (
                        <button
                          onClick={handleAcknowledgeResult}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                        >
                          ✅ Confirmar Recebimento
                        </button>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* Job History */}
            {jobHistory.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">
                  📋 Histórico de Jobs
                </h2>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {jobHistory.map((job, idx) => (
                    <div
                      key={idx}
                      onClick={() => setCurrentJobRef(job.jobRef)}
                      className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition"
                    >
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-mono text-slate-700 dark:text-slate-300">
                          {job.jobRef.slice(0, 8)}...
                        </p>
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300">
                          {job.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-center text-sm text-slate-600 dark:text-slate-400">
          <p>
            Gateway Tester v0.1.0 • Conectado a: <code>/api → http://localhost:8084</code>
          </p>
        </div>
      </div>
    </div>
  )
}
