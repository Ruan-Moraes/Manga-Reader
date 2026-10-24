# Evidência parcial — limpeza imediata dos workers, 2026-10-04

Parcela da 020/TASK-006 (AC-001/005/006) e 017/TASK-017 (AC-010).
020 in-progress/open; 021 approved/blocked. Nenhum serviço Google, credencial,
chamada paga, upload real, deploy, dependência ou default ativado.

## Contrato e modelagem

[Plano](../../../../../../api/apps/translation-gateway/docs/lifecycle-retention.md)
registrado antes da implementação conforme database-design. Reutiliza V7:
PostgreSQL para intenção/lease, job_id PK determinando seus atributos (BCNF),
FK cascade/CHECKs e índices preservados. Objetos permanecem privados no storage.
Nenhuma V8, contador, cache ou chave/texto duplicado no banco.

Enqueue elegível + claim por job transacionais. Tentativa de limpeza em finally
dos três workers habilitados, depois de localizar job. Sem claim de fila global,
sem I/O em job ativo, sem substituição de resultado em falha SQL/delete. READY
elimina somente original; terminal FAILED/CANCELLED elimina objetos conhecidos.
Exclusão do original não confirma aquisição nem cria ACK. Intenção concluída
não reinicia em reentrega. Storage ocorre fora de transação.

Fases de cleanup independentes: erro SQL não impede varredura privada por idade;
erro storage não impede retenção de metadados. Erro final sem causa bruta ou
parâmetros. Não comprova funcionamento quando bootstrap/scheduler/storage
estão indisponíveis nem um SLA de produção. Cancelamento/dispatch fora do worker
e operação integral continuam em auditoria; TASK-006/TASK-017 abertas.

## Testes e resultados focalizados

Testes primeiro: chamada individual, ausência de scan global, job ativo/lease,
falha SQL sanitizada, delete/reschedule e fases independentes. Red anterior por
tipos/métodos ausentes preservado no histórico da execução. Ajustes posteriores
alinharam os harnesses aos construtores e ao storage próprio de cada fixture;
nenhum fallback no-op foi introduzido em produção.

Primeira integração identificou seis testes que ainda exigiam OCR retido após
falha terminal; corrigidos para exigir remoção nesse estado, preservando bytes
exatos em sucesso RENDERING. Nova fixture teve dois erros de accessor (metadados
não pertencem a ProcessingJob) e um stub que invocava resposta anterior durante
configuração; corrigidos usando projeção existente e doThrow. Nenhum gate foi
enfraquecido, teste removido ou conteúdo privado usado.

Rodada focalizada terminal exit 0: 204 testes nas oito classes de aplicação/
PostgreSQL/worker selecionadas. Cadeia V1–V7 limpa e upgrade continuam aprovados.

- PostgreSQL: claim individual não consome outros jobs; ativo não materializa
  referência; proxy suspende TX externa; lease/retry e CAS preservados.
- Workers reais com MockMvc/filtros, storage local, fontes/WebP e PostgreSQL:
  OCR/tradução falsos falham uma única vez; objetos conhecidos removidos,
  amostra reutilizável intacta e intenção confirmada. Cancelamento concorrente
  mantém original enquanto provider de outra entrega está em execução.
- Delete original indisponível: READY continua válido, intenção pendente; retry
  após um minuto remove somente original, preserva imagem/manifesto/hash e zero ACK.
- Upload WebP com confirmação perdida e delete falho: objeto sem referência
  persiste, mesmo após conclusão da intenção terminal. Varredura após uma hora
  remove esse órfão real apesar de erro SQL injetado; amostra fora do storage
  privado preservada. Nenhuma segunda chamada OCR/tradução.
- Commit de render com confirmação perdida após ACK conserva ambas referências;
  rollback/cancelamento elimina saídas não aceitas. Defaults desabilitados não
  executam limpeza nem chamadas ao provider.

Fixtures sintéticas e inferência falsa não comprovam qualidade linguística ou
operação cloud. Nenhum runtime mobile alterado; performance mobile não aplicável,
sem alegar memória/latência nativa a partir desses testes funcionais.

## Integridade e gates

Checksum técnico corrente separado do SDD mobile: 269 arquivos de src/scripts/
openapi, pom e Terraform (.tf/tfvars.example), ordenados pelo caminho relativo;
SHA-256 de caminho + NUL + bytes + NUL:
`4cc956fd7a787c9e2a94d7b891555656cde546bcd13356f6c8bf49fc68392239`.
Fotografia histórica anterior permanece na
[evidência da fila](lifecycle-retention-2026-10-04.md).

Maven global offline/Docker terminal exit 0, iniciado em
`2026-10-04T15:51:48.950Z`. Gateway: 847 testes/69 classes, zero failures/errors/
skipped nesta execução. XMLs frescos contados antes da suíte leve; quatro
harnesses históricos excluídos. RenderingPersistenceTest 66 casos,
RenderingWorkerIntegrationTest 14 casos e LocalFileRenderAdapterTest 12 casos.
Suíte leve posterior exit 0, sem misturar sua contagem com a global.

Comando global, no diretório api, usando apenas o codec já instalado:

```bash
./mvnw -o -q test \
  -Drenderer.native.enabled=true \
  -Drenderer.cwebp.path=/opt/homebrew/Cellar/webp/1.6.0/bin/cwebp \
  -Drenderer.cwebp.sha256=b31070342821b6316c756e22a336a72bbde4a6e4f2a9cabb22ffd49a73cc89cf \
  -Drenderer.dwebp.path=/opt/homebrew/Cellar/webp/1.6.0/bin/dwebp \
  -Drenderer.dwebp.sha256=0fea0ca571920dac090ca32f4e4559b5125b92e33963b314f27c6757c1c1201c
```

Caminhos locais não representam empacotamento de produção. Node tooling
`node --test scripts/*.test.mjs`: 85 pass/um opt-in de fonte não selecionado.
Web `pnpm exec tsc -b`: exit 0. Mobile `pnpm check` integral: exit 0,
116 suítes/892 testes, além de 30 testes de performance, 24 SDD e seis FSD;
typecheck/lint/formato/links aprovados. Warnings existentes de act dos ícones
Expo não ocultados. Formatação somente nos documentos alterados e diff-check
aprovados. Rebase de headers mecânico, sem renovar conclusões históricas de
outras features; SDD e links reexecutados após estabilizar a evidência.

TASK-002/006/007/008 continuam abertas; próxima implementação não deve presumir
distribuição/caps/deadline ou qualidade aprovadas. Auditoria de cancelamento e
dispatch fora do worker observou intenção atômica, mas sem tentativa imediata
nesses coordenadores; a limpeza atual depende do executor periódico. Bootstrap
SQL e indisponibilidade do scheduler/storage continuam riscos operacionais,
não resolvidos por independência das fases dentro do use case.
