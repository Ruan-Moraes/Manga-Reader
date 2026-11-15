---
id: MOB-FEAT-021
type: feature
title: Leitor local do resultado traduzido
status: verification-pending
implementation_gate: open
blocked_by: [MOB-FEAT-019, MOB-FEAT-026, MOB-FEAT-027, MOB-FEAT-051]
created: 2026-08-15
updated: 2026-11-02
supersedes: []
superseded_by: []
---

# MOB-FEAT-021 — Leitor local do resultado traduzido

## Decisão vigente e aprovação da revisão

Esta versão substitui integralmente as regras anteriores deste arquivo sobre
conteúdo remoto. A direção foi aprovada explicitamente por Ruan em
2026-11-01: processamento volátil em memória, entrega ao cliente e manutenção
de logs operacionais sanitizados. A solicitação inclui substituir o conteúdo
anterior das especificações. Não se trata de aprovação da implementação.

Referências normativas: [MOB-DEC-008](../../../decisions/MOB-DEC-008-volatile-processing.md)
e [arquitetura do gateway](../../../../../docs/volatile-processing-architecture.md).
A [versão anterior](evidence/pre-volatile-spec-2026-11-01.md) e as provas
anteriores permanecem históricas, sem herdar seus aceites para este transporte.

## Objetivo

Receber, verificar, persistir no aparelho e abrir automaticamente a primeira
página traduzida no leitor unificado, mantendo original, resultado e fallback
acessíveis offline sem depender de conteúdo recuperável no servidor.

## Contexto e contratos relacionados

- Depende de `MOB-FEAT-019/026/027/051`; atende RF-RDR-001/002/009 e
  UX-RDR-001..006. Integra a resposta final da 020, sem promover sua operação.
- `MOB-FEAT-005` permanece leitor de capítulos publicados. Reuso limita-se a
  primitives `shared`; Chapter, publicação, Core e login não são estendidos.
- Controla RSK-005/021/026/027. Biblioteca e progresso entre páginas são M5.
- A revisão anterior do reader e suas provas físicas permanecem históricas;
  a aquisição pela sessão volátil precisa de evidência própria.

## Requisitos e regras

- Consumir imagem e manifesto diretamente da resposta autenticada da sessão,
  sem URL de download, reconsulta de conteúdo ou retry oculto após desconexão.
- Tratar a resposta como não confiável: validar contrato, limites, bytes,
  MIME real, dimensões, hash, vínculo de operação/página/par/original e
  associação de regiões antes de publicar qualquer resultado local.
- Progresso apresenta somente marcos confirmados pelo transporte. Não simular
  cinco etapas, percentuais ou ETA quando o backend não comunicar essas etapas.
  Resultado produzido no servidor não é `READY` no aparelho.
- Gravar saída validada em arquivo privado temporário local e movê-la
  atomicamente; persistir manifesto/regiões e resultado em transação exclusiva.
  Só após esse commit a página fica `READY`.
- Não enviar confirmação de remoção de conteúdo. Uma confirmação operacional
  eventual não condiciona disponibilidade do resultado local nem implica que
  conteúdo tenha sido preservado pelo servidor.
- Se a resposta estiver completa e já houver arquivo local verificado,
  reconciliação pode concluir o commit local sem rede. Se o conteúdo estiver
  incompleto/perdido, informar necessidade de nova execução explícita conforme
  a 017; não prometer recuperação remota após restart.
- Navegação automática acontece uma vez por resultado; persistir
  `auto_opened_at` antes de navegar para evitar loops em back/rerender/restart.
- Se o usuário saiu da tela, a retomada pode abrir uma vez o resultado local
  íntegro já efetivado. Não executar chamada paga ou inventar resultado.
- Leitor unificado mantém domínio local separado, sem overlay demonstrativo
  para resultado remoto; mostra tradução por padrão, oferece **Ver original**
  e painel textual de overflow com tradução completa.
- Página sem texto abre normalmente e informa ausência de texto identificado.
- Depois da persistência, leitura, original e fallback funcionam offline,
  independentemente da sessão de conta/gateway e do ciclo de vida do servidor.
- Falha, interrupção e resposta inválida nunca navegam como sucesso.
- UX e erros mantêm tokens, acessibilidade e pt-BR/en-US/es-ES, incluindo
  explicação honesta da perda de conteúdo remoto ao encerrar a sessão.

## Plano de persistência local

Reusar o SQLite e arquivos privados do app, incluindo resultados, regiões,
vértices e metadados opcionais de tradução. Resultado remoto exige tentativa,
página/projeto/par e operação corretos e não pode converter/sobrescrever demo.

Resultado, regiões e `READY` local são efetivados em transação exclusiva com
FKs habilitadas. `page_id` e `attempt_id` são chaves candidatas do resultado;
região/ordem e vértice/índice mantêm integridade própria. Arquivos parciais não
viram resultado pronto. Preservar original, drafts e resultados anteriores.
Alteração de schema exige plano e migration próprios antes do código; não
inventar um novo banco ou documento paralelo para armazenar o manifesto.

