---
id: MOB-DEC-007
type: decision
title: Performance mobile orientada por evidências
status: accepted
created: 2026-09-05
updated: 2026-09-05
supersedes: []
superseded_by: []
---

# MOB-DEC-007 — Performance mobile orientada por evidências

## Contexto

Aprovação: solicitação humana de implementação do plano da auditoria, em 2026-09-05.
Esta decisão estabelece processo técnico, não novos requisitos comportamentais.
Seu escopo é somente `mobile/`; não substitui Target Specs nem abre seus gates.

## Decisão

Consultar a skill [mobile-performance](../../.agents/skills/mobile-performance/SKILL.md)
antes de novas funcionalidades e alterações de componentes/fluxos, durante reviews
ou refatorações, após implementações e ao investigar lentidão, travamentos ou
consumo crescente. A consulta é obrigatória; uma auditoria integral por mudança não é.
Aplicar somente análises proporcionais aos caminhos e riscos afetados.

## Princípios

- Entender contexto, contratos, volume de dados e evidência antes de sugerir solução.
- Separar mecanismo confirmado, impacto medido, hipótese e lacuna de verificação.
- Otimizar o trabalho que importa ao usuário, preservando função, acessibilidade,
  idiomas, privacidade, qualidade de imagem e recuperação.
- Considerar CPU, memória JS/nativa, frames, rede, disco e manutenção em conjunto.
  Um ganho em uma dimensão não justifica piora oculta em outra.
- Preferir uma mudança causal por tarefa e revisão; não iniciar reescritas por estilo.
- Usar orçamentos existentes. Se não houver, medir antes de propor metas, com
  ambiente, dispositivo, fixture e variabilidade explícitos.

## Padrões por área

| Área                   | Padrão recomendado e critério                                                                                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Componentes            | Manter render puro; localizar cálculos caros por profiler. `memo`, `useMemo` e callbacks estáveis são ferramentas, não obrigações gerais                                                    |
| Telas                  | Separar estados de carregamento/erro/pronto; identificar trabalho necessário à primeira interação e adiar apenas o que não é pré-requisito                                                  |
| Listas                 | Avaliar virtualização conforme volume e custo; IDs estáveis e números lógicos independentes do índice visual; preservar altura dinâmica e restauração                                       |
| Imagens                | Respeitar limites reais de bytes/pixels; limitar trabalho simultâneo; dimensionar decode/display, prefetch e cache a partir do cenário; liberar handles/referências possuídas               |
| Navegação              | Declarar dono e ciclo de vida de listener, timer, tarefa e request; decidir continuar/cancelar por contrato. Testar retorno, background e orientação                                        |
| Estado                 | Selecionar dados necessários; manter estado de servidor em Query e identidade/estado local nos donos existentes. Só subdividir store/context após custo demonstrado                         |
| HTTP                   | Chaves incluem dimensões que alteram resposta; propagar signal onde o contrato permite, manter timeout/retry finitos, refresh single-flight, invalidação por identidade/idioma              |
| Upload/recuperação     | Preservar fail-closed, consentimento, idempotência e limites; coalescência local exige testes de recuperação, não substitui idempotência remota                                             |
| SQLite                 | Medir queries e linhas materializadas; reduzir releitura redundante sem perder atomicidade, versão, FK e recuperação. Escrita por página pode ser requisito válido                          |
| Arquivos/armazenamento | Definir propriedade, staging, promoção e limpeza; considerar espaço temporário e serialização. SecureStore continua sendo armazenamento sensível; cache adicional exige invalidação correta |
| FSD                    | Revisar shared→entities→features→widgets→pages→application, com app como cascas de rota. Refatorar organização por performance apenas com nexo causal                                       |

## Práticas proibidas

- Declarar melhoria, leak, N+1, regressão ou gargalo só por tamanho de arquivo,
  presença de loop/ScrollView ou contagem de renders sem analisar o caminho.
- Aplicar otimizações sem evidência ou memoização generalizada por precaução.
- Criar cache sem proprietário, política de validade/invalidação e limpeza.
- Remover validação, consentimento, retry necessário ou reduzir qualidade
  silenciosamente para obter números melhores.
