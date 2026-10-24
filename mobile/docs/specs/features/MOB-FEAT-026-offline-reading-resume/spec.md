---
id: MOB-FEAT-026
type: feature
title: Leitura offline e retomada local
status: verification-pending
implementation_gate: open
blocked_by: [MOB-FEAT-025]
created: 2026-09-08
updated: 2026-09-08
supersedes: []
superseded_by: []
---

# MOB-FEAT-026 — Leitura offline e retomada local

## Objetivo

Ler resultados privados, alternar para o original e retomar a última página
após fechar ou reiniciar o aplicativo, sem rede ou conta.

## Contexto e contratos relacionados

- Depende da biblioteca local de `MOB-FEAT-025`.
- Mantém domínio separado do leitor publicado de `MOB-FEAT-005`.
- Resultados demo são identificados por `MOB-FEAT-050`; resultado remoto futuro
  usará o mesmo leitor sem mudar o progresso.

## Requisitos e regras

- O leitor mostra resultado por padrão, original sob ação explícita, badge demo
  quando aplicável e painel de regiões/texto.
- Navegação é por páginas válidas do projeto e persiste somente a posição atual
  com escrita limitada, flush em background e desmontagem.
- Retomada valida o vínculo projeto/página; valor inválido volta à primeira.
- Após persistência, leitura e progresso não consultam HTTP, auth ou gateway.

## Casos de erro

- Projeto inexistente retorna com mensagem e acesso à biblioteca.
- Arquivo ausente/hash inválido bloqueia a imagem afetada e oferece regeneração
  em desenvolvimento, preservando o original.
- Região vazia não impede leitura e informa que não há texto identificado.

## Critérios de aceite

### AC-001 — Leitor local separado

Resultado, original, badge e fallback usam somente o domínio local.

### AC-002 — Progresso durável

A última página válida é restaurada após remount e restart.

### AC-003 — Operação offline e segura

Rede, login e gateway indisponíveis não afetam conteúdo pronto.

### AC-004 — UX acessível trilíngue

Controles, estados e erros possuem i18n, foco e touch targets adequados.

## Estratégia de evidência

| Critério | Teste/evidência esperada                |
| -------- | --------------------------------------- |
| AC-001   | RNTL resultado/original/regiões         |
| AC-002   | repository e integração remount/restart |
| AC-003   | spy HTTP vazio e sessão ausente         |
| AC-004   | três locales, labels e fonte ampliada   |

## Gate de implementação

- Estado: `open`, implementação concluída e verificação física pendente
- Dependência: `MOB-FEAT-025`
- Motivo: biblioteca define a origem e lifecycle dos projetos locais.

## Fora de escopo

- Modo duplo, edição, comparação lado a lado, sync ou progresso de conta.
- Processamento remoto em background.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-09-08