## Arquitetura FSD planejada

```text
shared/files + shared/remote-gateway
  → entities/local-translation-result + entities/remote-processing-attempt
    → features/acquire-remote-translation-result
      → widgets/remote-processing
        → pages/offline-translation
```

Entities relacionadas usam referências `@x` tipadas e APIs públicas; features
não se importam horizontalmente. Viewport compartilhada não acopla os domínios
locais a Chapter, publicação, Core ou login.

## Casos de erro

- Resposta truncada/excedente, hash, MIME, vínculo ou manifesto inválido impede
  `READY` e remove apenas o arquivo local parcial criado pela aquisição.
- Disco local insuficiente preserva original e registros de tentativa; se a
  sessão terminou sem conteúdo íntegro local, informa nova execução necessária.
- Falha entre move e commit é reconciliada localmente sem duplicar resultado;
  nenhum caminho repete provider automaticamente.
- Interrupção evita publicação tardia da sessão abandonada.
- Rerender/back/restart não repetem auto-open já consumido.
- Sem rede após persistência não afeta leitura nem **Ver original**.

## Critérios de aceite

### AC-001 — Progresso e retomada verdadeiros

A interface mostra somente marcos comprovados e distingue envio, processamento,
recebimento e conclusão local, sem ETA fictício. Restart reconcilia o que existe
localmente e metadados remotos, sem prometer conteúdo recuperável no servidor.

### AC-002 — READY depende da persistência local

Página só fica `READY` após receber integralmente a resposta, validar imagem e
manifesto, mover arquivo local e efetivar resultado/regiões em transação.

### AC-003 — Navegação automática exatamente uma vez

Resultado íntegro abre o leitor automaticamente e persiste consumo antes de
navegar; back, rerender e restart não reabrem em loop.

### AC-004 — Leitor local separado

Resultado, original e fallback usam leitor unificado e domínio local separado
de Chapter/publicação/Core, sem login obrigatório ou conversão de demo.

### AC-005 — Leitura offline independente do servidor

Após commit local e encerramento da sessão remota, resultado, original e
fallback permanecem acessíveis sem rede ou disponibilidade do gateway.

### AC-006 — Falhas de aquisição e encerramento honestos

Resposta/manifesto inválido, falta de espaço ou interrupção não produz reader
ou sucesso falso. Dados locais seguros são preservados; perda de conteúdo é
explicada sem retry pago automático ou recuperação remota fictícia.

### AC-007 — Página sem texto

Resultado equivalente ao original abre normalmente, com mensagem localizada e
sem fallback vazio.

### AC-008 — UX acessível e trilíngue

Progresso, estados, reader, original, overflow e erros têm paridade
pt-BR/en-US/es-ES, tokens, foco, labels e touch targets adequados.

## Estratégia de evidência

| Critério | Teste/evidência esperada                                                    |
| -------- | --------------------------------------------------------------------------- |
| AC-001   | RNTL de marcos disponíveis, interrupção e restart sem recuperação fictícia  |
| AC-002   | falhas em frame/bytes/hash/vínculo/move/commit e integridade SQLite         |
| AC-003   | contagem de navegações em ready/back/rerender/restart                       |
| AC-004   | teste arquitetural e reader com original/fallback e demo separado           |
| AC-005   | leitura real offline após término da sessão e indisponibilidade do servidor |
| AC-006   | truncamento, payloads hostis, disco cheio e sessão abandonada               |
| AC-007   | fixture arte-only no reader                                                 |
| AC-008   | RNTL dos três locales e matriz física de acessibilidade                     |

Provas do fluxo anterior são referências históricas e exigem revalidação quando
a interface, o ciclo de vida ou a posse dos buffers mudar. Aprovação visual ou
linguística anterior pode orientar fixtures, sem comprovar privacidade, entrega
ou recuperação da sessão atual.

## Gate de implementação

- Estado: `open` em 2026-11-02; dependências `MOB-FEAT-019/026/027/051` em `verification-pending`.
- A 019 encerrou sua revisão técnica independente, com correção de fences,
  provas atuais da candidata 5, raiz backend2859 sem falha e gate documental
  verde antes desta abertura. As verificações humanas/operacionais continuam
  explicitamente abertas e não significam implementação ausente.
- A abertura sequencial e o planejamento seguem a autorização de continuidade
  de Ruan/DEC-008. Não promovem aquisição, qualidade humana, ambiente alvo ou
  operação pública por inferência. Tasks devem provar a integração corrente.

## Fora de escopo

- Lote, scheduler, retry pago automático, biblioteca, comparação avançada e edição.
- Export/share, push notification e execução ilimitada em background.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-11-01

Ruan aprovou explicitamente implementar processamento estritamente volátil,
retorno ao cliente e logs operacionais padrão sanitizados; depois pediu substituir
as especificações antigas por esse requisito. Aprovação inicial do slice em
2026-08-15 permanece no histórico. Esta revisão não autoriza deploy, chamadas
pagas, nova infraestrutura ou publicação de textos legais sem o fluxo pertinente.
