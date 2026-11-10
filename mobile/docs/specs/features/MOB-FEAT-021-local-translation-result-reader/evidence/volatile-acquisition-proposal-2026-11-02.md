# Revisão de escopo e proposta de execução 021 — 2026-11-02

## Natureza e limites

Documento informativo solicitado por Ruan por meio da revisão independente do
integrador. Não é `tasks.md`, nova Target Spec, aceite ou evidência de execução
da aquisição 2.0. A [spec 021](../spec.md) permanece aprovada com gate bloqueado;
não houve alteração de runtime, status, gates, ACs ou checksums pelo reviewer.

Na fotografia desta leitura, 019 está in-progress/open e aguarda o gate final
do integrador. 026, 027 e 051 estão verification-pending. A abertura da 021
depende do registro legítimo de suas dependências e da reconciliação de
spec/registry, conforme AGENTS e DEC-008. Este documento não antecipa essa
abertura. A 020 não consta em blocked_by da 021; não foi adicionada uma
dependência implícita nem foi promovida sua admissão operacional.

Foram aplicados os roteiros sdd-reviewer, sdd-task-planner e database-design
somente para análise/proposta. Enquanto o gate estiver bloqueado, os itens
abaixo não são tasks ativas nem autorização para implementação antecipada.

## Coerência 019–021 e direção de privacidade

- A 019 mantém regiões, texto e manifesto em memória no servidor; valida IDs e
  limites antes do renderer, com modelo global explícito e sem replay pago.
- A 020 recebe a mesma sessão em memória e entrega WebP/manifesto autenticados,
  limitados e verificáveis. A memória, o processo nativo e o cleanup precisam
  de suas próprias provas; o cliente não transforma isso em aprovação cloud.
- A 021 valida e persiste no aparelho antes de READY, permite leitura offline
  e não oferece recuperação de conteúdo no servidor ou ACK de remoção.
- Recibos/logs operacionais sanitizados continuam separados do conteúdo,
  conforme DEC-008 e a [arquitetura aprovada](../../../../../../docs/volatile-processing-architecture.md).
- As provas c5 relatadas de HTTP, matriz nativa e visual são provas técnicas
  privadas com providers sintéticos. Não equivalem a benchmark humano, prova
  AMD64/Compute ou validação no aparelho; não foram promovidas por esta revisão.

Não foi encontrada contradição de intenção entre esses três contratos.
O consumidor 1.0 atual é implementação divergente do novo transporte, ainda
isolada do handoff 2.0 pelo widget. A direção do requisito não precisa mudar
para acomodar esse código antigo.

## Lacunas concretas observadas na implementação atual

1. [Controller de aquisição](../../../../../src/features/acquire-remote-translation-result/model/acquireRemoteTranslationResult.ts)
   consulta `/v1/page-jobs`, baixa URLs privadas e envia ACK. Não toma a entrega
   2.0. O caminho de resultado já salvo também tenta ACK; retomada local deve
   funcionar sem esse efeito de rede.
2. [Hook de aquisição](../../../../../src/features/acquire-remote-translation-result/model/useAcquireRemoteTranslationResult.ts)
   mantém polling/backoff e cinco estágios derivados do contrato antigo. A
   resposta direta não comunica esses cinco estágios e não autoriza simulá-los.
3. O [widget](../../../../../src/widgets/remote-processing/ui/RemoteProcessingPanel.tsx)
   só encaminha contrato 1.0 para esse hook. A proteção evita chamadas legadas
   após o handoff 2.0, mas ainda não implementa a aquisição nova.
4. A [entrega em memória](../../../../../src/entities/remote-processing-attempt/model/volatileDelivery.ts)
   já oferece take único, sinal de interrupção e dispose. Falta consumidor que
   respeite essa posse até terminar todas as leituras/validações/gravações.
5. Parser de manifesto, staging privado, writer transacional e auto-open já
   existem. Reuso exige regressões do ciclo 2.0, sem importar aceites antigos.
   O writer atual exige remote_status READY; esse campo isolado não substitui
   validação dos bytes, contrato 2.0, operação e vínculos locais atuais.
6. A reconciliação de arquivos atual remove arquivos não referenciados por
   resultado. É necessário verificar sua ordem e exclusão mútua com aquisição
   e COMMIT ambíguo antes de permitir limpeza sobre artefatos em uso/incertos.

## COMMIT ambíguo, rollback e recuperação local

A spec permite concluir localmente um commit quando já existe arquivo completo
e verificado. Ela não obriga criar journal novo para recuperar toda aquisição
interrompida antes do COMMIT. A frase obrigatória sobre reconciliar falha entre
move e commit exige recuperar um estado local coerente, sem resultado duplicado
ou repetição automática de provider.

A abordagem existente é aproveitável:

- Após erro do callback de COMMIT, consultar a linha durável e conferir
  source_kind, attempt, arquivo e hash. Se confirmar publicação, conservar o
  resultado e não apagar seu arquivo.
