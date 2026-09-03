# Review — MOB-FEAT-044

- Spec revisada: `spec.md`
- Implementação/revisão: working-tree sha256:38172ac139f24be05ddf591a77830ea02b9586b8729bba5be6c131da60bffe58
- Gate na entrada: `open`
- Dependências: 014/042 implemented; 028 verification-pending.
- Verdict: `verification-pending`

## Critérios e evidências

| Critério | Evidência                                                               | Resultado               |
| -------- | ----------------------------------------------------------------------- | ----------------------- |
| AC-001   | Variante e painel em RNTL; ios-fields.png                               | pass                    |
| AC-002   | RNTL sete opções, cancelar/reabrir; ios-target-sheet.png                | pass                    |
| AC-003   | Regressões busy, invalidação, confirmação e retry; ios-invalid-pair.png | pass                    |
| AC-004   | Locales, temas, movimento e foco em RNTL; smoke iOS                     | matriz nativa pendente  |
| AC-005   | Gates executados, coverage e evidências registradas                     | gate histórico pendente |

## Revisão

Contrato e controller de idiomas não foram modificados. Alterações válidas
continuam no hook existente; campos usam os códigos canônicos e callbacks
independentes. Mesmos idiomas continuam disponíveis para apresentar a validação
explícita existente. PT-BR aparece primeiro apenas na lista de destino.

SelectField mantém o default; input aplica estilos em View para corrigir o
problema de renderização observado no iOS/NativeWind. Foco nativo recebe ref
válida ao mostrar/fechar a folha; web usa focus e Android agenda retorno após
fechamento. Não se introduziu teclado, biblioteca ou persistência.

Os testes da variante default continuam na suíte. Não há finding de código
aberto nesta revisão; validação assistiva real e matriz nativa permanecem
abertas em TASK-004. Revisão realizada pelo implementador, sem auditor externo.

## Gates e limites

87 suítes / 501 testes aprovados; typecheck, lint e FSD aprovados. O gate SDD
global já tinha 20 reviews com checksum divergente antes da alteração. Elas
não foram reapropriadas nem tiveram seus veredictos renovados por esta review.

`pnpm format:check` passou no mobile completo. `pnpm check` para no specs:check
histórico; os 23 testes dos validadores passaram e os gates restantes foram
executados separadamente. Web `npx tsc -b` passou. Backend `./mvnw test` falhou
por ambiente, incluindo Docker indisponível. Código api/web não foi alterado.

Status verification-pending por Android/VoiceOver/TalkBack/matriz visual nativa
pendentes e gate global histórico. Nenhuma mudança fora da spec implementada.
