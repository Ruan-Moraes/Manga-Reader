# Produtor de staging e transferência exclusiva — 2026-10-17

Parcela local do [plano de ligação](worker-isolation-staging-handoff-plan-2026-10-17.md),
posterior à [reconciliação dos leitores v2](worker-isolation-schema-reconciliation-2026-10-17.md).
Código em `.local/worker-isolation/mount-staging.R9I651/`, ignorado pelo Git.
Não é alteração do runtime Java ou ativação da infraestrutura. A 020 permanece
aberta; a 021 não foi liberada. A verificação controlada desta parcela passou;
a falha da execução com paralelismo padrão continua aberta. Ambos os resultados
estão preservados, sem reescrever recibos antigos.

## O que foi implementado

| Componente        | Responsabilidade e limite                                                                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `archive.mjs`     | Ler o archive de runtime existente por handle, conferir SHA-256/MD5/tamanho e identidade do arquivo; corpo único em blocos limitados. Sem cópia, extração ou download.   |
| `producer.mjs`    | Criar bucket exclusivo e objeto create-only, conferir proteção/IAM, ler a geração exata e registrar fonte verificada. Sem retry, ADC ou fetch implícito.                 |
| `handoff.mjs`     | Reconstruir bundle a partir da fonte do journal, conferir vínculos, obter admissão e registrar transferência exclusiva antes de entrar no ciclo HTTP v2.                 |
| Fixtures e testes | HTTP, identidade, permissões, gerações, operações Compute e saída serial sintéticos; archive físico e locks/CAS Java reais. Não executam COS, renderer, OCR ou tradução. |

O archive fixado tem 62.359.506 bytes e SHA-256
`f8b8009f1684e29050a5472c2dc3077e6177ef322c667000e532c8bc2dd6135c`.
O adapter operacional não recebe caminho/hash/URL alternativos. O conjunto de
imagens de mangá não é acessado nem alterado. A leitura usa blocos de 64 KiB;
o arquivo reutilizável não é copiado para cada rodada.

`admit`, credencial, transporte, clock, sinal e journal são dependências explícitas.
Sem admissão não se abre o archive, obtém token ou consulta Google. Nenhum comando
de teste inicializa ADC ou usa o fetch global. A admissão sintética dos testes
não serve para uma execução real, nem substitui verificação de custo/permissões.

## Ordem e integridade

1. Validar plano canônico e arquivo físico, sem seguir symlink ou aceitar hardlink.
2. Conferir ausência do nome e confirmar intenção durável antes do POST do bucket.
3. Conferir projeto, região São Paulo, Standard, PAP/UBLA, política privada e
   permissões no próprio bucket. Não criar grants nem mudar configuração existente.
4. Confirmar ausência do objeto e intenção antes do único upload multipart, com
   `ifGenerationMatch=0`, MD5 e hash/tamanho fixados.
5. Ler metadata e conteúdo com geração/precondição exatas; conferir SHA-256 e
   tamanho. Revalidar objeto, bucket, arquivo e IAM antes de registrar a fonte.
   Drift de IAM é detectado mesmo se a metageneration do bucket não mudar.
6. Reconstruir bundle com as gerações observadas, conferir journals de Compute e
   retirada, admissão recente e janela. Claim exclusivo de handoff antes de Compute.
7. Executar o ciclo v2 existente, preservando admissão de cada criação, isolamento
   de rede, retirada da rota antes da VM e retirada final dos recursos próprios.

Há somente uma intenção por efeito. Timeout ou perda de confirmação, inclusive
após commit local, não autoriza repetir POST/upload/handoff. Reabrir um journal
não retoma a execução. Recuperação exige análise explícita do estado; o produtor
não apaga um bucket potencialmente criado e o handoff não tenta compensar um
ciclo de estado ambíguo fora do protocolo de retirada existente.

