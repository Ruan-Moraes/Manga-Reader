# Plano de remediação de performance mobile

Estado consolidado em 2026-09-06: **C01–C05 implementadas com testes; aceite nativo
pendente. B01–B06 e I01–I06 ainda têm trabalho aberto.** O
[relatório](../active/performance-audit.md) concentra diagnóstico e estado por achado;
os reviews das rodadas contêm evidências e hashes das implementações.

A etapa inicial foi somente documental. Depois, o usuário autorizou as correções;
essa execução está registrada ao final deste plano. O documento não substitui
`tasks.md` SDD, não aprova requisitos nem abre gates. IDs MOB-PERF são achados,
não Target Specs. Responsáveis pelas pendências: a definir. Backend fora do escopo.

## Preparação e medições pendentes

| Tarefa | Entrega independente                                         | Aceite / dependências                                                                                                                                              |
| ------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| B01    | Preparar build representativa e fixtures privadas sintéticas | Identificar build/hash, dispositivo, versões, caches, rede e métricas; Android físico ausente e release não identificado continuam pendentes                       |
| B02    | Medir leitor vertical, paginado e duplo                      | Frio/quente, rotação, navegação e imagens; separar montagem, frames, prefetch e download. Depende B01                                                              |
| B03    | Medir importação, validação e preparação                     | Separar parsing, decoder, SQL e cópia; contagem de linhas/queries, memória e retomada. Depende B01                                                                 |
| B04    | Exercitar rede/recuperação com respostas controladas         | Timeout, abort, 401 concorrente, resposta excessiva e active repetido; validar disponibilidade real de streams. Experimento Node já disponível; nativo depende B01 |
| B05    | Medir export e storage                                       | Payload sintético sem dados pessoais, objeto/string/arquivo, cancelamento e cleanup. Depende B01                                                                   |
| B06    | Medir startup e assinaturas                                  | Frio/quente, guest/sessão restaurada, idioma/tema e alterações irrelevantes no leitor. Depende B01                                                                 |

Não medir simultaneamente no mesmo aparelho. Não transformar volume sintético em
limite ou distribuição real de uso. O protocolo detalhado está em
[cenários](../active/performance-evidence/measurement-protocol.md).

## Correções implementadas — critérios de aceite ainda abertos

| Tarefa | Achado / alteração implementada                   | Aceite funcional e de performance                                                                                        | Risco / dependência                                                                |
| ------ | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| C01    | MOB-PERF-002: mapa ID→número lógico               | Mesma numeração em LTR/RTL e pares ímpares; remover buscas repetidas por item, comparar Profiler                         | Baixo; B02; independente de C02                                                    |
| C02    | MOB-PERF-001: janela do leitor vertical           | Janela montada limitada; memória/frames melhores além da variabilidade; mesma página após rotação, retry, gaps e fit     | Alto; B02 e experimento com alturas heterogêneas; não depende C01                  |
| C03    | MOB-PERF-003: reduzir reidratação por resultado   | Persistência por página e stale protection intactas; volume de linhas não cresce quadraticamente por reidratação do lote | Alto; B03, revisão do contrato repository; sem migration presumida                 |
| C04    | MOB-PERF-004: limitar leitura efetiva de resposta | Mesmos erros/JSON/abort; limitar consumo antes de materializar resposta excessiva sem header                             | Médio; B04; expo/fetch instalado, teste de integração e memória nativos pendente   |
| C05    | MOB-PERF-005: reduzir materialização do export    | Conteúdo JSON equivalente e cleanup em todos os caminhos; menor pico em payload crescente                                | Médio; B05; FileSystem instalado, bytes compartilhados e memória nativos pendentes |

As duas rodadas vincularam C01–C05 a ACs existentes e gates abertos. Para futuras correções: vincular ACs e verificar paridade/gate. Se houver
mudança de intenção, criar Target Spec draft e obter aprovação humana; se apenas
corrigir divergência com spec correta, adicionar regressão conforme workflow.
Não criar tasks de feature bloqueada. Escrever teste funcional que falhe pelo
mecanismo corrigido, implementar apenas a mudança necessária, medir antes/depois,
revisar e registrar drift. Reverter somente a mudança causal do próprio PR.

A capacidade técnica de C04/C05 foi conferida nas APIs instaladas e exercitada em
testes controlados. O código está implementado; B04/B05 continuam necessárias para
validar integração e desempenho reais. Não confundir capacidade estática com aceite
nativo concluído.

## Hipóteses

