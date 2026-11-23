# Revisão independente da coerência das specs voláteis — 2026-11-01

## Escopo e resultado

Conferência das Target Specs correntes 017–021, DEC-008 e delta de estados da
016, após a substituição solicitada por Ruan. Também foram consultados o código
corrente de recibos/UUIDv7 e as correções de falha local, sem alterar runtime.

**Resultado documental: coerente**, com duas ambiguidades corrigidas durante a
revisão. Isso aprova apenas a consistência do contrato escrito; não aceita AC,
task, código ou operação e não muda status, gates ou checksums. A revisão final
da implementação permanece pendente com o integrador.

## Ajustes normativos feitos

1. A 017 e DEC-008 agora explicitam que falha local altera página/tentativa e
   não torna automaticamente o projeto `FAILED`. O projeto pode permanecer
   `PROCESSING`, e nova execução explícita da primeira página `FAILED` é admitida
   nesse agregado sem reiniciar outras páginas. `READY` e `CANCELLED` da página
   ou do projeto continuam protegidos. A regra da 016 não foi relaxada.
2. A 017 distingue replay de execução, recusado sem nova chamada, de consulta
   separada do recibo pela chave da tentativa. Consultar estado não reenvia
   mídia; a referência de operação vem nos metadados. O texto não exige uma
   segunda rota de lookup por operação que não faça parte do contrato atual.

O delta anterior de UUIDv7/sete dias permanece: validade e consulta terminam no
timestamp da chave + sete dias; elegibilidade da limpeza física começa em
`created_at` do recibo + sete dias, e a remoção exige também que a chave esteja
vencida, com lotes e banco disponível. Esses dois instantes podem ser diferentes.
A política dos logs não herda esse prazo.

### Esclarecimento posterior do purge

A auditoria do integrador detectou que a tolerância de timestamp futuro da chave
pode mantê-la ativa por alguns minutos depois de `created_at` do recibo + sete
dias. A spec e DEC-008 agora explicitam que idade do recibo é somente condição
necessária: o purge deve preservar o recibo até a chave também vencer. Isso
concretiza a proibição de ressuscitar execução após remoção; a correção SQL e a
prova em PostgreSQL real dessa janela ainda precisam ser verificadas pelo
integrador. O esclarecimento documental não aprova a implementação do purge.

## Matriz de coerência entre contratos

| Tema                       | Contrato escrito conferido                                                                                                                                   | Resultado documental                                                |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| Conteúdo do servidor       | Original, raster, OCR, tradução, imagem final e manifesto só existem em memória na sessão; sem gravação, fila/cache persistente ou recuperação posterior     | coerente entre 017–021 e DEC-008                                    |
| Conteúdo no aparelho       | Original privado é preservado; a 021 valida e persiste resultado/regiões antes do reader e mantém leitura offline                                            | coerente; armazenamento local é intencional                         |
| Entrada e admissão         | Primeira página, autorização/consentimento/capabilities e limites antes dos providers; uma página pesada por instância, sem fila ilimitada                   | coerente; execução precisa de prova própria                         |
| Idiomas                    | Sete códigos, Hans/Hant separados, 42 pares representáveis, somente conjunto habilitado processável                                                          | coerente entre 017–020                                              |
| OCR                        | Online, regional US, bytes inline, associação/ordem/geometria limitadas em memória; sem batch assíncrono ou URI de conteúdo                                  | coerente com a direção volátil                                      |
| Tradução                   | Operação contextual síncrona global, modelo explícito e limite completo de 30.000 pontos de código antes da chamada; sem truncamento/fallback silencioso     | coerente com 019 e disclosure                                       |
| Renderização               | WebP lossless/exact, política fixada, fonte licenciada, alterações limitadas e fallback integral; máximo e memória agregada precisam de admissão real        | coerente; não aceita prova antiga de pipeline que escrevia arquivos |
| Entrega e validação        | Mesma resposta autenticada, no-store, limites, MIME real, bytes, dimensões, hash e vínculos; resultado produzido no servidor não é READY local               | coerente entre 017/020/021                                          |
| Interrupção                | Abort local não comprova cancelamento externo; impedir fases/entrega tardias, preservar posse de buffers/capacidade até término confirmado                   | coerente; requer teste de integração e falhas                       |
| Idempotência               | Recibo durável antes de providers; replay não refaz operação/cobrança; consulta owner-scoped separada e sem conteúdo                                         | coerente com a distinção de transporte corrigida                    |
| UUIDv7 e vencimento        | Timestamp das capabilities, sem renovação, validade absoluta de sete dias, recusa antes de provider e consulta vencida 404                                   | coerente com DEC-008 e fonte corrente consultada                    |
| Purge e logs               | Purge exige created_at+sete dias e chave vencida; execução física eventual em lotes e logs com política própria                                              | coerente; não promete hard deadline físico                          |
| Restart                    | Metadados podem ser consultados enquanto a chave for válida; conteúdo remoto não é recuperável; nova execução só por ação explícita com nova tentativa/chave | coerente entre 017 e 021                                            |
| Estados locais             | Sem QUEUED fictício, sem FAILED agregado automático, retry explícito da primeira página e terminais protegidos; READY só após commit validado                | coerente com o delta da 016                                         |
| Termos e responsabilidades | Usuário deve ter direitos/autorização; práticas dos subprocessadores devem ser verdadeiras; nenhuma exoneração integral do operador é prometida              | coerente com a decisão do usuário                                   |
| História e aprovação       | Versões/provas anteriores estão identificadas como históricas; não abrem gates nem aprovam o novo ciclo de vida                                              | coerente no conjunto inspecionado                                   |

