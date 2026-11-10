---
id: MOB-FEAT-018
type: feature
title: OCR multilíngue e regiões de texto
status: verification-pending
implementation_gate: open
blocked_by: [MOB-FEAT-017]
created: 2026-08-15
updated: 2026-11-02
supersedes: []
superseded_by: []
---

# MOB-FEAT-018 — OCR multilíngue e regiões de texto

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

Transformar os bytes da primeira página aceitos na sessão em regiões OCR
estruturadas e ordenadas, usando o idioma confirmado, sem persistir a imagem
ou o texto no servidor.

## Contexto e contratos relacionados

- Depende da revisão volátil da `MOB-FEAT-017`; tradução e renderização
  pertencem a `MOB-FEAT-019/020`.
- Atende RF-TRN-001..008 e controla RSK-001/002/024/033.
- Usa Vision online `DOCUMENT_TEXT_DETECTION` regional `us` com bytes inline.
  O mobile não conhece credenciais ou payload nativo do provider.
- Os códigos de origem são `ja`, `en`, `es`, `ko`, `zh-Hans`, `zh-Hant`,
  `pt-BR`; seleção explícita vira hint, sem troca silenciosa de origem.

## Requisitos e regras

- Revalidar assinatura, formato real, tamanho, dimensões e pixels antes do OCR.
  O decoder e a entrada não podem criar arquivos de mídia no servidor.
- Usar somente operação online síncrona com imagem inline em memória, sem URI
  de conteúdo remoto, batch assíncrono ou exportação de resultados do provider.
- Tratar resposta como não confiável: limites de blocos, texto, vértices,
  coordenadas e payload total são aplicados antes do mapeamento.
- Cada região recebe ID opaco estável dentro da operação, ordem inteira única,
  texto fonte e quatro vértices normalizados ao espaço do original.
- Preservar sequência estrutural página/bloco/parágrafo do provider. Após
  filtragem, ordem é contígua e IDs são determinísticos por operação e posição;
  sem desempate direcional, reordenação geométrica ou layout experimental.
- Blocos/parágrafos são a unidade inicial; não afirmar detecção de balão,
  personagem ou onomatopeia. Escritas horizontal e vertical são aceitas quando
  retornadas; qualidade vertical depende de benchmark e avaliação humana.
- Região vazia, fora dos limites, duplicada ou degenerada é rejeitada
  individualmente; inconsistência que impeça associação segura falha a etapa.
- Página sem texto é resultado válido vazio e continua sem erro.
- Original e regiões permanecem em memória somente enquanto necessários à
  mesma sessão OCR→tradução→render. Não existe manifesto OCR recuperável em
  disco/banco/bucket/fila/cache. Nenhum conteúdo entra em logs ou analytics.
- Nenhuma chamada OCR é repetida automaticamente por replay, timeout ou
  restart. Recibo sanitizado permite auditoria e idempotência da operação.
- Só iniciar tradução após validar integralmente o OCR em memória. Progresso
  comunicado reflete etapas confirmadas; não inventar atualização indisponível.

## Dados e posse

O servidor conserva apenas recibos operacionais da 017. Texto e geometria são
valores limitados em memória com vida vinculada à sessão e ao seu dono; crash
encerra essa posse, sem promessa de recuperação do conteúdo.

No aparelho, persistência final das regiões segue `MOB-FEAT-019/021`, com
`text_regions` e vértices normalizados por região/ordem. Não gravar OCR parcial
como resultado local pronto. Os originais privados do app são preservados.

## Casos de erro

- Hint ausente/incompatível falha antes do provider.
- Timeout/indisponibilidade ou resposta hostil falha com código sanitizado,
  sem tradução/render de dados parciais e sem retry cobrado automático.
- Cancelamento observado impede etapas seguintes; abort local não comprova que
  o provider interrompeu uma chamada já iniciada.
- Encerramento/restart perde buffers da sessão e não relê conteúdo remoto.

## Critérios de aceite

### AC-001 — OCR usa a origem confirmada

Cada um dos sete códigos é convertido explicitamente para o hint suportado,
sem detecção ou fallback silencioso; a chamada online recebe bytes inline.

### AC-002 — Regiões estruturadas e estáveis

Texto, ID, ordem e quatro vértices válidos permanecem associados à operação e
à página durante a passagem em memória para tradução.

### AC-003 — Escritas horizontal e vertical

Fixtures autorizadas provam o mapeamento das duas orientações e os sete códigos;
qualidade real de japonês vertical exige avaliação humana identificada.

### AC-004 — Página sem texto é válida

Imagem decodificável sem regiões produz lista vazia válida e segue no pipeline,
sem provider de tradução desnecessário ou resultado fictício.

### AC-005 — Falha fechada e localizada

Timeout, payload hostil, geometria incompatível ou interrupção impedem entrega
parcial e etapas seguintes, preservam o original local e não afetam outra página.

### AC-006 — Conteúdo volátil e observabilidade segura

Imagem e regiões não são persistidas no servidor. Logs/recibos mantêm somente
metadados permitidos e restart/replay não recupera conteúdo nem repete o OCR.

## Estratégia de evidência

| Critério | Teste/evidência esperada                                          |
| -------- | ----------------------------------------------------------------- |
| AC-001   | sete hints, bytes inline e recusa de batch/URI                    |
| AC-002   | mapeamento, geometria, IDs/ordem e associação em memória          |
| AC-003   | fixtures horizontal/vertical e revisão humana independente        |
| AC-004   | fixture sem texto e zero chamada desnecessária                    |
| AC-005   | timeouts, payloads hostis, interrupção e isolamento entre sessões |
| AC-006   | inspeção I/O/logs, restart e replay sem conteúdo ou nova chamada  |

Provas do fluxo anterior são referências históricas e exigem revalidação quando
a interface, o ciclo de vida ou a posse dos buffers mudar. Aprovação visual ou
linguística anterior pode orientar fixtures, sem comprovar privacidade, entrega
ou recuperação da sessão atual.

## Gate de implementação

- Estado: `open` em 2026-11-02; dependência: `MOB-FEAT-017` em `verification-pending`.
- A revisão independente da ponte 017 e seus gates documentais/técnicos foram
  executados; o código está pronto com verificações reais explícitas abertas.
  A abertura sequencial aplica a autorização de continuidade de Ruan e DEC-008.
  Não aprova ambiente público, benchmark ou aquisição 021.
- A aprovação do requisito não comprova OCR real ou admissão operacional.
  O novo `tasks.md` deriva os critérios da revisão vigente, preservando provas
  antigas somente como referências a avaliar.
- A autorização de continuidade de Ruan permite abrir o gate e planejar a
  execução quando todas as dependências atingirem `implemented` ou
  `verification-pending`, com evidência da revisão vigente. Não declarar
  código ausente como verificação pendente para abrir a cadeia.

## Fora de escopo

- Tradução/renderização dentro desta feature, detecção de balões ou reordenação por layout.
- Glossário, edição, lote, retry automático pago ou provider direto no mobile.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-11-01

Ruan aprovou explicitamente implementar processamento estritamente volátil,
retorno ao cliente e logs operacionais padrão sanitizados; depois pediu substituir
as especificações antigas por esse requisito. Aprovação inicial do slice em
2026-08-15 permanece no histórico. Esta revisão não autoriza deploy, chamadas
pagas, nova infraestrutura ou publicação de textos legais sem o fluxo pertinente.