- Se a consulta estiver indisponível ou não for possível determinar o destino
  da transação, conservar o promovido até resolver a incerteza. Não apresentar
  READY sem confirmação nem removê-lo como se houvesse rollback confirmado.
- Com rollback/ausência de publicação comprovados e sem operação em voo que
  ainda possa publicar, remover somente os arquivos criados pela aquisição e
  manter estado local coerente. Se o conteúdo foi perdido, exigir nova execução
  explicitamente confirmada pela 017; nenhuma rotina de recuperação repete OCR
  ou tradução automaticamente.
- Resultado já íntegro e efetivado pode ser retomado sem rede, independente de
  sessão anônima, credencial, prazo do recibo ou disponibilidade do gateway.

O executor deve provar restart e falhas nessa abordagem. A limpeza genérica
não pode competir com o dono ativo nem eliminar o único arquivo de uma
publicação ainda incerta. Isso não autoriza conservar indefinidamente lixo
inacessível: resolver a transação primeiro e reconciliar depois.

Recuperar também um par imagem/manifesto completo que nunca tenha chegado ao
COMMIT é uma alternativa possível, não requisito adicional desta proposta.
Se escolhida, os vínculos e a validação devem ser demonstrados; não introduzir
journal, coluna ou documento duplicado de conteúdo por presunção.

## Sequência concreta proposta após abertura legítima

| Item proposto                                           | ACs           | Trabalho e prova correspondente                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P01 — ativar a fronteira 2.0                            | 001, 002, 006 | Introduzir o consumo da entrega no controller e integrar o widget somente quando houver código real. Testar take único e ausência de GET/URL/ACK/POST de processamento na aquisição e na retomada. Preservar leitura puramente local de resultados antigos íntegros.                                                             |
| P02 — validar a resposta integral                       | 002, 006      | Conferir hash da imagem, MIME real estático, bytes, dimensões/pixels, manifesto estrito e vínculos operação/attempt/primeira página/projeto/par/original. Reusar parser existente; rejeitar campos/IDs/ordens/polígonos/hashes incompatíveis sem READY, escrita de resultado ou navegação.                                       |
| P03 — manter posse e interrupção                        | 001, 002, 006 | Combinar sinal da entrega com o dono local, revalidar após cada await e antes da publicação. Dispose exatamente pelo dono, somente quando não houver leitura/gravação em voo usando o buffer. Testar background/unmount, dupla execução, retorno tardio, dispose tardio e nova reserva sem tocar outro dono.                     |
| P04 — efetivar arquivo e estado local                   | 002, 006      | Reusar staging/move/validação e transação exclusiva com FKs, vínculo atual de attempt/operação/página/projeto/par e estados protegidos. Inserir resultado/regiões/vértices e READY juntos; recusar DEMO, resultado de outra tentativa e terminais incompatíveis. Testar SQLite real, rollback e colisões de IDs sem sobrescrita. |
| P05 — resolver falhas e reinício                        | 001, 002, 006 | Reutilizar compensação de COMMIT incerto descrita acima, testar move falho, disco cheio, callback rejeitado com commit real, consulta indisponível, rollback confirmado e restart antes da limpeza. Sem journal/schema novo obrigatório e sem recuperação remota fictícia.                                                       |
| P06 — navegar uma vez                                   | 003           | Reusar claimAutoOpen persistido antes da navegação; proteger identidade/generation e sinal do dono. Testar ready/back/rerender/remount/restart, claim concorrente e aborto durante claim. Se o claim foi consumido mas a navegação não ocorreu, permitir abertura manual segura sem novo auto-open.                              |
| P07 — preservar reader e offline                        | 004, 005      | Reusar reader unificado e domínio local; tradução como padrão, Ver original e acesso offline a resultado/regiões. Não adicionar Chapter, Core, login, conversão DEMO ou dependência de gateway para leitura já salva. Testar resultado remoto, DEMO preservada, sessão apagada e gateway indisponível.                           |
| P08 — tornar overflow e vazio utilizáveis               | 004, 007, 008 | Apresentar indicador perceptível e painel de texto integral para overflow, sem depender dos três pixels do renderer. Página sem regiões abre normalmente com mensagem localizada e sem painel vazio. Testar os sete scripts recebidos como dados, overflow integral e fixture arte-only.                                         |
| P09 — reconciliar a apresentação                        | 001, 006, 008 | Substituir polling/ETA/cinco estágios por marcos disponíveis: envio/espera, resposta recebida/verificação e resultado efetivado. Erro/interrupção não navegam como sucesso; perda explica necessidade de nova execução explícita com aviso da 017. Tokens, labels e cópia nos três idiomas.                                      |
| P10 — concluir revisão técnica e registrar provas reais | todos         | Executar testes focados e pnpm check; classificar arquivos/evidências; matriz por AC, review, drift e checksum final. Manter tarefas específicas para aparelho/Expo real, offline/restart, foco/leitor de tela e layout nos três idiomas quando não executadas. Código faltante não vira verification-pending.                   |