## Rastreabilidade e gates

| Feature | ACs correntes | Status e gate mantidos | Limite desta revisão                                                |
| ------- | ------------- | ---------------------- | ------------------------------------------------------------------- |
| 017     | AC-001..012   | in-progress / open     | contrato consistente; implementação/review final ainda em andamento |
| 018     | AC-001..006   | approved / blocked     | provas do OCR anterior não liberam a integração volátil             |
| 019     | AC-001..006   | approved / blocked     | algoritmo reaproveitável não comprova sessão/recibos atuais         |
| 020     | AC-001..006   | approved / blocked     | qualidade e isolamento precisam de evidência do novo pipeline       |
| 021     | AC-001..008   | approved / blocked     | aquisição/commit/reader precisam partir da resposta direta real     |

São 38 critérios, com IDs preservados. A revisão não marca nenhum deles como
implementado. A 016 conserva o aceite da fundação local, e seu delta de
integração é verificado na 017; não foi usada uma alteração de estado documental
para abrir outra dependência. Nenhum `tasks.md` ativo foi criado nas quatro
features bloqueadas.

## Conferência das falhas locais reportadas

A implementação corrente de `failVolatileAttempt` consulta os estados da página
e do projeto, preserva `READY`/`CANCELLED`, atualiza apenas página/tentativa e
não grava projeto como `FAILED`. Isso corresponde à regra normativa mantida.
A prova por testes SQLite, sua matriz completa de corridas e o restante da
integração pertencem à revisão final; esta inspeção não declara esses testes
executados por este reviewer.

## Pendências reais de implementação e verificação

- Fechar integração mobile 017, estados/consentimento trilíngue e recibos sem
  reenvio; um transporte shared isolado não encerra esse contrato.
- Conferir resultados atuais de UUIDv7, vencimento antes de providers, replay,
  concorrência/commit incerto e purge em PostgreSQL real. Não reutilizar as
  conclusões anteriores à introdução da validade das chaves.
- Comprovar ausência de gravação no ingress, IPC e codec e inadmissibilidade dos
  gravadores legados. Configuração fechada é necessária, mas não substitui
  prova do pipeline real e de seus modos admitidos.
- Concluir validação Linux do novo caminho nativo, posse/timeout/cancelamento,
  máxima página e orçamento total da nova composição. Admissão anterior do
  worker separado não é aprovação automática do serviço direto.
- Integrar e exercitar 021 com resposta direta, validações, falhas de disco/move/
  commit, abertura uma vez e leitura offline. Não atribuir esse resultado ao
  ciclo antigo de URL/polling/ACK.
- Conferir disclosure/políticas publicados e configuração operacional, incluindo
  subprocessadores/localidades, nova versão de consentimento e distinção dos
  prazos de recibos e logs, antes de habilitar operação pública.
- O integrador deve atualizar coverage e checksums ao terminar o runtime e rodar
  os gates. Esta revisão não os edita nem usa arquivos ainda descobertos como
  evidência de implementação.

## Evidência documental e limites

Foram conferidos arquivos correntes e a rastreabilidade dos ACs, com validação
de links e formatação executada após os ajustes. Os resultados completos ficam
na mensagem de handoff do reviewer. Falhas de checksum/coverage durante a
integração são pendências do integrador e não foram mascaradas. Não houve
chamada de provider, cloud, Docker, build nativo ou teste em aparelho por este
reviewer nesta rodada.
