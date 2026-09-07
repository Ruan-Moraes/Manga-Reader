---
id: MOB-FEAT-049
type: feature
title: Identidade Toonlira
status: approved
created: 2026-09-07
updated: 2026-09-07
implementation_gate: open
blocked_by: []
supersedes: []
superseded_by: []
---

# MOB-FEAT-049 — Identidade Toonlira

## Objetivo

Preparar o aplicativo para a identidade Toonlira em uma nova instância, sem
compatibilidade com chaves, banco SQLite ou arquivos locais da marca anterior.

## Requisitos

- `app.json` deve expor `name`, `slug` e `scheme` como `toonlira`, além dos
  identificadores Android e iOS `com.toonlira.app`.
- Textos públicos, permissões e links configurados devem consumir a configuração
  de marca gerada a partir de `scripts/config/brand.json`.
- O banco local, arquivos privados e chaves locais devem usar identificadores
  Toonlira; instalações da marca anterior não são migradas.
- Todos os textos visíveis devem permanecer localizados em pt-BR, en-US e es-ES.
- A alteração não pode adicionar trabalho recorrente de renderização, I/O ou rede.

## Critérios de aceite

### AC-001 — Metadados Expo

O manifesto Expo mostra Toonlira, usa slug e scheme `toonlira`, e contém os IDs
publicáveis definitivos de Android e iOS.

### AC-002 — Configuração única

O nome, URLs e contatos apresentados pelo app derivam do artefato gerado pela
fonte central, sem cópias manuais divergentes.

### AC-003 — Nova persistência local

Uma instalação nova usa exclusivamente nomes Toonlira para SQLite, chaves e
diretórios privados, preservando os contratos locais atuais.

### AC-004 — Localização e qualidade

Os três idiomas interpolam `brandName` corretamente, nenhuma chave literal é
exibida e `pnpm check` permanece verde.

## Gate de implementação

Esta spec requer aprovação humana e atualização coordenada de `registry.md` e
`coverage.json` antes de criar tasks ou alterar arquivos de runtime.
