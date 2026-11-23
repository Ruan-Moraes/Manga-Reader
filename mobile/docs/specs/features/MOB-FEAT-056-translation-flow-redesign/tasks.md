# Tasks — MOB-FEAT-056

- Spec: `spec.md` (com a revisão D3, opção A nas quatro linhas)
- Status da spec no planejamento: `approved`
- Gate no planejamento: `open`
- Dependências: MOB-FEAT-055 (`verification-pending`)

## Rastreabilidade

| Critério | Tasks              | Evidência planejada                                                                         |
| -------- | ------------------ | ------------------------------------------------------------------------------------------- |
| AC-001   | TASK-003, TASK-008 | modelo de etapas e teste da página com 3 etapas                                             |
| AC-002   | TASK-003           | confirmações gravadas só pela ação de cada etapa                                            |
| AC-003   | TASK-008           | validação automática depois dos idiomas, inválida e retry                                   |
| AC-004   | TASK-001, TASK-002 | slot de ação primária, rodapé fixo e barra "Etapa N de 3"                                   |
| AC-005   | TASK-008           | voltar/avançar, Home e saída em processamento                                               |
| AC-006   | TASK-006           | consentimento antes de qualquer chamada                                                     |
| AC-007   | TASK-009           | selos de estado, selecionar todas/nenhuma e progresso agregado                              |
| AC-008   | TASK-010, TASK-012 | chaves nos três locales; capturas pendentes                                                 |
| AC-009   | TASK-008           | demonstração só com `__DEV__`                                                               |
| AC-010   | TASK-011, TASK-013 | testes ajustados, gates, `coverage.json`                                                    |
| AC-011   | TASK-006           | folha "Antes de enviar", "Ver detalhes", recusa                                             |
| AC-012   | TASK-007           | cartão "Salvar em", folha de obras, bloqueio e falha de vínculo                             |
| AC-013   | TASK-005           | seletores "De/Para", idioma do outro lado desabilitado, trocar                              |
| AC-014   | TASK-014           | OfflineTranslationPage.test.tsx e LocalMediaReviewPanel.test.tsx; validação Android física. |

## Checklist

- [x] TASK-001 — Criar em `src/shared/ui` o slot de ação primária (`ActionSlotProvider`, `ActionSlotOutlet`, `PrimaryAction`): fora de um provedor o botão fica no lugar; dentro, vai para o rodapé fixo; testes.
- [x] TASK-002 — Criar `StepBar` em `src/shared/ui` (3 segmentos, "Etapa N de 3: nome", `progressbar` acessível); testes.
- [x] TASK-003 — Mapear as 5 subetapas internas em 3 etapas visíveis (Páginas, Idiomas, Traduzir) em `pages/offline-translation/model/translationFlow.ts`, mantendo as confirmações; testes.
- [x] TASK-004 — Envolver em `PrimaryAction` os botões principais dos painéis de importar, organizar, idiomas, validar, preparar e lote, sem mudar a lógica deles.
- [x] TASK-005 — Idiomas "De/Para": opção usada no outro lado desabilitada com motivo (`SelectField` ganha `optionDisabled`) e botão "Trocar origem e destino".
- [x] TASK-006 — Consentimento em camadas: folha "Antes de enviar" com três itens, "Ver detalhes" com o texto completo atual e recusa sem envio.
- [x] TASK-007 — Cartão "Salvar em" na etapa Traduzir com folha de obras da 055 e "Sem obra", bloqueado durante o processamento; falha de vínculo com "Tentar vincular de novo".
- [x] TASK-008 — Página: cabeçalho único (sem eyebrow nem título display), `StepBar`, rodapé fixo, validação automática depois de confirmar idiomas, resumo, link "Retomar último capítulo", demonstração só em `__DEV__` na etapa final, voltar/Home preservados.
- [x] TASK-009 — Lote: selecionar todas/nenhuma, progresso agregado no topo e `StatusChip` por página (aguardando, processando, salva, falhou, incerta).
- [x] TASK-010 — Chaves novas nos três idiomas.
- [x] TASK-011 — Ajustar os testes que codificavam as cinco etapas, o diálogo de consentimento e os botões inline, mantendo verdes os de 012–017, 043–045 e 055.
- [ ] TASK-012 — Capturas no iOS Simulator (claro, escuro, fonte ampliada, 320 pt) e Android físico (fica aberta se não for executada).
- [x] TASK-013 — Mapear arquivos no `coverage.json`, rodar gates e registrar review e drift.

`implemented` exige todos os checkboxes concluídos. Quando o código estiver pronto, mas uma verificação real ainda estiver aberta, usar `verification-pending` e manter a task correspondente desmarcada.

## Riscos e bloqueios

- A validação (015) exige idiomas confirmados; por isso ela roda automaticamente na etapa Idiomas, logo depois da confirmação dos idiomas, e não depois da ordem.
- Os painéis das features são reutilizados; só o lugar do botão principal muda.

- [ ] TASK-014 — Resumo, rodapé e destino da tradução. Código e regressões preparados. Validar em Android físico.
