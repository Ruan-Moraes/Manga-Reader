# Purge isolado por objeto — 2026-10-09 UTC

Parcela de 020/TASK-006 e 017/TASK-017. 020 `in-progress/open`, verdict
`changes-requested`; 021 `approved/blocked`. Sem alteração de prazos,
schema/migrations V1–V9, contratos, codec/qualidade ou defaults cloud. Testes
usam GCS mockado e bytes locais sintéticos; nenhuma mídia privada ou provider.
Performance mobile N/A, sem runtime/UI do aplicativo.

## Finding e plano anterior

Um objeto com locator inválido ou erro de metadados/delete abortava a fase
antes de outros objetos vencidos. Oito casos reproduziram isso antes do fix:
cinco no GCS mockado e três no storage local, zero errors. Não é ausência de
benchmark ou falha cloud. O [plano anterior ao código](../../../../../../api/apps/translation-gateway/docs/cleanup-isolation.md)
preserva PostgreSQL/BCNF/PKs/cascades e não cria tabela, índice ou contador.

## Correção e limites

As três fases compartilham uma varredura por adapter, com erro por objeto e
continuação do inventário ainda enumerável. Qualquer falha resulta em
storage-unavailable ao final, sem causa/chave/caminho/resposta bruta.
Não devolver contagem parcial como sucesso nem repetir automaticamente a fase.
Erro de enumeração propaga falha, pois não prova inventário completo.

Local valida root e não segue symlink; percorre caminhos sem lista integral.
Isso é mecanismo confirmado por inspeção, não medição de ganho de memória.
GCS confere bucket/prefixo antes de delete. Metadado legado sem timestamp é
pendência, não sucesso; um locator versionado válido ainda permite purge sem
timestamp de criação. Originais/resultados continuam usando seus snapshots,
e o failsafe de uma hora não foi reduzido ou prolongado.

## Evidência

- 28 testes dos adapters aprovados: 11 locais e 17 GCS, zero failures/errors/skips.
- Erro no primeiro objeto não impede o válido; erro final continua sanitizado.
  Nova rodada local remove o objeto que ficou pendente, depois retorna zero.
- Enumeração interrompida após uma deleção não reconhece conclusão nem repete
  listagem. Objetos de bucket/prefixo alheios não recebem delete.
- Regressões de create-only, boundary, publicação tardia, namespace e fonte
  reutilizável/symlink permanecem. Não toca imagens de usuários.
- Fluxo integral de 23 casos com PostgreSQL e arquivos/codec reais aprovado;
  OCR/tradução exclusivamente falsos. Gates globais e prova Linux atuais são
  registrados na [review](../review.md), não atribuídos a matrizes anteriores.

Snapshot gateway de fonte/teste/config: 369 arquivos,
SHA-256 `74f73fe47623bc68e76d75312627cf17b3134de7f2fddb789619f19528ced311`.
JAR recompilado offline:
`954b42c29bf71ec316e29d59c87e133d6b2b7541fbf69564a5eb77a234a091cd`.
Checksum SDD mobile é separado; não representa o Java. Sem novos downloads.

Reprodução: reactor `api/`, Maven `-o`, selecionar
`LocalObjectStorageAdapterTest,GoogleCloudStorageAdapterTest`; fluxo seleciona
também `RenderingWorkerIntegrationTest,CleanupGatewayUseCaseTest` com pins
locais já documentados e Docker. Não usar serviços Google ou imagens privadas.

## Pendências

Retenção integral, disponibilidade de bootstrap/scheduler/storage, exclusão
cloud/soft delete/backups/legado, orçamento agregado com SDK/layout residentes,
qualidade e operação continuam abertos. Essa parcela não é SLA cloud ou prova
de memória total, nem encerra TASK-006/020 ou abre a 021.
