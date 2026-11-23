# Review — MOB-FEAT-018, OCR inline volátil

- Spec revisada: `spec.md`, direção humana de 2026-11-01.
- Implementação/revisão: working-tree sha256:751f485409b07f18d689b9d6ab37b2b133be8503c09c2e2ca570a8c5ac7bf1d3
- Gate corrente: `open`; dependência 017 `verification-pending` antes do plano/código mobile.
- Verdict: `verification-pending`.
- Revisão independente read-only: /root/volatile_specs, 2026-11-02.

## Findings e limite

O reviewer encontrou uma lacuna de teste: timeout/erro embutido/resposta excedente
usavam o adapter histórico. A correção migrou esses cenários ao adapter inline
produtivo e passou. A conferência final independente dos seis ACs não identificou
runtime faltante. Adapter GCS/wiring/porta antiga estão somente em suporte de
teste e não no JAR. Nenhuma aprovação de provider real ou produção decorre disso.

## Critérios e evidências

| Critério | Código técnico conferido                                                                     | Evidência atual                                                                   | Resultado / verificação aberta                                                                |
| -------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| AC-001   | Sete hints explícitos, online regional us, bytes inline; sem URI/fallback produtivo          | VisionOcrAdapterTest, configuração/guard e HTTP c4                                | pass técnico; configuração/provider no alvo: TASK-006                                         |
| AC-002   | Context sem objectKey; IDs por operação/posição, ordem contígua, texto/vértices normalizados | VisionResponseMapperTest, diff algorítmico e associação do use case               | pass técnico; referências de qualidade: TASK-005                                              |
| AC-003   | Horizontal/vertical e sete códigos em fixtures, sem ordenação geométrica nova                | mapper/hints atuais e revisão independente                                        | verification-pending: benchmark/revisão humana, sobretudo japonês vertical e >75 MP, TASK-005 |
| AC-004   | Vazio válido, sem tradução desnecessária; texto sem regiões utilizáveis falha                | mapper/use case e visual c4, nove OCR/oito traduções                              | pass técnico; amostra real sem texto: TASK-005                                                |
| AC-005   | Payload/limites/geometria/timeout/interrupção sanitizados; sem retry ou fase tardia          | testes inline atuais, use case/supervisão; recuperação HTTP após falha OCR/nativa | pass técnico; comportamento/ambiente admitido: TASK-006                                       |
| AC-006   | Conteúdo em memória; sem URI/gravação/logs; recibo/replay pela reserva 017                   | guard/JAR, HTTP c4, scratch vazio, logs/pids e raiz backend                       | pass técnico; políticas/proxy/APM/swap/dumps/admissão: TASK-006                               |

## Gates e proveniência

- Gateway package: exit 0, 1435 testes, zero falhas/erros, 114 skips no marco do pacote.
- Falhas inline migradas: exit 0 em `/private/tmp/toonlira-volatile-ocr-inline-faults-20261102-1.log`.
- Raiz backend final: exit 0, 2848 testes, zero falhas/erros, 115 skips; 467 XMLs
  reescritos na rodada, nenhum relatório antigo agregado.
- Candidata 4: HTTP privado com cinco OCR/quatro traduções, zero conteúdo,
  pids.events=max0, pico1929252864; matriz8/22 semOOM; visual9/9 no cliente.
- [Evidência atual](evidence/volatile-inline-verification-2026-11-02.md) vincula
  imagem/JAR/recibos. Artefatos anteriores só orientam algoritmo e fixtures.
- Após este fechamento documental: rebase de headers e `pnpm specs:check`.

## Conclusão limitada

Código/testes técnicos estão executados. TASK-005/006 são verificações reais
abertas; `verification-pending` é a prontidão indicada pela revisão independente
após o gate técnico atual. Não é `implemented`, aprovação operacional, benchmark
com referência humana ou implementação 021. A abertura sequencial da 019 deve
ocorrer somente após validar esta governança, conforme a autorização DEC-008.
