# Proposta de revisão delimitada da MOB-FEAT-021 — 2026-10-24

**Estado: aprovada por Ruan em 2026-10-25**, com a resposta explícita
“Aprovar revisão e implementar”. Autoriza aplicar os ajustes abaixo à spec
e ao registry, abrir o gate da 021 e implementar dentro destes limites. Solicitada para continuar o primeiro fluxo real de uma página
até a leitura offline, após a prova de providers e renderer desta data.

## Decisão proposta

Permitir implementar a aquisição mobile contra o contrato terminal já executado,
separadamente da admissão operacional completa do serviço de renderização. A 020
continua `in-progress`, com segurança/distribuição, orçamento do serviço alvo,
matriz completa e qualidade multilíngue pendentes. Nenhuma dessas pendências
recebe aprovação por esta revisão.

Na 021, substituir `blocked_by: [MOB-FEAT-020]` por
`blocked_by: [MOB-FEAT-019, MOB-FEAT-026, MOB-FEAT-027, MOB-FEAT-051]` e abrir o
gate somente com aprovação humana desta proposta. Todas essas dependências
constam como `verification-pending`; continuam com suas verificações abertas.
A 020 permanece uma integração técnica acompanhada, sem ser declarada concluída.

A pré-condição técnica adicional é satisfeita pela página sintética autorizada:
OCR e tradução reais capturados uma vez, replay sem rede no worker isolado,
PostgreSQL temporário, três estágios bem-sucedidos, `READY`, WebP e manifesto
vinculados ao original, zero overflow e conferência visual. Hashes e limites
serão registrados na evidência; os arquivos e identificadores ficam privados.
Isso permite testar aquisição íntegra sem publicar gateway ou repetir providers.

## Ajustes exatos de intenção na spec

1. **Leitor:** manter domínio/projetos locais separados de Chapter/publicação,
   mas adaptar resultados remotos ao leitor unificado entregue pela 051.
   Não criar um segundo motor de leitura nem overlay demonstrativo em resultado
   remoto. A 051 não é reclassificada como implementação da aquisição.
2. **Persistência:** substituir o plano histórico “SQLite v6 adiciona” pelo
   reuso das tabelas de resultados, regiões, vértices e metadados já existentes
   no SQLite v9. `source_kind=REMOTE` exige attempt remoto válido; não converter
   DEMO em REMOTE, não perder drafts e não criar migration nesta entrega.
3. **Gate:** aplicar a separação e dependências acima, condicionadas ao contrato
   terminal real executado. Não remover requisitos de integridade para abrir
   leitor ou atribuir `READY`.
4. **AC-004:** interpretar “leitor local separado” como separação de domínio,
   persistência e adaptadores locais, com a viewport compartilhada da 051.
   Original e fallback de overflow permanecem acessíveis offline.

Os oito ACs continuam obrigatórios, incluindo foreground/restart, progresso
verdadeiro, limite/host/HTTPS/hash/MIME/dimensões, manifesto estrito, commit
atômico, ACK posterior, auto-open consumido uma vez, expiração/cancelamento,
arte-only, erros honestos, acessibilidade e três locales. Não trocar o fluxo por
importação de demonstração. Planejamento e modelagem detalhados vêm após a
aprovação, usando as skills normativas; incompatibilidade com v9 deve ser
resolvida sem migration ou submetida como decisão separada.

## Limites e evidências exigidas

- Gateway público, uploads públicos e providers no app continuam desabilitados.
- Nenhuma credencial de provider vai para APK, arquivos mobile ou Git.
- Não altera contratos públicos, schemas do backend ou migrations.
- A página real já produzida pode ser reutilizada nos testes de aquisição;
  transporte controlado deve respeitar HTTPS e os mesmos validadores.
- Testes devem cobrir URL/manifesto hostil, truncamento/hash, disco/move/commit,
  restart, ACK perdido, auto-open, leitura sem rede e alternância para original.
- `pnpm check`, review e drift obrigatórios. Verificação física pendente não é
  convertida em sucesso; usar `verification-pending` se ainda aplicável.
- Tetos permanecem US$ 100 total, US$ 5 na rodada e US$ 1 nos providers desta
  página. Não há autorização para outra chamada paga ou nova VM nesta revisão.

## Registro de aprovação

- Aprovador: Ruan Moraes.
- Decisão/data: “Aprovar revisão e implementar”, 2026-10-25, neste chat.
- Aprovação distinta da autorização anterior para processar a página.

## Origem da necessidade de aprovação

`mobile/AGENTS.md`: “Mudança de comportamento atualiza a spec antes do código”
e “Uma pessoa aprova a spec e atualiza spec + registry para `approved`”.

`mobile/.agents/skills/sdd-spec-architect/SKILL.md`: “Não marcar a spec como
`approved`; somente uma pessoa pode registrar essa transição” e “Se faltar uma
decisão de produto que altere critérios, parar e solicitar direção”.

Esta proposta altera a dependência da 021 e reconcilia leitor/persistência com
contratos posteriores. A autorização genérica de continuar não foi interpretada
como aprovação silenciosa dessas alterações.