Esses identificadores são da proposta, não numeração definitiva de tasks.
O Task Planner poderá derivar `tasks.md` depois da abertura, sem adicionar
requisitos e mantendo uma linha própria por AC em tasks/review.

## Matriz resumida por critério

| Critério | Itens propostos    | Evidência mínima                                                                              |
| -------- | ------------------ | --------------------------------------------------------------------------------------------- |
| AC-001   | P01, P03, P05, P09 | RNTL de marcos reais; restart/perda sem GET de conteúdo ou replay pago.                       |
| AC-002   | P01–P05            | Bytes/manifesto hostis, arquivo/move/commit e SQLite real, sem READY antecipado.              |
| AC-003   | P06                | Claim persistente, contagem de navegações, corridas e abertura manual segura.                 |
| AC-004   | P07, P08           | Reader remoto separado de DEMO/Chapter/Core, original e overflow completos.                   |
| AC-005   | P07                | Leitura e fallback após matar sessão/gateway e reiniciar offline; prova física própria.       |
| AC-006   | P01–P05, P09       | Abort, corrupção, disco cheio e COMMIT incerto sem perda da verdade durável ou sucesso falso. |
| AC-007   | P08                | Resposta vazia válida no reader, mensagem localizada e ausência de painel vazio.              |
| AC-008   | P08–P10            | RNTL pt-BR/en-US/es-ES, tokens/labels/foco e matriz física de acessibilidade.                 |

## Plano de dados anterior ao código

**Banco escolhido:** SQLite e diretórios privados já existentes no aparelho.
Nenhum dado de resultado será transferido para PostgreSQL/Mongo ou para um
novo serviço. O servidor continua conservando somente metadados permitidos.

**Modelo:** reusar translation_page_results (PK page_id, UNIQUE attempt_id para
REMOTE), text_regions (PK id, UNIQUE page_id/reading_order),
text_region_vertices (PK region_id/vertex_index), projeto/página e histórico de
attempts. Os determinantes de cada linha são suas chaves candidatas; a proposta
não cria cache paralelo de texto/manifesto nem novos contadores.

**Integridade:** preservar source_kind DEMO/REMOTE e seu vínculo obrigatório de
attempt para REMOTE; FKs CASCADE resultado→página/attempt, região→resultado e
vértice→região; verificações existentes de MIME/bytes/dimensões/hash e metadata
opcional de tradução. Colisão com outra página/tentativa é falha transacional,
nunca UPDATE silencioso sobre resultado anterior. Não inventar modelo/versão
de tradução ausentes no manifesto final recebido.

**Índices:** lookup/commit/claim usam PK, UNIQUE e FKs existentes. Não há query
nova que justifique índice extra nesta proposta. Conferir o plano real antes
de introduzir qualquer índice redundante.

**Derivados:** READY resulta da transação local validada; auto_opened_at é o
claim durável da navegação. Recibo FINISHED do servidor não substitui esses
dois fatos. Progresso visual deriva de marcos locais, sem novo enum SQL.

**Migration e arquivos coordenados:** não há migration prescrita. Se a solução
escolhida realmente alterar persistência, produzir plano próprio e migration
aditiva/idempotente antes do código, preservando a versão global SQLite e os
dados existentes. Este parecer não autoriza presumir uma coluna/journal novo.

## Arquivos prováveis e fronteiras FSD

- features/acquire-remote-translation-result: controller/hook e staging local;
  retirar o transporte antigo dessa ação, sem implementar provider/retry.
- entities/remote-processing-attempt: API pública da entrega e estados reais;
  preservar posse única, histórico, recibos e o trabalho já revisado da 017.
- entities/local-translation-result: parser, commit/claim e reconciliação dos
  próprios arquivos/resultados; reusar @x tipado para vínculos com attempts.
- shared/files e media-inspection: somente I/O/inspeção genéricos necessários.
- widgets/remote-processing, pages/offline-translation e seus locales: composição,
  marcos reais, navegação, reader, original/overflow/vazio.
- application/gates: ordenar recuperação, se necessário, sem importação
  horizontal entre features. Um hook de feature não importa a feature irmã para
  contornar FSD; a composição pode usar APIs públicas de entities ou app layer.

Não se propõe refatoração geral de persistência, migração da biblioteca, nova
tela de catálogo, scheduler/lote, export/share ou execução em background.

## Condições para o integrador

1. Aguardar seu gate final e o registro legítimo da 019 antes de abrir a 021.
2. Confirmar as outras dependências e criar tasks ativas somente depois do gate.
3. Provar a integração nova, sem contar como concluída a aquisição antiga ou
   as provas visuais/backend isoladas. Não promover quality humana/AMD64.
4. Rebasear coverage/review/drift/checksum na árvore final do executor. Este
   documento é proposta/governança, coberta pelo pattern docs/specs existente;
   não foi classificado artificialmente como prova de AC implementado.

Nenhum código, arquivo de coverage, estado/gate ou checksum foi modificado
nesta rodada. O único artefato produzido pelo reviewer é este documento.
