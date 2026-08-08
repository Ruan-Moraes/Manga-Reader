---
id: MOB-FEAT-007
type: feature
title: Controles de dados
status: draft
created: 2026-08-08
updated: 2026-08-08
implementation_gate: blocked
blocked_by: [MOB-FEAT-001]
supersedes: []
superseded_by: []
---

# MOB-FEAT-007 — Controles de dados

## Objetivo

Oferecer controles nativos e seguros para cache local, exportação dos dados da conta e limpeza do histórico rastreado, deixando explícito o que cada ação preserva e evitando reproduzir APIs específicas de navegador.

## Contexto e contratos relacionados

- Depende da classificação e persistência de dados definida em `MOB-FEAT-001`.
- Exportação autenticada usa `GET /users/me/data-export`, retorna JSON e inclui conta, privacidade, biblioteca, recomendações, progresso, histórico, capítulos lidos, atividades e eventos comportamentais.
- Limpeza autenticada usa `DELETE /users/me/tracked-history`. A Core remove histórico, leituras e atividades rastreadas, mas preserva a posição funcional em `reading-progress`.
- A medição Web baseada em quota do navegador é apenas referência; no mobile ela depende de capacidade nativa comprovada por plataforma.

## Requisitos e regras

- A limpeza de cache deve remover dados regeneráveis mantidos pelo aplicativo, incluindo cache de queries, imagens e arquivos temporários sob controle do app.
- A limpeza de cache deve preservar tokens de sessão, preferências locais, dados pendentes de sincronização e arquivos exportados para fora do sandbox de cache.
- Antes de limpar, a UI deve listar em linguagem localizada as categorias removidas e preservadas e exigir confirmação. Durante a operação, ações concorrentes devem ficar bloqueadas.
- Após a limpeza, queries ativas podem ser recarregadas conforme a conectividade, mas o app não deve provocar logout, reset de onboarding ou retorno silencioso aos defaults de settings.
- Exportação deve estar disponível somente para pessoa autenticada. O JSON recebido deve ser entregue ao mecanismo nativo de compartilhamento ou salvamento com nome de arquivo estável que contenha a data, sem criar URL de objeto ou elemento de download Web.
- O arquivo de exportação não deve ser gravado em logs, analytics ou armazenamento persistente interno além do temporário necessário para compartilhar. O temporário deve ser removido após conclusão ou cancelamento quando a plataforma permitir.
- Limpeza do histórico rastreado deve estar disponível somente para pessoa autenticada, exigir confirmação de irreversibilidade e explicar que a posição funcional de leitura será preservada.
- Após `DELETE /users/me/tracked-history` bem-sucedido, devem ser invalidados histórico, capítulos lidos, atividades e analytics relacionados; cache de `reading-progress` e preferências deve permanecer.
- Uso de armazenamento deve ser mostrado apenas quando a plataforma puder medir de forma confiável bytes controlados pelo app. Sem suporte, o app omite a métrica, mantendo disponível a ação de limpeza.
- Em FSD, exportar e limpar são features de ação; os contratos de dados da conta pertencem a `entities/user`; medição, filesystem temporário e share sheet agnósticos ficam em `shared`; a tela apenas compõe essas capacidades em `pages`.

## Casos de erro

- Falha parcial ao limpar caches deve informar quais categorias não foram removidas e permitir nova tentativa, sem apagar dados protegidos para simular sucesso.
- Exportação cancelada não é erro; deve retornar ao estado ocioso e limpar temporários sem toast de falha.
- Falha de download, escrita ou compartilhamento deve manter o arquivo fora de destinos públicos incompletos e oferecer nova tentativa.
- `401` em exportação ou limpeza de histórico deve seguir o fluxo de sessão e nunca cair para uma operação guest equivalente.
- Falha de invalidação após limpeza confirmada pela Core deve manter o sucesso da operação e forçar refetch antes de exibir dados potencialmente antigos.

## Critérios de aceite

### AC-001 — Limpeza preserva dados protegidos

Dada uma sessão com preferências, sync pendente, queries, imagens e temporários, quando a limpeza de cache for confirmada, então queries/imagens/temporários regeneráveis devem ser removidos e sessão, preferências e pendências devem permanecer byte a byte equivalentes.

### AC-002 — Confirmação informa o alcance

Quando a pessoa iniciar uma limpeza de cache ou histórico, então a confirmação deve identificar o que será removido, o que será preservado e a irreversibilidade aplicável; cancelar não deve executar efeitos.

### AC-003 — Exportação nativa autenticada

Dada uma pessoa autenticada e uma resposta JSON válida de `/users/me/data-export`, quando exportar, então o app deve abrir compartilhamento/salvamento nativo com arquivo JSON datado e não deve usar APIs de DOM ou URL de objeto.

### AC-004 — Cancelamento e temporários da exportação

Quando a pessoa cancelar o compartilhamento, então a operação deve terminar sem erro e nenhum conteúdo exportado deve permanecer em logs ou cache temporário além do necessário pela plataforma.

### AC-005 — Limpeza do histórico preserva progresso

Dada uma pessoa autenticada, quando `DELETE /users/me/tracked-history` for confirmado com sucesso, então histórico, capítulos lidos, atividades e analytics devem ser invalidados, enquanto `reading-progress`, sessão e preferências permanecem intactos.

### AC-006 — Ações privadas indisponíveis para guest

Dada uma sessão anônima, quando os controles de dados forem exibidos, então exportação e limpeza de histórico não devem disparar requests `/users/me`; a limpeza do cache local continua disponível.

### AC-007 — Medição condicional

Dada uma plataforma sem medição confiável dos bytes do app, quando a tela abrir, então nenhum total ou percentual inventado deve ser mostrado; em plataforma suportada, a medida deve indicar claramente o escopo contado.

### AC-008 — Falha recuperável

Quando uma operação falhar, então os dados preservados devem continuar utilizáveis, o estado busy deve terminar, o erro deve ser localizado e uma nova tentativa não deve duplicar exportações nem ampliar a limpeza.

## Estratégia de evidência

| Critério | Teste/evidência esperada                                                |
| -------- | ----------------------------------------------------------------------- |
| AC-001   | Teste de integração do classificador de storage antes/depois da limpeza |
| AC-002   | Testes de interação para cancelar e confirmar ambas as ações            |
| AC-003   | Teste de integração HTTP mais mock do adaptador nativo de arquivo/share |
| AC-004   | Teste de cancelamento e inspeção de logs/temporários                    |
| AC-005   | Teste de query keys e stores preservados após resposta 2xx              |
| AC-006   | Teste guest com chamadas HTTP inspecionadas                             |
| AC-007   | Testes de capability detection com e sem suporte nativo                 |
| AC-008   | Testes de falha por etapa, desbloqueio da UI e retry idempotente        |

## Gate de implementação

- Estado: `blocked`
- Dependências: `MOB-FEAT-001`
- Motivo: os controles devem distinguir dados protegidos, preferências e identidade antes de limpar ou exportar conteúdo.

O gate só pode ser aberto quando `MOB-FEAT-001` estiver `implemented`.

## Fora de escopo

- Importação ou restauração de arquivo de dados.
- Exclusão definitiva da conta.
- Limpeza de dados mantidos pela Core fora do endpoint de histórico rastreado.
- Exibição de quota total do dispositivo ou de outros aplicativos.
- Download automático, backup em nuvem ou envio da exportação a terceiros.

## Aprovação humana

- Aprovador: pendente
- Data: pendente

Não criar `tasks.md` antes de status `approved`, aprovação preenchida e `implementation_gate: open`.