- I01 / MOB-PERF-006: Profiler de assinaturas; encerrar sem correção se custo irrelevante.
- I02 / MOB-PERF-007: chamadas de prefetch versus downloads efetivos; não remover cache.
- I03 / MOB-PERF-008: active repetido com transporte atrasado; verificar se operações
  se sobrepõem antes de propor coalescência. Preservar idempotência e consentimento.
- I04 / MOB-PERF-009: decompor startup; não paralelizar pré-requisitos dependentes.
- I05 / MOB-PERF-010: custo do parser versus decoder/SQL; preservar validações.
- I06 / MOB-PERF-011: SecureStore por request; comparar antes de criar cache de tokens.

Cada I entrega trace ou teste reproduzível e verdict confirmado/refutado/inconclusivo;
somente um confirmado gera proposta C adicional. Não priorizar hipóteses como bugs.

## Ordem, revisão e acompanhamento

Próximo trabalho de medição: B01 → B02/B03 → B04/B05/B06; cada B é separado.
B03 já possui comparação SQL em Node; B04, ensaio do transporte e testes controlados;
B02/B05, testes funcionais das correções. Nenhum desses resultados encerra a medição
nativa correspondente. I03 pode avançar com testes locais de recuperação concorrente
enquanto o ambiente é preparado. As demais hipóteses seguem seus protocolos,
sem implementar otimizações até confirmar custo relevante.
Não juntar refatoração FSD e mudança de comportamento/performance no mesmo PR.

Aceite de cada PR: critério funcional preservado, evidência comparável, nenhuma
piora relevante em CPU/memória/rede/disco, `pnpm check`, review e drift quando
aplicável. Falta de dispositivo mantém verificação aberta, não vira sucesso.
Atualizar estado do achado e índice DT-75 somente após cumprir esses critérios.

## Histórico de execução — primeira rodada, 2026-09-06

Autorização: usuário solicitou corrigir os achados. C01 e C03 mantêm os contratos
comportamentais aprovados de MOB-FEAT-005/015; não criam Target Spec ou abrem gate.

Plano de persistência antes do código (C03): SQLite existente; nenhuma tabela,
coluna, FK, CHECK, UNIQUE, índice ou migration muda. As PKs de draft/item e o
vínculo `draft_id` continuam sendo usados; nenhuma desnormalização é adicionada.
Consultar header com `id/slot` e item com `draft_id/id` dentro da mesma transação
exclusiva. Preservar ordem das validações: draft ausente, versão obsoleta, item
ausente; só depois escrever item e timestamp do draft. `updateMediaValidation`
passa a retornar `void` internamente. Controller mantém cópia própria de itens,
aplica o resultado somente após commit e encadeia `expectedUpdatedAt`. Sem cache
compartilhado, sem mutação do draft recebido e sem transação de lote. Testar
reload/versão/ausência e contar materializações em SQLite de ensaio.

C01 usa mapa ID→número derivado uma vez por array de páginas; preservar número
lógico no DOUBLE/RTL e reconstruir ao receber outro capítulo. Evidência de custo:
leituras indexadas no array durante render, sem converter contagem em FPS.

Resultado da primeira rodada: C01/C03/C04 implementadas com testes; validação
nativa pendente. C04 usa expo/fetch existente, sem pacote adicional. B03 ganhou
comparação real de linhas SQL em Node, sem equivalência com profiling no aparelho.
Ver [review da rodada](../active/performance-evidence/corrections-2026-09-06/review.md).
Naquele momento C02/C05 ainda não estavam implementadas; a segunda rodada abaixo
registra sua execução posterior.

## Histórico de execução — segunda rodada C02/C05, 2026-09-06

Autorização humana de continuação das correções; mesmas specs aprovadas 005/007.
C02 implementada com FlatList, offsets por dimensões/fit/gap e espaço de erro medido
para manter retry acessível. Estados de erro/retry permanecem fora das células.
C05 implementada com createDownloadResumable do Expo FileSystem já instalado,
por adapter do cliente Axios atual. Código nativo instalado confirmado: Android
copia stream para FileOutputStream; iOS move o arquivo de URLSession para destino,
sem MD5 solicitado. Ambos devolvem status/headers/URI e substituem o destino no retry.

B02/B05 não encerradas: faltam baseline e comparação nativa representativa.
Sem nova dependência ou schema. C02 e C05 podem ser revisadas/revertidas separadamente;
007 reaberta como verification-pending, sem alterar requisitos ou gates. Janela/batch
do leitor são parâmetros iniciais de implementação, sujeitos a medição de fill rate.

[Evidências, aceite e reversão por mudança](../active/performance-evidence/corrections-c02-c05-2026-09-06/review.md).
DT-75 permanece aberta para validação nativa e hipóteses restantes.
