---
id: MOB-FEAT-055
type: feature
title: Obras locais, capítulos e tradução de múltiplas páginas
status: verification-pending
implementation_gate: open
blocked_by: [MOB-FEAT-017, MOB-FEAT-021, MOB-FEAT-025, MOB-FEAT-051]
created: 2026-11-04
updated: 2026-11-08
supersedes: []
superseded_by: []
---

# MOB-FEAT-055 — Obras locais, capítulos e tradução de múltiplas páginas

## Objetivo

Organizar obras privadas em capítulos e páginas e permitir sua tradução,
recuperação e leitura local, preservando o trabalho já existente no aparelho.

## Contexto e contratos relacionados

- Refina MOB-FEAT-012/013/015/016 para reutilizar importação, ordenação,
  validação e projetos locais existentes.
- Altera a limitação de primeira página de MOB-FEAT-017/021 para as páginas do
  capítulo, preservando consentimento, chave por tentativa, recibo sem conteúdo,
  entrega volátil e commit privado antes de marcar página pronta.
- Estende MOB-FEAT-025, hoje uma lista de projetos, com obras e capítulos;
  preserva biblioteca guest-first e registros antigos.
- Refina MOB-FEAT-029/051/052 para navegação de cabeçalho e zoom; não substitui
  o reader unificado nem cria leitor paralelo.
- Não altera o gateway, o contrato binário, o limite de admissão ou a política
  de conteúdo volátil do servidor. Reprocessar exige nova decisão explícita.

## Requisitos e regras

- Importar várias imagens em uma operação, manter sua ordem e permitir revisão
  e reorganização antes de preparar um capítulo.
- A biblioteca local lista obras com nome obrigatório e capa escolhida pelo
  usuário ou imagem padrão empacotada. Permite criar, abrir, renomear,
  substituir/remover capa e excluir mediante confirmação explícita que descreva
  a remoção dos capítulos, originais, resultados e progresso associados.
- Uma obra contém capítulos com número ou nome obrigatório. Criar, editar,
  ordenar e excluir capítulos sem alterar os irmãos; cada capítulo contém
  páginas ordenadas e liga-se ao projeto privado existente.
- Dados anteriores devem continuar acessíveis após migração; projetos sem obra
  devem aparecer como itens anteriores até serem vinculados, sem apagamento ou
  nomes inventados. Edição não perde páginas, resultados nem progresso.
- Processar sequencialmente as páginas elegíveis, respeitando capacidade,
  quotas, limites de tamanho e consentimento em vigor. Mostrar progresso por
  página e agregado; distinguir pendente, processando, concluída e erro.
- Falha conhecida de uma página não apaga resultados nem impede o tratamento
  das demais elegíveis. Repetição é explícita e limitada às páginas escolhidas
  com falha; nunca reenviar uma tentativa ambígua automaticamente. Uma resposta
  ambígua exige reconciliação e, se não houver certeza, decisão humana antes de
  nova tentativa paga. Respeitar admissão única e não executar providers em
  paralelo para contornar bloqueios, quotas ou timeouts.
- Persistir original, estados e resultados privados já adquiridos. Saída da tela
  ou interrupção não promete concluir trabalho em segundo plano: preservar o
  commit já concluído e reconciliar tentativas ambíguas sem reenvio.
- Na leitura, falha em uma página apresenta o original quando íntegro, com
  indicador pequeno e contrastante no canto superior direito, descrição
  acessível e ação para tentar novamente apenas essa página. Durante retry
  apresentar estado atualizado; falha mantém original e não apaga resultado
  anterior válido. Páginas vizinhas permanecem disponíveis.
- Oferecer zoom por pinça, pan e ação intuitiva de restauração de escala, com
  proporção preservada, controle acessível e coordenação com navegação e scroll;
  funciona nas variantes original e traduzida.
- Voltar retorna à etapa imediatamente anterior quando disponível, preserva
  draft e imagens; se o projeto já consumiu o draft, o fluxo deve oferecer uma
  transição coerente e preservar seus dados, sem simular edição inexistente.
  Home retorna à raiz de qualquer etapa e trata processamento em curso sem perda
  silenciosa ou reenvio automático. Ambos têm dimensões, área de toque,
  alinhamento e cantos quadrados consistentes com o controle existente.
- Usar textos acessíveis nos três idiomas, tokens visuais e memória limitada para
  capítulos com dezenas de imagens. Preservar fontes, leitura offline e modos
  atuais; não introduzir providers nem credenciais no aplicativo.

## Casos de erro

- Imagem ou capa inválida não substitui arquivo anterior; limpeza e recuperação
  de arquivos órfãos são idempotentes após falha ou interrupção.
