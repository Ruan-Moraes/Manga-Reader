# Review — MOB-FEAT-019, tradução contextual volátil

- Spec revisada: `spec.md`, direção humana de 2026-11-01.
- Implementação/revisão: working-tree sha256:751f485409b07f18d689b9d6ab37b2b133be8503c09c2e2ca570a8c5ac7bf1d3
- Gate corrente: `open`; 018 estava `verification-pending` antes do plano.
- Verdict: `verification-pending`.
- Revisão independente: /root/volatile_specs, 2026-11-02.

## Findings

A janela entre preparação/resolução e início do próximo provider foi corrigida.
Cinco regressões falharam antes e passaram após a correção; o reviewer confirmou
que os checks estão imediatamente antes de OCR/Translate/render. Três cenários
com supervisão e use case reais cobrem bloqueio que ignora interrupção, deadline,
capacidade retida até limpeza e ausência de etapa tardia. Nenhuma outra lacuna
técnica foi identificada na conferência independente dos seis ACs.

## Critérios

| Critério | Implementação/evidência atual                                                                                                            | Resultado / verificação aberta                       |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| AC-001   | Matriz42, whitelist capability/config, modelo/global explícitos, testes factory/pairs                                                    | pass técnico; admissão TASK-007                      |
| AC-002   | Envelope único contextual, IDs/ordem e gRPC privado; codec/validator                                                                     | pass técnico; coerência/naturalidade humana TASK-006 |
| AC-003   | Hans/Hant distintos no request, manifesto, fixtures e nove destinos visuais                                                              | pass técnico; benchmark humano TASK-006              |
| AC-004   | IDs/payload/textos hostis recusados integralmente antes do render                                                                        | pass técnico                                         |
| AC-005   | vazio sem Translate; falhas sanitizadas, fences red/green e três deadlines reais                                                         | pass técnico; ambiente admitido TASK-007             |
| AC-006   | 30000 codepoints completos, 30001/HTML expandido recusados, Unicode suplementar; SDK sem retry; replay409, logs/SQL/scratch sem conteúdo | pass técnico; políticas/proxy/APM/admissão TASK-007  |

## Gates e limites

- Raiz `./mvnw -o test`: exit0,2859testes,0falhas/erros,115skips;468XML atuais.
- Focados use case/SDK/codec/validator/supervisão: exit0; red anterior preservado.
- Candidata5: HTTP privado8OCR/7Translate, matriz8/22, visual9/9; sem conteúdo
  em arquivos/SQL/logs, sem OOM e pids.events=max0. Não herda aceite da c4.
- Mobile runtime não foi alterado nesta etapa; gate completo anterior987testes.
- Após fechamento documental: rebase de headers e `pnpm specs:check`.
- [Evidência atual](evidence/volatile-contextual-verification-2026-11-02.md).

Código técnico executado; TASK-006/007 são verificações reais abertas, incluindo
qualidade humana e operação/políticas. Não é `implemented` nem aprovação pública.
A aquisição 021 continua ausente na revisão corrente; a abertura sequencial só
pode ocorrer após validar este fechamento documental, conforme DEC-008.