- Introduzir paralelismo ilimitado em operações cujo volume pode crescer.
- Apresentar resultados de dev/Expo Go/simulador/Node como equivalentes a release
  em aparelho físico, ou apresentar teste funcional como benchmark nativo.
- Alterar requisitos/specs, dados privados, dependências ou runtime fora do escopo
  autorizado da tarefa. O guia não concede autorizações adicionais.

## Checklist antes de implementar

- [ ] Ler AGENTS, registry, coverage e AC/OBS dos caminhos tocados; resolver paridade/gate.
- [ ] Identificar gatilho, volume, dispositivo e dimensões de recurso afetadas.
- [ ] Ler evidência existente e confirmar se o hash/build ainda corresponde ao código.
- [ ] Reproduzir mecanismo ou registrar hipótese; não presumir frequência de produção.
- [ ] Definir cenário, métrica, baseline e critério funcional/de performance proporcional.
- [ ] Listar riscos, dependências confirmadas e reversão isolada.
- [ ] Definir teste funcional/regressão quando houver mudança de requisito/comportamento.

## Checklist após implementar e na revisão

- [ ] Preservar comportamento, identidade, idiomas, acessibilidade, ordenação,
      qualidade e retomada/persistência.
- [ ] Executar o mesmo cenário antes/depois com dados e ambiente equivalentes.
- [ ] Registrar valores brutos, mediana/amplitude e overhead; marcar não medido.
- [ ] Verificar demais dimensões: memória, CPU, frames, rede e disco pertinentes.
- [ ] Rodar `pnpm check` no mobile; separar falhas anteriores das introduzidas.
- [ ] Atualizar evidências, review, drift e specs conforme SDD, sem aprovar spec pela IA.
- [ ] Declarar inconclusivo/verification-pending quando faltar evidência exigida.

Para mudanças sem impacto plausível de runtime, registrar justificativa curta de
não aplicabilidade; não criar benchmark ou refatoração por cumprir checklist.

## Investigação de regressões

1. Fixar cenário e reprodução; distinguir dado/rede/dispositivo diferente de regressão.
2. Comparar build/hashes e última evidência válida; localizar primeira mudança
   causadora usando comparação isolada, sem descartar alterações locais de terceiros.
3. Decompor latência por render, JS, nativo, storage e rede antes de escolher correção.
4. Repetir entrada/saída e repouso equivalente para distinguir pico/cache de retenção.
5. Corrigir ou reverter apenas a causa identificada; repetir cenário e testes afetados.

## Manutenção, exceções e autoridade

Toda alteração relevante de runtime, imagens, navegação ou persistência reexecuta
os cenários afetados. Histórico permanece ligado a build e fixture; datas/checksums
novos não tornam uma medição antiga automaticamente atual.

Exceção a este guia exige contexto, evidência, risco aceito, responsável e gatilho
ou data de revisão documentados no PR/decisão. Não usar exceção para contornar SDD.
O relatório contém diagnóstico; o plano contém propostas; o registro DT central
indexa pendências. Não duplicar recomendações mutáveis na skill.

## Alternativas consideradas

Alternativas rejeitadas: otimização preventiva indiscriminada; metas numéricas sem
baseline; uso de uma única ferramenta como prova de todas as dimensões.

## Consequências

Consequência: medições nativas podem ficar pendentes por ambiente, explicitamente,
sem bloquear tarefas documentais independentes nem declarar validação inexistente.

## Relações

- [Auditoria](../active/performance-audit.md) e [protocolo](../active/performance-evidence/measurement-protocol.md).
- [Plano de remediação](../plans/performance-remediation.md).
- [ScrollView](https://reactnative.dev/docs/scrollview), [performance RN](https://reactnative.dev/docs/performance),
  [memo](https://react.dev/reference/react/memo) e [cancelamento Query](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation).

Referências de plataforma fundamentam mecanismos; regras obrigatórias deste guia
são decisões locais. Verificar versão instalada antes de prescrever APIs específicas.
