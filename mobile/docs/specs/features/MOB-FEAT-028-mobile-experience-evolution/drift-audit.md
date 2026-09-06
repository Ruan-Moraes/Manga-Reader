# Drift audit — MOB-FEAT-028

## Adendo de largura das etapas — 2026-08-30

O pedido explícito de ocupar toda a largura útil está registrado na spec e
implementado em `ProgressSteps`, preservando padding, estados, semântica e i18n.
A revisão e os resultados automatizados constam em `review.md`. A prévia web
falhou antes de exibir a tela; a confirmação visual permanece pendente, assim
como as pendências globais anteriores. Nenhum checksum global foi renovado.

SHA-256 do componente revisado: `9992603792232b9b674fa9fd47061a68101bec7456d8db8ded7005334760490c`.

## Adendo da correção — 2026-08-30

Status atual: `verification-pending`. A implementação de Continuar corresponde
à navegação e à preservação de estado de AC-003/004; estados e localização
estão cobertos pelos testes de AC-005/013. Nenhuma mudança de persistência,
etapa de domínio ou requisito foi introduzida. O mapa individual foi atualizado
para o painel, a página e o novo teste.

Verificações abertas da correção: 3 (TASK-010/015/016). TypeScript, lint, FSD,
formato e 481 testes passaram. `pnpm check` encontra somente divergências de
checksum de reviews, também presentes antes da mudança. Não foram renovadas
reviews de outras features para forçar o gate. A auditoria nativa confirmou
continuidade e ordem com cinco páginas; fonte ampliada permanece pendente.

Detalhes reproduzíveis: `evidence/continue-existing-import.md`.
O registro abaixo é histórico e não declara zero pendências da correção atual.

## Auditoria histórica

Data: 2026-08-22

- Implementação auditada: working-tree sha256:9df90bc58827359dd921a48f537f3c111a755991b5615f70601e493896b0f41e
- Status da feature: `implemented`

## Divergências

Nenhuma divergência normativa. A implementação recebeu uma segunda passagem
visual cujos critérios estão consolidados nas specs e evidências. TASK-010 e
TASK-016 foram fechadas com auditoria física em simulador, incluindo tamanho
dinâmico ampliado, temas, teclado e rotação.

## Contadores

- `mismatch`: 0
- `undocumented`: 0
- arquivos runtime descobertos: 0
- caminhos obsoletos: 0
- violações de gate: 0
- verificações abertas: 0

## Escopo auditado

Spec, tasks, registry, coverage, tema, primitivas compartilhadas, launcher,
autenticação, settings, jornada offline, reader, i18n, testes e boundaries FSD.
Não houve ampliação para capacidades futuras.

Revalidação global de 2026-08-30: checksum da working tree atualizado após a
manutenção dos TODOs de auth/review local. A referência é global por definição
do validador; não representa nova inspeção nativa desta feature.

## Referência verificável da correção — 2026-08-30

SHA-256 por arquivo do escopo revisado (executar `shasum -a 256 <caminho>`
em `mobile/`). Inclui as alterações anteriores presentes nesses arquivos;
não certifica mudanças fora desta correção nem substitui a referência global
histórica exigida pelo gate de specs.

```text
6025c3693046130dbb685927bfcdc9532bc86e694333c10ecdefafe6ecf07177  src/features/import-local-media/ui/ImportLocalMediaPanel.tsx
164b9214d88b9b7ad0d99e58427b41b8e3bffc1911306d9fc77cefaac40be6af  src/features/import-local-media/ui/__tests__/ImportLocalMediaPanel.test.tsx
afbc5385e65426d55ec344e6a9808d8c211ea361ff6d7d302df95aaf9efab6f2  src/pages/offline-translation/ui/OfflineTranslationPage.tsx
adac6b52b3f594e3b083502398f37e75409f8260e2d421d4016449a493501c38  src/pages/offline-translation/ui/__tests__/OfflineTranslationPage.test.tsx
2c2470f105063563d72ea92add72fc4a0d3698f0a5c579b5b17bf90f2aaa5e18  src/shared/i18n/locales/pt-BR/launcher.json
2df77d16b483f7d372d7bb99a7d11b58771efa27a4d73656b0f99b4b41c81435  src/shared/i18n/locales/en-US/launcher.json
da14c821f7ad89945e5b37760db6cc63427912a165980e6c4f3855b710b5cb90  src/shared/i18n/locales/es-ES/launcher.json
```

Rebase documental de performance (2026-09-05): checksum global atualizado pela inclusão da auditoria e da MOB-DEC-007; runtime preservado por comparação SHA-256. Não representa nova verificação física nem alteração de verdict.

Rebase C01/C03/C04 (2026-09-06): checksum global atualizado após correções de numeração do leitor, persistência da validação e limite de resposta. Escopo e validações em [review de performance](../../../active/performance-evidence/corrections-2026-09-06/review.md). Não representa nova verificação física das demais features.

Rebase C02/C05 (2026-09-06): checksum global atualizado após virtualização do leitor e download de exportação para arquivo. [Escopo e validação](../../../active/performance-evidence/corrections-c02-c05-2026-09-06/review.md). Não representa nova verificação física das demais features.

Consolidação documental (2026-09-06): checksum global atualizado após reconciliar o estado de performance; runtime e verdict preservados. [Registro](../../../active/performance-evidence/consolidation-2026-09-06/review.md). Sem nova validação física.

Preparação de commit (2026-09-06): rebase global após excluir scripts avulsos de ensaio, listagens Git e metadados do sistema dos arquivos versionados, conforme solicitação humana. Resultados históricos preservados; runtime e verdict inalterados.
