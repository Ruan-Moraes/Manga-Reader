# Review — MOB-FEAT-028

- Spec revisada: `spec.md`
- Implementação/revisão: working-tree sha256:cb2e5226cae5289175f02ef3243e0e048890a91e89ff1da21764db1ee89ab84e
- Gate na entrada do planejamento: `open`
- Dependências verificadas: `MOB-FEAT-011..016`
- Verdict: `verification-pending`

## Refinamento da largura das etapas — 2026-08-30

Pedido explícito incorporado à spec: `ProgressSteps` usa toda a largura útil,
com marcadores nas extremidades e conectores flexíveis de mesmo tamanho. A
legenda ativa acompanha o marcador e alinha-se para dentro nas pontas. O padding
continua sob responsabilidade da página; estado, textos e navegação não mudaram.

TypeScript, FSD, ESLint e formato do componente passaram. A suíte mobile passou
com 495 testes; após o ajuste final de alinhamento da legenda, os 32 testes de
UI compartilhada e da página foram reexecutados e passaram. `pnpm check` parou
nas divergências globais de checksum já documentadas. A prévia web ficou em
branco com erro em `LogBoxInspectorContainer` do Expo, sem confirmação visual.
Mantém-se `verification-pending`, sem renovar evidências históricas.

SHA-256 de `src/shared/ui/ProgressSteps.tsx`:
`9992603792232b9b674fa9fd47061a68101bec7456d8db8ded7005334760490c`.

## Revalidação da correção — 2026-08-30

Escopo: botão Continuar na etapa de importação e navegação para organização,
conforme AC-003/004/005/013/014, sem alterações de requisitos ou persistência.
O callback é opcional, a page controla a etapa e o painel bloqueia a ação sem
imagens ou durante operações. Cancelamento/erro preservam a continuidade com
o rascunho anterior. Não há import horizontal entre features.

Os 481 testes, TypeScript, lint, FSD e formato passaram. A navegação nativa
preservou as cinco páginas e sua ordem. A conferência com fonte ampliada ficou
pendente por falha de controle da janela do simulador, e `pnpm check` continua
bloqueado pelos checksums de reviews já divergentes antes da correção.

Evidência atual: [Continuar com imagens existentes](evidence/continue-existing-import.md).
A referência global de implementação no cabeçalho e os resultados históricos
abaixo não foram renovados como se toda a feature tivesse sido reauditada.
O checksum dos arquivos desta correção é registrado no adendo de drift.

## Revisão histórica — 2026-08-22

## Findings

Nenhum finding bloqueante de código ou evidência automatizada permanece. A
passagem visual corretiva consolidou seus critérios nas specs, nos tokens e nas
primitivas compartilhadas. O launcher usa composição editorial, hero geométrico
e módulos compactos; a jornada local adota títulos, drop zone, stepper e grade
de páginas coerentes; autenticação e aparência receberam o mesmo contraste de
escala e superfícies. As cinco etapas continuam derivadas do draft persistido e
nenhuma funcionalidade futura foi liberada.

A matriz física foi executada no iPhone 17 Simulator em claro/escuro, retrato,
paisagem, teclado aberto e tamanho dinâmico ampliado além das categorias padrão.
Os refinamentos da segunda passagem estão documentados em `MOB-FEAT-029`.

## Critérios e evidências

| Critério | Implementado | Evidência verificada                                                              | Resultado |
| -------- | ------------ | --------------------------------------------------------------------------------- | --------- |
| AC-001   | sim          | tokens semânticos e busca sem cores literais fora do tema                         | pass      |
| AC-002   | sim          | Icon, IconButton, StatusMessage, ProgressSteps, dialog, action bar e consumidores | pass      |
| AC-003   | sim          | resolvedor e page apresentam exatamente cinco etapas                              | pass      |
| AC-004   | sim          | etapa disponível deriva das confirmações/status persistidos e impede salto        | pass      |
| AC-005   | sim          | testes RNTL de estados e árvore assistiva                                         | pass      |
| AC-006   | sim          | StatusMessage padroniza loading, erro, aviso e sucesso                            | pass      |
| AC-007   | sim          | launcher, auth, settings, fluxo local e reader usam fundação compartilhada        | pass      |
| AC-008   | sim          | ausência de tabs, processamento, ETA ou reader local fictício                     | pass      |
| AC-009   | sim          | matriz 320×568, 390×844, 600×960 e 840×600 automatizada                           | pass      |
| AC-010   | sim          | inspeção física com tamanho dinâmico elevado preserva conteúdo e ações            | pass      |
| AC-011   | sim          | tokens de contraste e alvos mínimos por plataforma                                | pass      |
| AC-012   | sim          | testes preservam página lógica em mudança de dimensões/controles                  | pass      |
| AC-013   | sim          | paridade pt-BR, en-US e es-ES validada pelo gate i18n                             | pass      |
| AC-014   | sim          | 83 suítes e 416 testes de regressão passam                                        | pass      |
| AC-015   | sim          | typecheck, lint, FSD, formato, testes e specs passam                              | pass      |
| AC-016   | sim          | matriz física persistida na evidência nativa de MOB-FEAT-029                      | pass      |

## Gates

| Comando             | Resultado                          |
| ------------------- | ---------------------------------- |
| `pnpm typecheck`    | pass                               |
| `pnpm lint`         | pass                               |
| `pnpm lint:fsd`     | pass; zero problemas               |
| `pnpm format:check` | pass                               |
| `pnpm test:ci`      | 83 suítes, 416 testes, zero falhas |
| `pnpm specs:check`  | pass; zero drift/undocumented      |

## Mudanças fora da spec

Nenhuma. Não foram criadas rotas, tabs, banco, endpoints, processamento remoto,
OCR, tradução, renderização ou reader local.

## Conclusão

Código, evidência automatizada e auditoria física estão completos. A feature é
considerada implementada.

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
