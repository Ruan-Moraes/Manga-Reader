# Drift audit — MOB-FEAT-017, revisão volátil

- Data: 2026-11-02.
- Implementação auditada: working-tree sha256:751f485409b07f18d689b9d6ab37b2b133be8503c09c2e2ca570a8c5ac7bf1d3
- Status: `verification-pending`; gate: `open`.
- Verdict: `verification-pending`.
- Escopo: ponte 017 e suas dependências/contratos correntes; não é auditoria de toda a operação pública.

## Divergências e verificações

| Item                                                           | Classificação                                   | Evidência / ação                                                                       |
| -------------------------------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------- |
| Intenção antiga de persistência remota                         | spec divergente resolvida pela aprovação humana | DEC-008 e specs 017–021 substituídas; evidências antigas identificadas como históricas |
| Identidade sem owner correto e concorrência                    | código divergente corrigido                     | R01/R03 reproduzidos; sete regressões de identidade e revisão independente verde       |
| Recibo conhecido descartado                                    | código divergente corrigido                     | R02, schema aditivo v10 planejado antes do código; SQLite/controller/widget trilíngue  |
| Transporte/provider/proxy físico não executado no alvo público | verificação real aberta                         | TASK-014/017; não configura aprovação operacional                                      |
| Políticas publicadas e acessibilidade física                   | verificação real aberta                         | TASK-015/016; fontes e RNTL não substituem prova real                                  |
| Consumidor de resposta direta 021 ausente                      | fora do escopo 017 e gate próprio preservado    | widget impede versão 2.0 de entrar no consumidor antigo; 021 permanece bloqueada       |

No escopo técnico 017 após a revisão independente: `mismatch=0`,
`undocumented=0`, arquivos runtime descobertos `0`. O gate geral confirmou
975 arquivos classificados, 373 behavior e 270 evidence; não houve alteração
runtime após ele, somente o registro explícito de estado/tarefas desta revisão.
Esses contadores não afirmam que todas as features ou a implantação estejam prontas.

A matriz por AC e as provas estão no [review](review.md) e
[registro de correções](evidence/volatile-fixes-and-local-validation-2026-11-02.md).
Próximo passo: checksum/gate documental desta árvore e abertura sequencial da
018 quando o validador confirmar a dependência. Não existe tasks ativo em
feature ainda bloqueada nesta fotografia. Nenhuma pendência física foi fechada.

## Ajuste de relógio — 2026-11-04

A resposta do gateway em Android apresentou avanço de 200 ms e foi rejeitada.
O cliente tolera até cinco segundos na geração sem estender a expiração; a ação
fica oculta quando a capability é inutilizável. Regressões passaram e o APK
corrigido abriu o consentimento no emulador. O envio e o ciclo físico seguem
pendentes. Registro operacional: [teste Android](../../../../../api/apps/translation-gateway/docs/private-android-test-2026-11-04.md).