Cancelamento/timeout impede chamadas tardias. Uma dependência que ignore abort
mantém a capacidade ocupada até terminar; handles e corpos HTTP são encerrados,
inclusive respostas que chegam depois do prazo. Falha de fechamento do archive
fica visível no estado do produtor. Erros são sanitizados, sem token, identidade
IAM, caminho privado ou corpo bruto de provider no resultado.

O store durável permanece o CAS/lock/fsync Java anterior. Não há migration, SQL,
índice, contador ou dado de negócio novo. O plano de modelagem e a exceção de
arquivo privado limitado estão no documento anterior, conforme `database-design`.

Conferência pública do contrato, sem credenciais: o recurso
[Buckets](https://docs.cloud.google.com/storage/docs/json_api/v1/buckets)
documenta `generation`, `metageneration` e `timeCreated`; portanto, essas
observações não foram inventadas para as fixtures. O mesmo contrato distingue
soft delete de remoção permanente: ausência ativa não significa fim imediato
da retenção/cobrança. A referência de
[Images](https://docs.cloud.google.com/compute/docs/reference/rest/v1/images)
documenta URLs GCS para `rawDisk.source`, mas não resolve, nos formatos listados,
o binding de uma geração GCS específica. Não foi inventado seletor ou trocado
o contrato para outro serviço; essa verificação continua aberta.

## Evidências e reprodução local

Executados durante desenvolvimento: testes de arquivo e produtor (24 casos na
primeira rodada), depois 21 testes do produtor após acrescentar confirmação de
upload/commit perdida e competição; 10 testes de transferência com journals
duráveis. Não somar rodadas sobrepostas como testes distintos.

Os seis defeitos reproduzidos antes da correção incluíam fechamento de handle,
IAM explicitamente nulo, drift de IAM, espera de arquivo e journal cancelada e
descarte de resposta HTTP tardia. Todos passaram na rodada dirigida posterior.
Os testes de transferência começaram recusando a ausência do módulo e passaram
após sua implementação; não constituem evidência de uma execução GCP anterior.

Uma regressão adicional comprovou que um journal Compute sem o método de claim
ainda permitia registrar o handoff antes de o ciclo recusá-lo. O teste falhou e
passou após exigir todas as operações dos journals antes da transferência;
também se exige sinal de cleanup independente do cancelamento principal.

```bash
node --test .local/worker-isolation/mount-staging.R9I651/archive.test.mjs \
  .local/worker-isolation/mount-staging.R9I651/producer.test.mjs \
  .local/worker-isolation/mount-staging.R9I651/handoff.test.mjs
```

O ensaio completo parte de ausência sintética do bucket/objeto e passa pelo
produtor real de tooling, archive real, journal durável e ciclo HTTP v2. Confere
dois POSTs de staging, oito POSTs Compute e onze DELETEs simulados, com ausência
ativa dos recursos próprios no estado falso. A saída serial de sucesso é
sintética: isso não prova boot, mount ou execução do worker em COS.

Concorrência entre journals abertos separadamente produz apenas um vencedor;
confirmação perdida/cancelamento após handoff não inicia Compute. Handoff não
substitui admissão de Compute: uma negação posterior continua impedindo criação.
Não há remoção ampla de bucket ou recurso alheio para fazer testes passarem.

O verificador integral usa TAP/recibo exclusivos (`transport-tests.tap` e
`verification-transport.json`), recusando sobrescrita. Os recibos do journal e
da suíte anterior permanecem fotografias históricas. Também reconfere fontes,
configuração pinada, evidências anteriores e as duas reservas do ledger.

### Tentativa integral com paralelismo padrão

`verify-transport.mjs` terminou com exit 1: 718 testes em 58 arquivos, 717
aprovados e uma falha, sem cancelamentos/skips/TODOs, em 365.151 ms. O caso
antigo `concurrent claims publish a single permission to send`, em
`mount-crash.KC1VeM/journal.test.mjs`, lançou `mount-crash-unconfirmed` num dos
seis claims concorrentes. Não foi atribuída causa conclusiva nem alterado o
helper/journal histórico. É falha real do gate, não evidência de sucesso.

TAP preservado em
`mount-staging.R9I651/transport-tests-failed-1792253997211.tap`. Não houve recibo
de sucesso. Essa tentativa antecede o último reforço de contrato do handoff;
não será usada como cobertura dos fontes finais. A repetição com
`--bounded-parallelism` executa todos os mesmos casos, limitando a quatro
arquivos simultâneos, sem aumentar timeout, excluir caso ou repetir internamente
uma operação que falhou. Uma execução verde assim não encerra o finding de
instabilidade no paralelismo padrão. Os artefatos dessa repetição são separados:
`transport-bounded-tests.tap` e `verification-transport-bounded.json`.

## O que ainda não está validado

- Criação/upload/readback/importação reais deste produtor; nenhum recurso ou
  objeto foi criado nesta parcela.
- Seleção da geração pelo `rawDisk.source` de Compute: conferir a geração no
  readback GCS não prova o seletor consumido pela importação. O flag permanece falso.
- Acesso à imagem pública COS: o teste IAM anterior vazio continua inconclusivo;
  permissões de Storage no recurso correto ainda dependem da admissão operacional.
- Prova nativa no COS pinado, seus findings de segurança e isolamento do renderer
  completo. Um ensaio de mount com VM pequena não admite o worker de 8 GiB.
- Envelope completo de custo/recuperação e confirmação de cobrança. O limite
  autorizado continua US$ 5 total; reservas locais não são cobrança, crédito ou teto.
- Comando operacional admitido e recuperação assistida de staging parcial antes
  do handoff. Os componentes não são um convite a preencher admissão com `true`.

Sem credenciais, rede Google, instalações, imagens novas, OCR, tradução ou reservas
nesta parcela. Maven/web/mobile/SDD não foram reexecutados nem redatados; o código
runtime permanece na fotografia técnica anterior. Auditoria de performance e
alterações externas são preservadas.

## Fechamento controlado — 16:27:28 UTC

`verify-transport.mjs --bounded-parallelism` terminou com exit 0: **718 testes
em 58 arquivos**, zero falhas, cancelamentos, skips ou TODOs; duração
445.737 ms. O paralelismo entre arquivos foi quatro; os casos internos de
concorrência real do journal permaneceram intactos. Não houve teste excluído,
timeout aumentado, instalação ou retry cloud para obter o resultado.

Recibo privado exclusivo `mount-staging.R9I651/verification-transport-bounded.json`:
`f04c5b1895eb30e6a0315045718f64946bb1cc66e503df8dc7f02c9a07174115`.
Fontes/testes/configuração de tooling têm hashes no recibo; TAP completo separado
em `transport-bounded-tests.tap`. O TAP vermelho anterior permanece com SHA-256
`9c02ae6143a2c6c028666912a89bb74c5592c5c50cc2bccdaa2d61c134c290af`.
O resultado controlado não demonstra a causa nem encerra a instabilidade anterior.

Conferidos sintaxe, Prettier dirigido, 164 links relativos e diff do escopo.
Recibos/fontes pinados anteriores, duas reservas do ledger e a fotografia de
419 paths/bytes do gateway continuam intactos, SHA-256
`1925cc08e68adbe5a5768f1077f1f25995d8da438f02b7dcdcc45ea233acf82a`.
Essa fotografia não cobre Dockerfile, documentos, mobile ou tooling privado.
O diff global mantém a linha vazia alheia no EOF de `PlatformBadge.tsx:44`;
não foi corrigida por este trabalho. Maven/web/mobile/SDD não são redatados.

O fechamento documental foi acrescentado após o recibo e reconferido
separadamente por formatação, links e diff. Produtor/handoff localmente testados
não equivalem a operação admitida: IAM COS, geração de import, custo completo,
recuperação parcial e prova nativa continuam abertos. Nenhuma alteração cloud
foi executada, e o limite US$ 5 total não recebeu reserva adicional.
