# Correções da revisão independente 017 — 2026-11-02

## Escopo

Correção de código divergente da spec volátil aprovada, sem mudança de requisito,
sem abertura de gates e sem aquisição 021. A revisão independente de hoje
identificou R01–R03; este registro do executor apresenta correções e provas,
sem substituir o verdict do reviewer ou declarar conclusão física/operacional.

## R01 e R03: identidade proprietária

O bearer em memória agora pertence a gatewayKey. Bootstrap/sessão em voo são
compartilhados por gateway e geração, impedindo duas instalações diferentes
para reconcile/submit concorrentes. Cada waiter pode interromper a própria
espera sem cancelar outro; a autenticação compartilhada não envia imagens.

Limpar dados invalida a geração antes de abortar requests e serializa apenas
as mutações do SecureStore. Não aguarda rede. Respostas tardias e bearer já
resolvido mas ainda não entregue ao chamador são recusados após clear. Delete
aguarda uma gravação SecureStore já iniciada para não ressuscitar credenciais.
Uma recusa 401/403 só remove a mesma instalação proprietária, sem apagar outra.

Os testes red reproduziram reutilização entre gateways, recriação após clear e
duplicação concorrente. Sete testes de identidade passaram após a correção,
incluindo waiter independente e clear durante gravação/cache. Registro existente
SecureStore é preservado; não há nova persistência de conteúdo ou token bearer.

[Implementação de identidade](../../../../../src/entities/remote-processing-identity/model/remoteProcessingIdentity.ts); [regressões](../../../../../src/entities/remote-processing-identity/model/__tests__/remoteProcessingIdentity.test.ts).

## R02: recibos conhecidos e READY local

Uma coluna SQLite nullable, volatile_receipt_status, conserva STARTED/FINISHED/
FAILED sem usar estágios inventados do enum remoto antigo. CHECK exige contrato
2.0, referência de operação e valor permitido. Migration aditiva/idempotente
para versão mínima 10 verifica table_info, conserva histórico e não rebaixa uma
versão global superior. O plano de schema foi escrito antes do código em
[arquitetura e plano de dados](../../../../../../docs/volatile-processing-architecture.md).

A consulta vincula operação e observação em transação exclusiva. STARTED mantém
ambiguidade local e informa o último recibo em andamento; FINISHED informa que
o servidor produziu resultado, sem confirmar arquivo local; FAILED informa
falha remota. Perda de entrega continua falha local, sem READY e sem provider
novo. Consulta ausente/falha não inventa recibo. Terminais remotos conhecidos não
retrocedem para STARTED ou para desconhecido por uma consulta posterior falha.
O texto trilíngue explicita ausência de recuperação de conteúdo no servidor.

SQLite real verifica os três estados e round-trip, recusa de vínculo divergente,
upgrade de schema antigo, preservação da mídia/histórico, CHECK e rollback da
observação/operação/falha local quando o update da página falha. Controller
verifica consulta sem replay e falha de rede; RNTL verifica a distinção dos três
recibos nos três locales sem navegação ou READY local. Quatro suites/49 testes
passaram na rodada focada antes da última regressão de cache da identidade;
o gate geral da árvore final deve ser consultado no review corrente.

[Repository e migration](../../../../../src/entities/remote-processing-attempt/api/remoteProcessingAttemptRepository.ts); [SQLite real](../../../../../src/entities/remote-processing-attempt/api/__tests__/volatileAttemptSqlite.test.ts); [controller](../../../../../src/features/start-remote-processing/model/startRemoteProcessing.ts); [widget](../../../../../src/widgets/remote-processing/ui/RemoteProcessingPanel.tsx).

## Provas backend relacionadas

[Candidata 3: matriz nativa e HTTP integrado](../../../../../../api/apps/translation-gateway/docs/volatile-runtime-verification-2026-11-02.md) documenta duas rodadas privadas com recuperação após morte nativa/falha OCR,
pids.events sem recusas, scratch sem arquivos ao fim e 8 cenários/22 renders.
O backend completo passou com 2839 testes, zero falhas/erros, 114 skips; os
opt-ins nativos foram exercitados separadamente sem skip. A prova usa providers
sintéticos privados e não comprova qualidade real, operação pública ou aparelho.

## Limites e próximo review

017 permanece em revisão. 018–021 continuam bloqueadas até prontidão legítima;
021 ainda não consome o novo transporte. Originais/resultados já íntegros e
histórico não são apagados. Publicação das políticas, admissão do serviço alvo,
qualidade real e prova física do novo ciclo continuam verificações próprias.
Nenhum AC, checkbox ou gate é promovido por este arquivo.
