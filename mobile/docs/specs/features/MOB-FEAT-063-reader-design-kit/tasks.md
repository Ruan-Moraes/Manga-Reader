# Tasks — MOB-FEAT-063

- Spec: `spec.md`
- Status da spec no planejamento: `approved`
- Gate no planejamento: `open`
- Dependências: MOB-FEAT-055, MOB-FEAT-057 e MOB-FEAT-062 (`verification-pending`)

## Rastreabilidade

| Critério | Tasks              | Evidência planejada                                                     |
| -------- | ------------------ | ----------------------------------------------------------------------- |
| AC-001   | TASK-003, TASK-007 | RNTL da barra superior por tipo de leitor                               |
| AC-002   | TASK-003, TASK-007 | RNTL da folha de capítulos e troca de capítulo                          |
| AC-003   | TASK-004           | RNTL da barra inferior, `progressbar`, vizinhos e alternador            |
| AC-004   | TASK-005           | RNTL do fim de capítulo com e sem próximo                               |
| AC-005   | TASK-006           | RNTL dos estados bloqueantes e do retry pela 055                        |
| AC-006   | TASK-001, TASK-002 | RNTL da folha única, fechar, voltar Android e rodapé                    |
| AC-007   | TASK-009           | suítes de 005/051/052/053/055 verdes, ajustadas só onde D2 muda a 054   |
| AC-008   | TASK-008, TASK-010 | chaves nos três locales, RTL e redução de movimento; capturas pendentes |
| AC-009   | TASK-011           | gates, `coverage.json`, review                                          |
| AC-010   | TASK-012           | PageRetryIndicator.test.tsx; validação Android física.                  |

## Checklist

- [x] TASK-001 — Em `features/configure-chapter-reader`, criar a categoria `quick` do `ReaderSettingsControls` (modo, direção, ajuste com Original, fundo, saturação e espaçamento só no fluxo vertical; sem qualidade, pré-carregamento nem marcação), sem mudar as categorias existentes; testes.
- [x] TASK-002 — Em `ReaderPanel`, modo folha única com título, descrição, fechar e rodapé "Todos os ajustes do leitor"; manter as abas para o leitor de texto (053); `ContentReader` ganha `settingsSheet`.
- [x] TASK-003 — Barra superior: voltar, capítulo e obra com elipse, "Ajustes do leitor" (`options-outline`) e "Lista de capítulos" com folha e capítulo atual marcado (prop `chapters`).
- [x] TASK-004 — Barra inferior: progresso "p / T", setas de página no modo paginado, capítulo anterior/próximo e alternador "Traduzido / Original" (só com resultado traduzido), tirando o botão de comparação da aba Aparência.
- [x] TASK-005 — Fim do capítulo no fluxo vertical (rodapé da lista): "Ler próximo capítulo" ou "Voltar para a obra"/"Voltar".
- [x] TASK-006 — Estados bloqueantes do modo traduzido ("Tradução em andamento", "Não foi possível traduzir") com "Ler original" e "Tentar de novo" pelo painel de lote da 055.
- [x] TASK-007 — Integrar nas páginas: leitor local (contexto da obra, capítulos, vizinhos, fim, folha única, retry) e leitor da plataforma (folha única, sem controles de obra).
- [x] TASK-008 — Chaves novas no namespace `reader` nos três idiomas.
- [x] TASK-009 — Atualizar os testes que codificavam as abas do leitor de imagens (054/AC-001/002, alterados pela D2) e manter verdes os de 005, 051, 052, 053 e 055.
      Execução: `LocalTranslationReaderPage.test.tsx` (aba Aparência e botão "Ver original" → folha única e alternador) e `ReaderPage.test.tsx` (texto "Página p de T" → rótulo acessível, já que o texto visível virou "p / T").
- [ ] TASK-010 — Verificar fonte ampliada, RTL, redução de movimento, claro/escuro com capturas no iOS Simulator e Android físico (fica aberta se não for executada).
- [x] TASK-011 — Mapear arquivos no `coverage.json`, rodar gates e registrar review e drift.

`implemented` exige todos os checkboxes concluídos. Quando o código estiver pronto, mas uma verificação real ainda estiver aberta, usar `verification-pending` e manter a task correspondente desmarcada.

## Riscos e bloqueios

- `ContentReader` é compartilhado por três leitores; os controles de obra só aparecem quando a página informa os capítulos.
- A troca das abas pela folha única muda testes da 054; a review registra cada um.

- [ ] TASK-012 — Primeira tradução e retry no leitor. Código e regressões preparados. Validar em Android físico.
