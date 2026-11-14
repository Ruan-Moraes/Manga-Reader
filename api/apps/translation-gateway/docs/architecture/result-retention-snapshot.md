# Retenção de resultado imutável — plano antes do código

Plano inicial de 020/TASK-006, elaborado antes de corrigir o finding confirmado na
[auditoria local](../../../../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/original-retention-audit-2026-10-09.md).
Não muda intenção, defaults, limite de uma hora, contratos HTTP/task/manifestos,
qualidade, codec ou estado público. Sem cloud, credenciais ou provider real.

## Banco e modelo BCNF

PostgreSQL para metadados transacionais; bucket privado para bytes. V9 aditiva:

- `processing_jobs.result_retention_seconds INTEGER NOT NULL DEFAULT 3600`:
  prazo publicado na admissão; id e chaves candidatas determinam o snapshot.
  Replay não o renova; política futura não o amplia.
- `processing_job_stages.result_expires_at TIMESTAMPTZ NULL`: deadline efetivo
  dos dois artefatos finais, presente somente em RENDERING/SUCCEEDED.
  `(job_id, stage)` determina o atributo. É um evento técnico independente
  de `completed_at`: inclui o tempo anterior ao commit, quando o upload já
  pode estar visível. Não persistir uma coluna redundante de data de upload.

Antes do primeiro upload final, capturar uma vez um deadline usando o prazo
do job. Locator privado versionado da imagem/manifesto compartilha esse deadline
e partes aleatórias. Ele permite purge sem SQL, inclusive de órfão/upload tardio.
Gravar o mesmo deadline com chave/hash, na transação que conclui RENDERING/READY.
Não manter transação aberta durante upload e não renovar TTL entre os arquivos.

Artifacts extrai o deadline dos dois locators versionados e exige igualdade;
o vínculo de chave/hash já o inclui sem campo redundante no DTO de upload.
A projeção revalida o deadline do locator contra o timestamp persistido.
Locators antigos são admitidos somente no limite histórico de 3600 segundos;
jobs abreviados exigem o formato versionado. Persistência/consulta sempre
fornecem o timestamp efetivo explícito, sem cache ou renovação por leitura.

## Integridade

CHECK de prazo 1..3600. Sucesso de RENDERING exige deadline não nulo e posterior
a `completed_at`; outras etapas/estados não recebem esse atributo. FK/cascade,
PK, checks de artefatos e unicidades existentes permanecem.
Complete sob lock rejeita deadline já vencido ou incompatível com o snapshot;
guards de retenção original também permanecem. Commit desconhecido conserva
artefatos e exige prova exata, incluindo deadline, antes de descarte.

Legacy: default 3600 e deadline a partir da conclusão original, nunca da
migration. Isso não prova conformidade com política abreviada antiga.
Banco compartilhado com policy não padrão/dados inconsistentes exige auditoria
e backfill autorizado antes de implantação; aplicar V9 somente em testes locais.

## Índices e derivados

PKs e índices existentes; consultas limitadas por job/batch. Conferir planos
antes de adicionar índice. Nenhum contador, cache, tabela de texto/regiões ou
resposta do provider. Locator é a cópia imutável técnica necessária ao purge
independente do SQL, não um estado concorrente de job.

## Código coordenado

Coordenar NewJob/admissão/INSERT, projeção de render e resultado, Artifacts,
complete, expiração por owner/batch, assinatura e storage local/GCS.
`ReadyResultReference` deve carregar o deadline aceito, não calcular um novo
com configuração atual. Configuração menor pode antecipar encerramento, nunca
ampliar o limite persistido. URLs continuam curtas e contidas no prazo efetivo.
Purge dos resultados vencidos deve continuar mesmo com uma fase SQL falhando,
sem incluir originais, outras namespaces ou fonte reutilizável.

## Provas antes de integração/gates

Regressão red da ampliação 60→3600 com snapshot persistido; admissão/replay,
limites 1/3600, configuração menor/maior/inválida, deadline exato e assinatura.
V1–V9 limpa e upgrade V8; constraints e plano real, rollback/cancelamento,
confirmação perdida e commit atrasado por lock. Storage sem SQL, dois uploads
com mesmo prazo, órfão tardio, create-only, symlink e limpeza parcial.
Nenhum provider é repetido. Testes globais offline/Docker, web/mobile/SDD,
links/formato dirigido/diff. Provas Linux proporcionais com JAR recompilado;
não atribuir ao novo runtime os números de snapshots históricos.

Esta seção preserva o plano anterior ao código; não é aprovação operacional.
TASK-006/020/021 permanecem conservadoras até verificação integral.

## Parcela executada — 2026-10-09 UTC

V9, snapshot/deadline, guards/projeções e purge local/GCS estão codificados.
Dois testes reproduziram a ampliação e repasse ao signer antes do fix.
V1–V9 e upgrade V8→V9 conferidos no PostgreSQL 17, sem banco compartilhado.
Oito testes novos de persistência cobrem política/replay, prazo exato,
rollback e espera real de lock. O fluxo integral de 23 casos e seis workers
Linux com JAR novo passaram, sem provider real. Gates e limites da parcela na
[evidência datada](../../../../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/result-retention-snapshot-2026-10-09.md).
