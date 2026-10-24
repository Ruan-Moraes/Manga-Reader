---
id: MOB-FEAT-049
type: feature
title: Identidade Toonlira
status: verification-pending
created: 2026-09-07
updated: 2026-09-08
implementation_gate: open
blocked_by: []
supersedes: []
superseded_by: []
---

# MOB-FEAT-049 — Identidade Toonlira

## Objetivo

Preparar o aplicativo para a identidade Toonlira em uma nova instância, sem
compatibilidade com chaves, banco SQLite ou arquivos locais da marca anterior.

## Contexto e contratos relacionados

- Complementa `MOB-FEAT-046..048` sem alterar os contratos do SDK, Router ou
  taxonomia documental.
- Afeta os identificadores observados em `MOB-BASE-001` e os dados privados
  implementados por `MOB-FEAT-012..017`.
- A nova instância ainda não possui usuários publicados, portanto não há
  compatibilidade ou migração cross-brand a preservar.

## Requisitos e regras

- `app.json` deve expor `name`, `slug` e `scheme` como `toonlira`, além dos
  identificadores Android e iOS `com.toonlira.app`.
- Textos públicos, permissões e links configurados devem consumir a configuração
  de marca gerada a partir de `scripts/config/brand.json`.
- O banco local, arquivos privados e chaves locais devem usar identificadores
  Toonlira; instalações da marca anterior não são migradas.
- Todos os textos visíveis devem permanecer localizados em pt-BR, en-US e es-ES.
- A alteração não pode adicionar trabalho recorrente de renderização, I/O ou rede.

## Casos de erro

- Fonte de marca inválida ou artefato gerado divergente deve falhar no gate, sem
  fallback silencioso para a marca anterior.
- URL pública insegura, contato ausente ou identificador nativo inválido deve
  impedir a geração.
- Instalações antigas não são abertas nem migradas para o banco Toonlira.

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

- Estado: `open`, implementação concluída e gate de formatação pendente
- Dependências: nenhuma
- Motivo: identidade definitiva aprovada antes da primeira publicação nativa.

## Estratégia de evidência

| Critério | Teste/evidência esperada                                     |
| -------- | ------------------------------------------------------------ |
| AC-001   | validação do manifesto Expo e IDs nativos                    |
| AC-002   | teste da geração e busca por literais divergentes            |
| AC-003   | testes de nomes do SQLite, SecureStore e diretórios privados |
| AC-004   | paridade dos locales e execução integral de `pnpm check`     |

## Fora de escopo

- Migração de dados ou credenciais da marca anterior.
- Publicação de binários, assinatura, EAS ou alteração de recursos cloud.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-09-07
