# isolation/

Diagnóstico de isolamento do worker e checagens do perfil de recursos. Docs:
[`worker-isolation-probe`](../../docs/worker-isolation/worker-isolation-probe.md),
[`infra/terraform`](../../infra/terraform/README.md).

| Arquivo | Função |
| --- | --- |
| `WorkerIsolationProbe.java` | Probe independente (só JDK, fora do JAR Spring): observa limites, mounts e scratch; nunca inicia o worker. |
| `WorkerIsolationProbeChecks.java` | Verificações com fixtures sintéticas do probe. |
| `worker-isolation-image.mjs` | Compila o probe e prepara o contexto de build da imagem (destino e hash explícitos; sem push/download). |
| `Dockerfile.isolation-probe` | Dockerfile da imagem do probe (JDK fixado por digest, usuário 1000). |
| `worker-isolation-probe.test.mjs` | Testa o probe (compila e executa localmente). |
| `worker-isolation-image.test.mjs` | Testa o preparo da imagem. |
| `worker-resource-profile.test.mjs` | Teste estrutural dos arquivos Terraform de recursos do worker. |
