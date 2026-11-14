# Ligação do executor restrito ao v4 — 2026-10-18

Continuação do [preparo local](worker-isolation-v4-preparation-2026-10-18.md).
A 020 permanece `in-progress/open`, a 021 bloqueada. A ligação ao executor não
é aprovação de montagem, worker completo, distribuição ou qualidade visual.

## Implementação desta revisão

O executor privado em `.local/worker-isolation/mount-v4-execute.LbHOzG/`
usa exclusivamente o runtime v4 já auditado. A revisão anterior permanece
selada, assim como seus recibos de preparo e as duas tentativas nativas antigas.
Nenhum lock histórico foi removido, nenhum contexto legado foi convertido e
nenhuma reserva anterior foi renovada ou reembolsada.

A skill `database-design` orientou o plano anterior ao código. Não há alteração
SQL, migration, FK, índice ou estado do produto. O ledger local aprovado
mantém centavos USD inteiros; runId e hash do plano vinculam reserva e recibos.
Arquivos exclusivos/fsync e validação de owner, mode e caminho são conservados.

`prepare` continua local e sem autoridade de execução. `execute` exige seu
próprio recibo offline e revalida os artefatos de preparo, runtime, política
de disco, retirada anterior e snapshot técnico. Não aceita flags, diretórios,
projeto ou tickets arbitrários, e não implementa `resume`.

Antes da reserva nova:

1. conferir cobertura financeira por 16 minutos e compilar o CAS com Java já instalado;
2. conferir projeto, ausência de startup herdado, imagem COS fixada e máquina;
3. conferir as 11 referências antigas por GET, com identidade existente e prazo de 60 segundos;
4. criar plano exclusivo e conferir novamente preços/billing para os 15 minutos de execução/cleanup;
5. exigir ausência ainda fresca no instante atual, não apenas na data de preparação do plano.

A leitura de ausência só admite identidade e hashes dos GETs exatos. Não concede
POST/DELETE, adoção de recurso, retry ou nova reserva. Qualquer 200, 403, erro,
timeout, cancelamento ou corpo ainda pendente impede o avanço. Os corpos e o
scope nativo terminam antes de devolver a prova pontual; ela não equivale a
um novo recibo terminal das operações antigas.

A reserva continua fixa em USD 5, dentro dos USD 100 totais autorizados. Criação
fica limitada a 12 minutos, cleanup a 15. Falha ambígua conserva lock e reserva;
não se repete mutação para obter uma resposta. O arquivo de runtime reutilizável
não é extraído, reempacotado ou removido nesta revisão.

## Revisão técnica do escopo

O bundle continua limitado à prova `mount-content-only`: VM e2-micro de 1 GiB,
sem conta de serviço, IP externo, NAT ou Private Google Access. Rede dedicada,
firewalls deny-all e retirada da rota padrão precedem a VM. O disco de dados
é anexado `READ_ONLY` e montado `ro,noload,noexec,nosuid,nodev`; o boot tem
autoDelete e a VM tem ação DELETE após 600 segundos, sem reinício automático.
Identidade, labels, origem e IDs observados continuam necessários.

O coordinator mascara Docker/socket/containerd antes das verificações de
conteúdo. Isso **não prova** que o daemon nunca iniciou durante o boot, nem
resolve a pendência de segurança COS/Docker para o worker completo. Nenhum
JRE, renderer, codec ou provider executa nesta prova. Os checks nativos e
systemd reais no COS continuam sendo observações a obter, não aprovação por
testes Ubuntu ou por mensagens seriais isoladas.

## Verificação

Os 18 testes focais de ausência e operador passaram. A regressão de relógio
reproduziu aceitação indevida de uma ausência envelhecida enquanto o plano
era preparado; a correção exige o instante atual imediatamente antes da
reserva. Esse resultado focal não substitui a consolidação.

A primeira bateria consolidada terminou com **121/122**, uma falha, sem
cancelamentos/skips. O caso `native admission + supervisor await all RUNNING
without duplicate DELETE` retornou `supervisor-failed-and-retired`, não a
prova simulada esperada. Houve ausência ativa confirmada, nenhum recurso falso
remanescente e nenhum DELETE duplicado observado, mas isso não satisfaz o
cenário completo. A execução não produziu recibo de admissão offline.

O caso levou aproximadamente 250 segundos; o cenário `PENDING` correspondente
levou 26 segundos. Essa diferença sugere investigar timing/ambiente, mas **não
comprova causa ambiental**, suspensão do Mac ou ausência de bug funcional.
Foi iniciada reprodução focal sem alterar runtime, fixtures, limites ou
assertions. Um eventual green focal não substituirá nova consolidação integral.

TAP preservado: `failed-c864829e.tap`, SHA-256
`4dd7b8712b66c962d4a732b53e8d2edfdcebbec27ee87eefc2a21fd4ef311a4e`.
Nova conferência local em 19/10 confirmou os recibos e o snapshot dos 419
caminhos inalterados. Nenhuma credencial real, rede Google ou nova reserva
foi usada nesta revisão. Admissão nativa continua bloqueada por esse gate.

### Revalidação posterior — 2026-10-19

A reprodução focal passou, sem alteração de código/fixture/limite, em cerca
de 27 segundos. Depois, a mesma bateria integral passou **122/122**, zero
falhas, cancelamentos, skips ou casos `todo`. Isso não demonstra a causa da falha
anterior nem elimina o finding de timing; ambos os TAPs foram preservados.

| Evidência privada                           | SHA-256                                                            |
| ------------------------------------------- | ------------------------------------------------------------------ |
| Reprodução focal, uma prova selecionada     | `814df466bc0e41170c760ae3a330a26cd5d0d97de010ca4ff401db9cf9a229ca` |
| Recibo integral `offline-verification.json` | `fc20dc32a45e7e793c571c06a32a67001229d0c662648b5a3786b732bb863597` |
| TAP integral `tests-9f5c9064.tap`           | `dd9062b548f43107d254a920d86d38bb019b893e26d61247e696d06baa9d237a` |

O recibo vincula seis fontes/documentos desta revisão, o preparo anterior,
runtime v4 e snapshot técnico inalterado. A bateria não usou identidade
real, Google ou nova reserva. O comando é
`node .local/worker-isolation/mount-v4-execute.LbHOzG/verify.mjs`.
Ele não sobrescreve o recibo existente; nova revisão exige novos artefatos.

A revisão técnica posterior admite somente a prova restrita de montagem,
sob as condições acima, não o worker completo. Seu registro privado
`scope-review.json` tem SHA-256
`267e38a8ddf5f394608ddcd3873595fbb8a65ec442dd884497fe0f159edd5a40`.
Nenhuma conclusão de qualidade/segurança integral decorre desse recibo.
