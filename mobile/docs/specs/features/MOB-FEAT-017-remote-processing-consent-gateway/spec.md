---
id: MOB-FEAT-017
type: feature
title: Consentimento e gateway de processamento remoto
status: verification-pending
implementation_gate: open
blocked_by: [MOB-FEAT-016]
created: 2026-08-15
updated: 2026-11-02
supersedes: []
superseded_by: []
---

# MOB-FEAT-017 — Consentimento e gateway de processamento remoto

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

Permitir que o usuário envie a primeira página para processamento remoto
volátil, com consentimento informado, autorização independente da Core e
proteção contra execução duplicada. Original e resultado são mantidos no
aparelho; o servidor funciona como intermediário de processamento e entrega.

## Contexto e contratos relacionados

- Depende de `MOB-FEAT-016`; OCR, tradução, renderer e aquisição final pertencem
  a `MOB-FEAT-018..021`.
- Atende aos requisitos de consentimento, privacidade e segurança do slice,
  sem tornar obrigatória uma conta da plataforma.
- Interface, providers e infraestrutura devem refletir o mesmo contrato; uma
  capability ausente ou incompatível fecha o envio, sem fallback direto.

## Requisitos e regras

- O disclosure identifica operador e contato, finalidade, dados enviados, rede
  obrigatória, subprocessadores e localidades: gateway no Brasil, Vision online
  regional `us` e tradução global, sem garantia de residência regional desta.
- O disclosure explica processamento em memória no servidor, entrega na sessão,
  armazenamento privado pelo aplicativo no aparelho e indisponibilidade do
  conteúdo remoto após encerramento. Metadados de segurança/idempotência e logs
  operacionais sanitizados são separados do conteúdo e têm política própria.
- As práticas de uso/treinamento dos subprocessadores só são afirmadas com
  base contratual verificável e atual. Os termos exigem direitos ou autorização
  do usuário sobre o material, sem prometer exoneração das obrigações do operador.
- Consentimento é afirmativo, versionado e escopado ao projeto e locale;
  sair/recusar não envia conteúdo. A mudança de arquitetura exige nova versão
  do disclosure e novo aceite antes de qualquer envio.
- Antes do primeiro byte, revalidar projeto, primeira página, arquivo local,
  metadados físicos, limites, par habilitado, capabilities, consentimento e
  tentativa durável. Página diferente da primeira não é submetida neste slice.
- Entrada usa corpo binário limitado e transporte autenticado HTTPS. Não deve
  passar por multipart com spool, arquivo temporário do servidor ou upload para
  armazenamento de objetos. Redirecionamentos e destinos inesperados são recusados.
- Original, pixels, OCR, tradução, manifesto e saída não entram em disco, banco,
  bucket, cache persistente, fila, logs ou analytics do servidor. O transporte
  não oferece download posterior ou recuperação de conteúdo em outra sessão.
- O aplicativo cria tentativa e chave de idempotência antes da rede. O gateway
  reserva recibo operacional durável antes de chamar um provider; quota/reserva
  são atômicas entre instâncias e não mantêm transação aberta durante a rede.
- A chave é UUIDv7 criada com o horário do servidor informado pelas capabilities
  válidas, e não com o relógio local como fonte de verdade. Seu timestamp é
  imutável; consulta/reconciliação nunca renova a data de uma tentativa existente.
- Na validação local das capabilities, admite-se até cinco segundos de avanço
  do relógio do servidor na data de geração; a data de expiração continua
  absoluta, sem tolerância adicional. Fora desses limites o envio permanece bloqueado.
- O ambiente de teste controlado pode anunciar `dailyInstallationQuota: 0`
  quando a quota por instalação está desativada. O cliente aceita esse valor e
  o valor padrão 20. A quota global continua anunciada como 100, e a decisão
  de admissão e de orçamento continua no gateway.
- A validade é absoluta: sete dias a partir do timestamp da chave. Após esse
  instante, a execução é recusada antes de qualquer provider e a consulta do
  recibo retorna ausência (`404`), mesmo que uma linha antiga ainda exista no
  banco. Remover fisicamente o recibo nunca torna a chave executável outra vez.
