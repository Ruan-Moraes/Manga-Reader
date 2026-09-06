# Review — MOB-FEAT-043

- Spec revisada: `spec.md`
- Implementação/revisão: working-tree sha256:9df90bc58827359dd921a48f537f3c111a755991b5615f70601e493896b0f41e
- Gate na entrada da execução: `open`
- Dependências verificadas: `MOB-FEAT-013`, `MOB-FEAT-015`, `MOB-FEAT-028`
- Verdict: `verification-pending`

## Critérios e evidências

| Critério | Evidência                                                                            | Resultado                        |
| -------- | ------------------------------------------------------------------------------------ | -------------------------------- |
| AC-001   | Grade/Lista, folha, preview e cartões preservados em RNTL                            | pass automatizado                |
| AC-002   | Pan estável de 200 ms, overlay, inserção/histerese, encaixe e callbacks UI nativos   | verification-pending físico      |
| AC-003   | Ordem otimista, persistência única, callbacks duplicados e ida/volta nativa          | pass automatizado e smoke nativo |
| AC-004   | Rollback/retry, no-op, busy, segundo dedo, interrupção, refs vazias/reutilizadas     | pass automatizado                |
| AC-005   | Ações assistivas, bloqueio de preview, overlay sem ações/semântica duplicadas        | pass automatizado                |
| AC-006   | Geometria 1/2/4 colunas, auto-scroll quadrático, janela limitada, movimento reduzido | verification-pending físico/FPS  |
| AC-007   | Config/model/ui, barrel e dependências preservados, typecheck e FSD                  | pass                             |
| AC-008   | Gates, exports Android/iOS, evidências e pendências físicas explícitas               | verification-pending             |

## Revisão da implementação

O refinamento aprovado mantém gesto e animação no runtime UI, sem render React
por destino. O reconhecedor fica na viewport e o overlay fora da FlatList;
virtualizar a célula original não remove o dono do gesto. A apresentação mantém
os IDs da sessão até terminar a animação, enquanto o controller recebe a ordem
otimista uma vez. O layout nativo precisa confirmar o destino antes de liberar
a imagem flutuante visível. Cancelamentos e callbacks antigos não salvam.

Tempos centralizados: elevação 120 ms, vizinhos 160 ms, encaixe 180 ms, todos com
`withTiming`; histerese 8 dp; auto-scroll quadrático em 56 dp, até 480 dp/s, com
aceleração 100 ms. Redução de movimento remove escala/transições decorativas.
Não foram introduzidos temporizadores para presumir o término do encaixe.

O diagnóstico nativo encontrou um novo abort em `_measure(null)` e depois a
referência não reaplicada em célula reutilizada da Lista. As duas falhas da
integração foram reproduzidas e corrigidas com regressões. A medição aguarda
wrapper nativo válido, e cada item mantém uma ref estável registrada no handoff.
Grade e Lista passaram no reteste nativo de callbacks de ida/volta, retornando a
`phase=0`, `activeIndex=-1`, `overlayReady=false` e restaurando a ordem anterior.

Clipping permanece desligado no iOS, com janela de renderização limitada e
configuração Android preservada. Banco, API, controller público, versões,
cartões, folha, preview e controles não mudaram neste refinamento.

## Verificação e limitações

- Suíte completa: 87 suítes / 495 testes aprovados; slice: 3 suítes / 51 testes.
- Exportações Hermes Android e iOS aprovadas. A tentativa adicional de export
  web falhou na resolução de WASM do expo-sqlite; não é parte do escopo nativo.
- `pnpm check`: aprovado (specs/integridade, typecheck, lint, FSD, formatação
  e 87 suítes / 495 testes). Log: `/tmp/mobile-drag-polish-pnpm-check.log`.
- Warnings de `act()` preexistentes não foram silenciados.
- Evidência detalhada: `evidence/drag-polish.md` e `evidence/ios-crash-analysis.md`.

Os callbacks isolados foram executados em Hermes/UI com layout e persistência
nativos; não substituem o reconhecedor físico. A ferramenta de arraste no
Simulator falhou com `noWindowsAvailable`; ADB não tinha dispositivo conectado.
Não se reduziu o atraso de 200 ms para produzir uma falsa aprovação.

TASK-010 e TASK-015 permanecem abertas para os 20 ciclos por modo/sistema,
virtualização real com 100 imagens, multitouch, rotação, interrupções e redução
de movimento físicos, vídeo/logs completos e comparação de frames perdidos.
O abort das 14:49:14 no dispatcher de worklets continua sem causa confirmada;
os problemas de clipping e `_measure(null)` não bastam para explicá-lo.

O verdict permanece `verification-pending`, sem reutilizar a aprovação visual
do antigo adapter. Nenhuma inspeção nativa de outra feature é reapropriada pelo
recálculo dos checksums globais. A execução anterior de testes de backend ficou
impedida por Docker indisponível; api/web não foram alterados no refinamento.

## Revisão do preview compartilhado — 2026-09-01

`MediaPreviewSheet` foi extraído para `shared/ui` sem conhecer draft, validação
ou traduções. A Ordenação mantém Grade, Lista, folha contextual, arraste e
persistência; somente o modal escuro foi substituído pela folha clara usada na
Validação. Grade e Lista preservam seus caminhos de abertura e fornecem página,
total, rótulos e callbacks por props.

O componente centraliza safe area, imagem `contain`, cache `memory-disk`,
fallback e reset por URI/visibilidade. Testes dirigidos passaram 43/43; a suíte
completa passou 511/511. Typecheck, FSD e formatação passaram. Inspeção no iPhone
17 confirmou a mesma anatomia nas páginas 1 (Grade), 2 (Lista) e 2 (Validação),
com dois fechamentos acessíveis. TASK-016 está concluída; TASK-010 e TASK-015
continuam abertas e o verdict permanece `verification-pending`.

Rebase documental de performance (2026-09-05): checksum global atualizado pela inclusão da auditoria e da MOB-DEC-007; runtime preservado por comparação SHA-256. Não representa nova verificação física nem alteração de verdict.

Rebase C01/C03/C04 (2026-09-06): checksum global atualizado após correções de numeração do leitor, persistência da validação e limite de resposta. Escopo e validações em [review de performance](../../../active/performance-evidence/corrections-2026-09-06/review.md). Não representa nova verificação física das demais features.

Rebase C02/C05 (2026-09-06): checksum global atualizado após virtualização do leitor e download de exportação para arquivo. [Escopo e validação](../../../active/performance-evidence/corrections-c02-c05-2026-09-06/review.md). Não representa nova verificação física das demais features.

Consolidação documental (2026-09-06): checksum global atualizado após reconciliar o estado de performance; runtime e verdict preservados. [Registro](../../../active/performance-evidence/consolidation-2026-09-06/review.md). Sem nova validação física.

Preparação de commit (2026-09-06): rebase global após excluir scripts avulsos de ensaio, listagens Git e metadados do sistema dos arquivos versionados, conforme solicitação humana. Resultados históricos preservados; runtime e verdict inalterados.
