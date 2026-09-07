---
id: MOB-FEAT-046
type: feature
title: Migração da aplicação para Expo SDK 57
status: implemented
implementation_gate: open
blocked_by: []
created: 2026-09-05
updated: 2026-09-06
supersedes: []
superseded_by: []
---

# MOB-FEAT-046 — Migração da aplicação para Expo SDK 57

## Objetivo

Atualizar o runtime mobile do Expo SDK 54 para o SDK 57, preservando os fluxos
existentes e tornando explícitos os requisitos nativos e as exceções temporárias.

## Contexto e contratos relacionados

- Preserva os comportamentos observados e implementados em `MOB-BASE-001..009`
  e `MOB-FEAT-001..045`.
- A migração direta foi aprovada com auditoria das mudanças intermediárias dos
  SDKs 55 e 56, sem introduzir EAS ou pipeline de release.
- A aplicação usa CNG/managed workflow e não mantém `ios/` ou `android/` no Git.

## Requisitos e regras

- Usar Expo SDK 57 em versão que contenha as correções estáveis da linha 57 e
  alinhar React, React Native, Expo Router e módulos nativos ao mapa oficial.
- Remover dependências nativas sem consumidor confirmado; preservar dependências
  transitivamente exigidas pelo Router mesmo sem import direto.
- Preservar o adaptador legado de `expo-file-system` enquanto os contratos de
  cópia/movimentação continuarem baseados na API assíncrona antiga.
- Remover propriedades de StatusBar sem efeito no edge-to-edge atual.
- Documentar Node, Xcode, iOS, Android e JDK suportados; JDK fora da faixa
  recomendada é risco conhecido, não evidência de build Android válido.
- O app deve iniciar sem tela vermelha no simulador iOS e manter launcher,
  autenticação, plataforma, configurações e tradução offline navegáveis.

## Casos de erro

- Incompatibilidade de peer/native module interrompe o gate e deve ser resolvida
  antes de avançar para a reorganização das rotas.
- Falha exclusiva de web causada por módulo opcional deve ser registrada sem ser
  confundida com validação nativa bem-sucedida.
- Ausência de Android físico/JDK compatível mantém a spec em
  `verification-pending`, sem declarar validação nativa completa.

## Critérios de aceite

### AC-001 — Grafo de dependências compatível

O manifesto e o lockfile resolvem Expo SDK 57 e versões compatíveis dos módulos
nativos, sem dependências nativas comprovadamente ociosas.

### AC-002 — Gates automatizados preservados

Specs, TypeScript, lint, fronteiras FSD e Jest passam após a atualização.

### AC-003 — Inicialização e navegação iOS

O bundle abre no simulador iOS sem erro fatal e os fluxos críticos permanecem
visualmente acessíveis.

### AC-004 — Compatibilidade nativa honesta

Os requisitos de toolchain e a evidência real de iOS/Android ficam registrados,
sem promover execução ausente a sucesso.

## Estratégia de evidência

| Critério | Teste/evidência esperada                                                |
| -------- | ----------------------------------------------------------------------- |
| AC-001   | `expo install --check`, resolução pnpm e auditoria de imports           |
| AC-002   | `pnpm specs:check`, typecheck, lint, lint:fsd e Jest                    |
| AC-003   | execução observada no Simulator e smoke dos fluxos críticos             |
| AC-004   | diagnóstico de ambiente e registro da verificação Android pendente/real |

## Gate de implementação

- Estado: `open`
- Dependências: nenhuma
- Motivo: é a fundação técnica das rotas e da documentação desta migração.

## Fora de escopo

- Configurar EAS Build, submissão às lojas ou pipeline de release.
- Reescrever o acesso a arquivos que permanece válido na API legacy.
- Declarar Android validado sem execução em aparelho físico.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-09-05

A implementação foi solicitada explicitamente após a aprovação do plano.