- Repetir uma chave ativa na execução é recusado sem repetir OCR ou tradução;
  a reconciliação após timeout/restart/duplo toque usa consulta separada do mesmo
  recibo. Não reenviar a mídia automaticamente para consultar estado. O recibo
  não conserva imagem, texto, manifesto, referência de objeto ou URL de conteúdo.
- Consulta autenticada pela chave da tentativa retorna referência de operação
  e somente metadados próprios,
  enquanto a chave estiver válida, e distingue em andamento, resultado produzido
  e falha. Resultado produzido no servidor não comprova entrega nem persistência
  no aparelho; `404` após vencimento não autoriza reenvio nem nova cobrança.
- Recibos tornam-se candidatos à remoção física sete dias após seu `created_at`,
  mas a limpeza só pode removê-los quando a chave também tiver vencido. Idade do
  recibo, isoladamente, não basta: preservar o recibo enquanto a chave estiver
  ativa, inclusive quando seu timestamp estiver à frente do instante de reserva
  dentro da tolerância aceita pelo servidor.
- A limpeza é limitada por lote e depende da disponibilidade do banco; não há
  promessa de exclusão física imediata no vencimento da chave. A indisponibilidade
  não amplia a validade consultável nem permite repetir provider. Logs
  operacionais têm política própria, separada desse prazo dos recibos.
- Se a resposta não for recebida integralmente, o conteúdo não é recuperável
  no servidor. Uma nova execução depende de ação explícita do usuário, com
  explicação de possível novo custo, nova tentativa e nova chave obtida a partir
  de capabilities válidas; não é replay oculto nem renovação de chave vencida.
- Interromper a requisição local não comprova cancelamento de chamada externa
  em andamento. A UI distingue interrupção local, estado remoto conhecido e
  estado desconhecido; nenhuma etapa seguinte inicia após cancelamento observado.
- Logs/eventos usam allowlist de operação aleatória, estado, código sanitizado,
  horário, duração e volumes. Tokens, caminhos, nomes de arquivo, conteúdo,
  mensagens brutas de provider e URLs privadas não são registrados.
- A restauração de tentativa `CREATED` sem envio ou de contrato remoto retirado
  deve oferecer uma saída local segura, preservando histórico, originais e
  resultados já prontos, em vez de manter a página sem ação possível. Normalizar
  uma entrega local interrompida não confirma falha/cancelamento remoto. Uma
  nova execução continua exigindo confirmação explícita, sem reenvio automático.
- Ações visíveis só ficam disponíveis com contrato e implementação reais.
  Gateway/fluxo incompatível ou desabilitado não é substituído por simulação.

## Persistência e contratos locais

O aparelho preserva consentimento versionado e histórico de tentativas em
SQLite, com FKs para projeto/página e unicidade de tentativa ativa por página e
da chave de idempotência. A origem do gateway e a versão do contrato são
snapshots técnicos necessários à reconciliação, sem persistir credenciais
privadas de provider. Credencial da instalação anônima fica no SecureStore.

Estados locais representam criação, envio, aceite, ambiguidade, interrupção,
falha ou conclusão local reais. Estados de transporte da versão anterior não
podem inventar fila durável ou conteúdo recuperável. Mudança de schema exige
plano e migration próprios antes do código, preservando originais, projetos,
consentimentos e registros de tentativas existentes.

### Transições do fluxo de resposta direta

A integração da 017 pode levar página/projeto `DRAFT → PROCESSING`, sem gravar
`QUEUED` para simular fila durável. Uma falha local comprovada pode registrar
`DRAFT → FAILED` somente na página/tentativa: ela não torna automaticamente o
projeto `FAILED`. O agregado pode continuar `PROCESSING`.

Nova execução explícita da primeira página `FAILED`, com nova tentativa/chave
e todas as pré-condições, admite `FAILED → PROCESSING` nessa página mesmo
quando o projeto já está `PROCESSING`; não reinicia ou conclui outras páginas.
`READY` e `CANCELLED` da página ou do projeto permanecem protegidos. Um projeto
legado já `QUEUED` pode permanecer assim após a interrupção local de sua tentativa
antiga; somente uma nova execução explicitamente confirmada da primeira página
`FAILED` pode levá-lo a `PROCESSING` na aceitação direta. Isso reutiliza a
transição existente `QUEUED → PROCESSING`, sem criar `QUEUED` novo ou alegar
cancelamento remoto da operação antiga. O delta da máquina de estados está
alinhado à [016](../MOB-FEAT-016-translation-project-page-state/spec.md).