- Falhas de banco, arquivo ou rede apresentam erro recuperável e não deixam
  referências pendentes nem afirmam sucesso. Se o original estiver indisponível
  ou corrompido, exibir reparo localizado em vez de página vazia silenciosa.
- Expiração, quota, capacidade ou desconhecimento de recibo não causam retry
  pago automático nem impedem a leitura dos resultados já salvos.
- Exclusão concorrente com processamento impede commit em item removido e
  interrompe/reconcilia o trabalho sem apagar dados de outra obra.

## Critérios de aceite

### AC-001 — Migração e integridade local

Projetos, páginas, tentativas, resultados, arquivos e progresso existentes
sobrevivem à migração e permanecem acessíveis; relacionamentos, restrições e
limpeza mantêm integridade após interrupção e falha.

### AC-002 — Obras e capas

Criar, listar, abrir, editar e excluir obras; nome obrigatório e capa padrão
funcionam, com confirmação clara antes da exclusão e sem afetar outras obras.

### AC-003 — Capítulos e páginas

Cada obra aceita múltiplos capítulos nomeados ou numerados, editáveis e
removíveis, em ordem coerente; importar e reordenar múltiplas páginas preserva
posição e conteúdo dos demais capítulos.

### AC-004 — Processamento em lote e progresso

O banner do capítulo usa sua primeira imagem original. O painel de lote mostra
o percentual de páginas salvas do capítulo inteiro, além do total de páginas,
das falhas e do progresso da seleção processada.

Uma ação inicia sequencialmente as páginas elegíveis e expõe estados individuais
mais progresso agregado, respeitando limites e persistindo resultados prontos.

### AC-005 — Falhas e retry seletivo

Falha isolada não interrompe as demais; somente páginas selecionadas com erro
são reprocessadas por decisão explícita, sem chamadas duplicadas e sem apagar
resultados ou originais de outras páginas.

### AC-006 — Leitor com fallback por página

Uma página com falha exibe original, indicador acessível e descrição; retry
atualiza somente essa página, e original permanece se houver nova falha.

### AC-007 — Zoom e gestos

Pinça, pan e restauração funcionam em originais e traduções com proporção
preservada, sem conflito com navegação, scroll ou modos do leitor.

### AC-008 — Navegação e cabeçalho

Voltar e Home cumprem seus destinos e preservam estado; os botões têm formato
quadrado, tamanho, bordas, alinhamento e áreas de toque consistentes.

### AC-009 — Segurança operacional e retomada

Interrupção, reinício, ambiguidade e quotas não geram reenvio pago automático,
perda silenciosa nem exposição de conteúdo; conteúdo já salvo abre offline.

### AC-010 — Qualidade e regressão

Testes de migração, repositórios, coordenação de lote, erros, gestos, navegação,
i18n e FSD passam; evidência em Android físico cobre fluxo e acessibilidade.

## Estratégia de evidência

| Critério | Teste/evidência esperada                                       |
| -------- | -------------------------------------------------------------- |
| AC-001   | migração SQLite real, FK, recuperação após falha e preservação |
| AC-002   | repositório e UI de CRUD, fallback de capa e exclusão          |
| AC-003   | integração obra-capítulo, ordenação e isolamento               |
| AC-004   | orquestração sequencial, limites e progresso por página        |
| AC-005   | falha isolada, idempotência, ambiguidade e retry seletivo      |
| AC-006   | reader misto, original, indicador, retry e falhas de arquivo   |
| AC-007   | testes de gestos, medidas e validação nativa                   |
| AC-008   | navegação por etapa, saída em processamento e geometria        |
| AC-009   | interrupção/restart, offline, quotas e inspeção dos dados      |
| AC-010   | pnpm check, regressão e matriz de aparelho físico              |

## Gate de implementação

- Estado: `open` após aprovação humana desta Target Spec.
- Dependências: MOB-FEAT-017, MOB-FEAT-021, MOB-FEAT-025 e MOB-FEAT-051.
- As dependências estão em `verification-pending`; não implica aceite físico.

## Fora de escopo

Sincronização em nuvem, publicação de obras, contas obrigatórias, tradução em
servidores de terceiros pelo app e fechamento formal das features anteriores.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-11-04
- Evidência: resposta “Aprovado.” à apresentação desta Target Spec.

## Revisão aprovada — 2026-11-11

Aprovação registrada pelo pedido de implementação do plano do leitor, capítulos e modo desenvolvedor.

### AC-011 — Estados de tradução por página e capítulo

Tentativas e resultados por página distinguem tradução não iniciada, falha comprovada, cancelamento e incerteza. Na obra, uma tradução interrompida com páginas restantes aparece como Incompleto.

## Revisão solicitada em 2026-11-11

Em capítulos ativos, a elegibilidade e as transições de tradução são validadas pela página selecionada, inclusive quando o agregado estiver READY. Tentativas incertas exigem reconciliação.