Essas transições usam os estados canônicos e CHECKs SQLite já existentes, sem
novo enum ou migration. Attempt, vínculo da operação e estado local são
atualizados em transação coerente; falha de envio/resposta não cria sucesso. Não
usar a transição de uma página para inventar que outras páginas concluíram ou
que uma chamada externa foi cancelada.

A conclusão local e a persistência de resultado/regiões pertencem à 021.
`READY` continua exclusivo do commit local validado; receber recibo ou produzir
resultado no servidor não basta. A reserva operacional do gateway conserva
somente metadados e nunca a mídia.

## Casos de erro

- Consentimento/capability/par/arquivo incompatível bloqueia envio sem alterar
  a página para sucesso ou consumir provider.
- Timeout ou conexão perdida depois de uma reserva produz ambiguidade local;
  consultar recibo não dispara processamento e não recupera conteúdo.
- Falha de confirmação durável no servidor não autoriza nova chamada paga.
- Chave vencida é recusada antes de qualquer provider; consulta retorna `404`
  sem recuperar conteúdo, renovar chave ou reexecutar automaticamente. O usuário
  pode iniciar explicitamente outra tentativa, com possível novo custo informado.
- Banco indisponível pode adiar a remoção física de recibos elegíveis, sem
  ampliar validade/consulta ou prometer retenção igual para logs operacionais.
- Abort/background/restart preserva os dados locais e distingue interrupção de
  cancelamento remoto confirmado; não promete retomada de buffers perdidos.
- Resposta inválida ou incompleta nunca produz `READY` local.

## Critérios de aceite

### AC-001 — Disclosure completo e contratualmente verdadeiro

O disclosure descreve processamento volátil, entrega na sessão, armazenamento
no aparelho, rede, operador, subprocessadores/localidades e política dos
metadados; afirmações desconhecidas ou desatualizadas impedem liberar o envio.

### AC-002 — Consentimento explícito, versionado e escopado

Somente ação afirmativa cria aceite para projeto, versão e locale; recusa/saída
não envia conteúdo e a versão volátil exige novo consentimento.

### AC-003 — Zero envio antes das pré-condições

Todos os vínculos, limites e pré-condições são revalidados antes do primeiro
byte da primeira página sair do aparelho; falha preserva o original local.

### AC-004 — Gateway substituível e respostas não confiáveis

Capabilities, execução e consulta de recibo usam porta independente,
autenticada e limitada; versão ou payload incompatível, redirect e resposta
incompleta falham fechados, sem fallback para provider no cliente.

### AC-005 — Secrets e autorização isolados

APK, source, assets, env pública e logs não contêm credenciais privadas de
providers. Autorização anônima é verificável/revogável e consultas são
restritas à instalação proprietária.

### AC-006 — Tentativa durável sem execução duplicada

Attempt/chave existem antes da rede e a reserva durável precede providers.
Duplo toque, timeout, restart e replay não repetem chamada paga ou quota.
A chave UUIDv7 mantém o timestamp das capabilities e expira absolutamente em
sete dias: é recusada antes de provider mesmo após purge; nenhum conteúdo é
preservado pelo recibo.

### AC-007 — Estados locais refletem recibos e entrega reais

O aceite e os metadados de estado são persistidos de forma coerente com a
tentativa. Resultado produzido ou envio aceito nunca é tratado como resultado
adquirido localmente. O fluxo direto usa `DRAFT → PROCESSING`; falha local
comprovada admite `DRAFT → FAILED` na página sem tornar o projeto `FAILED`.
Nova execução explícita admite `FAILED → PROCESSING` na página, inclusive com
projeto já `PROCESSING`, preservando `READY`/`CANCELLED` e sem fila durável
fictícia. Somente a 021 pode efetivar `READY` após validação e commit.

### AC-008 — Ambiguidade e restart seguros

Após falha/restart, uma tentativa possivelmente enviada é reconciliada por
consulta de metadados sem repetir processamento nem renovar sua chave. Tentativa
`CREATED` sem envio ou de contrato retirado tem saída local segura, sem
presumir cancelamento remoto ou deixar a página sem ação. Após sete dias
absolutos da chave, a consulta retorna ausência mesmo antes da remoção física.
Não havendo resultado íntegro local, a UI informa que uma nova execução
explicitamente confirmada, com nova tentativa/chave e possível novo custo,
será necessária para obter o conteúdo.

### AC-009 — Interrupção e cancelamento honestos

Interrupção local, chamada externa possivelmente em curso e término confirmado
são distinguidos. Não há alegação de cancelamento remoto a partir de um abort
local e resultados tardios de sessão interrompida não promovem sucesso local.

### AC-010 — Conteúdo volátil e observabilidade minimizada

Imagem, OCR, tradução e manifesto nunca são persistidos no servidor. Logs e
recibos contêm apenas metadados permitidos, sem conteúdo, tokens ou mensagens
brutas de provider; encerramento não deixa conteúdo para replay. Recibos são
consultáveis somente sob chave ativa. A limpeza física exige simultaneamente
sete dias desde `created_at` e chave vencida, em lotes sujeitos ao banco
disponível; logs operacionais têm política separada, sem promessa desse prazo.

### AC-011 — UX acessível, trilíngue e honesta

Disclosure, rede, envio, ambiguidade, interrupção e falhas têm paridade
pt-BR/en-US/es-ES e acessibilidade. Nenhum estado inventa progresso ou resultado.

### AC-012 — Primeiro slice e limites preservados

A feature submete no máximo a primeira página e entrega o controle da resposta
às etapas 018–021. Não adiciona scheduler, retry automático, lote, Core,
login obrigatório ou provider direto no aplicativo.

## Estratégia de evidência

| Critério | Teste/evidência esperada                                                         |
| -------- | -------------------------------------------------------------------------------- |
| AC-001   | comparação disclosure/capabilities/políticas e contrato volátil                  |
| AC-002   | RNTL aceitar/recusar/reconsentir e round-trip SQLite                             |
| AC-003   | spy de zero bytes por pré-condição inválida                                      |
| AC-004   | contract tests de versão, autenticação, limites, redirects e truncamento         |
| AC-005   | secret scan, autorização revogável e isolamento owner-scoped                     |
| AC-006   | concorrência, replay, commit incerto e purge com UUIDv7 futuro sem novo provider |
| AC-007   | fault injection receipt/commit e ausência de READY prematuro                     |
| AC-008   | restart/UNKNOWN consultam metadados sem recuperar conteúdo                       |
| AC-009   | abort/retorno tardio sem falso cancelamento ou sucesso                           |
| AC-010   | inspeção de I/O/logs e ausência de conteúdo persistido                           |
| AC-011   | RNTL nos três locales e matriz de acessibilidade                                 |
| AC-012   | teste arquitetural de primeira página e ausência de provider no cliente          |

Provas do fluxo anterior são referências históricas e exigem revalidação quando
a interface, o ciclo de vida ou a posse dos buffers mudar. Aprovação visual ou
linguística anterior pode orientar fixtures, sem comprovar privacidade, entrega
ou recuperação da sessão atual.

## Gate de implementação

- Estado: `open`; a fundação local de `MOB-FEAT-016` está implementada,
  conforme o gate já autorizado. O delta de integração da resposta direta está
  registrado na 016 e é verificado nesta revisão da 017, ainda `in-progress`.
- Falta de código ou testes desta revisão impede promovê-la a
  `verification-pending`; esse status só cabe após execução técnica concluída,
  quando restarem verificações reais identificadas.

## Fora de escopo

- OCR, tradução, render e reader dentro desta feature; são etapas 018–021.
- Scheduler, lote, retry automático pago, biblioteca, sync, billing ou login obrigatório.
- Provider direto no app, publicação ou transferência de conteúdo a terceiros pelo usuário.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-11-01

Ruan aprovou explicitamente implementar processamento estritamente volátil,
retorno ao cliente e logs operacionais padrão sanitizados; depois pediu substituir
as especificações antigas por esse requisito. Aprovação inicial do slice em
2026-08-15 permanece no histórico. Esta revisão não autoriza deploy, chamadas
pagas, nova infraestrutura ou publicação de textos legais sem o fluxo pertinente.
