# Plano da ligação de staging ao ciclo — 2026-10-17

**Plano original; produtor e ligação agora codificados/testados localmente.**
Andamento atual no [registro do transporte](worker-isolation-staging-transport-2026-10-17.md).
Parcela após a
[reconciliação dos leitores](worker-isolation-schema-reconciliation-2026-10-17.md).
Na abertura deste plano, o ciclo recebia uma fonte já existente nos testes; não havia produtor integrado
que transforme observações reais do bucket/objeto no binding consumido por ele.
Essa é lacuna de tooling, não apenas verificação externa. Nenhuma criação,
credencial, grant, reserva ou upload é autorizado por este documento.

Primeira parcela codificada: journal local em
`.local/worker-isolation/mount-staging.R9I651/`, ignorado pelo Git. Ele registra
intenções, observações de geração, readback declarado e transferência exclusiva;
nunca faz HTTP, procura ADC ou afirma que o arquivo foi fisicamente verificado.
As observações só serão reais quando o transporte pendente as adquirir/validar.
Não alegar que o produtor completo está implementado por haver journal.

## Banco escolhido e limite

Aplicação: PostgreSQL continua sendo o dono do estado transacional do pipeline;
nenhuma mudança de schema, entidade, repository ou migration. MongoDB não é
adequado para coordenação de efeitos externos e não será introduzido.

Tooling local de avaliação: reaproveitar o journal de arquivo já existente, com
CAS/lock de SO pelo helper Java, fsync e snapshot atômico. Não iniciar SQL/cloud
somente para preparar um ensaio. A exceção é explícita: documento privado,
pequeno e limitado, sem consultas relacionais, fora do runtime de produção.
Não alegar que um JSON é uma tabela BCNF ou uma transação distribuída com GCP.
O helper Java e os journals históricos permanecerão intactos.

## Modelo lógico e determinantes

- `runId → project, zone, janela UTC, bucketName, objectName, archiveHash,
archiveBytes, hash do plano, hash do projeto`: binding imutável de uma rodada.
- `(runId, operação) → intenção, hash do request, observação e instante`:
  operações distintas de criação de bucket e upload. Uma intenção por operação.
- `runId → recibo verificado de fonte, hash do bundle entregue, estado de
transferência`: somente observações verificadas preenchem gerações reais.

Na representação relacional conceitual, cada determinante seria chave candidata.
No journal, o snapshot único é deliberado para CAS de todo o estado limitado;
não replicar dados de negócio, dinheiro ou texto OCR. Limites/versão de schema
e campos permitidos serão conferidos na leitura e em toda transição.

## Integridade e estados

Vínculo estrito por plano/run, janela máxima já prevista no bundle, hash e tamanho
fixados do archive. Usar timestamps UTC canônicos; gerações/metagenerações como
strings decimais positivas, sem arredondar uint64. Não aceitar campos extras,
URLs livres, caminhos de destino arbitrários ou valores de fixtures no runtime.

Sequência proposta:

1. Validar plano, admissão explícita e arquivo local por handle sem seguir link;
   conferir SHA-256/tamanho e identidade do arquivo antes de qualquer mutação.
2. Conferir ausência do nome exclusivo; gravar intenção durável de criar bucket
   **antes** do POST. Timeout/resultado ambíguo impede outro POST automático.
3. Validar projeto/identidade, Standard São Paulo, UBLA/PAP obrigatório, ausência
   de versionamento/retention lock/website/namespace inesperado e soft delete
   previsto. Consultar IAM sem persistir identidades e testar permissões ali.
4. Conferir ausência do objeto; gravar intenção durável de upload. Um único
   upload create-only (`ifGenerationMatch=0`), sem retry. Não tocar na imagem de
   mangá; a fonte é o archive de runtime já aprovado para a prova mínima.
5. Conferir metadata/gerações/hash/tamanho, readback limitado ao archive e nova
   conferência de bucket/objeto. Só então registrar a fonte verificada.
6. Construir bundle e journals de Compute/retirada com os IDs **observados**,
   validar os vínculos e registrar a transferência antes de iniciar Compute.
   Reabertura não repete upload/criação nem reentrega o ciclo automaticamente.

Intenção sem confirmação não significa recurso ausente. Falha de persistência
ou confirmação perdida preserva a ambiguidade e exige recuperação explícita.
Não existe FK entre journal local e GCP: a integridade do vínculo é conferida
pelos hashes, identidade, gerações e respostas, não afirmada como atomicidade.
Não remover staging se o estado de transferência/Compute for inconclusivo.

Criar/retirar recursos e inferir permissões são ações distintas. Não ampliar IAM,
habilitar API, substituir bucket/COS ou fazer fallback público para obter êxito.
O GET/teste IAM da imagem COS permanece inconclusivo; produção continua fechada.

## Índices e derivados

Sem índices SQL ou cache novos. Acesso direto à rodada e suas operações no
snapshot limitado; chave composta lógica evita intenções duplicadas. Estado de
transferência é fonte para coordenação, não contador. Recibos/resultados são
projeções de observações registradas e não evidência de cobrança ou boot.

## Migration, implementação e verificação

Sem Flyway: novo formato local versionado e novos arquivos privados de tooling,
reaproveitando o store/lock existente. Não converter ou sobrescrever os journals
históricos. Testes precederão código e cobrirão concorrência real do store,
reabertura, expiração, cancelamento, arquivo ausente/adulterado, IAM/proteção
incompletos, source drift, create-only, resposta perdida e falha de commit.

O transporte terá credential/fetch/clock explícitos, sem ADC, rede Google ou
SDK implícitos. Testes usarão HTTP e fontes sintéticas; fixtures pequenas não
alterarão silenciosamente o pin do archive real. Respostas, tokens e caminhos
privados não entrarão nos logs; erros serão sanitizados. Não copiar archive,
RAW ou JRE para testes e não tocar na auditoria de performance.

Depois, integrar produtor → bundle → ciclo HTTP v2 → retirada, com todos os
adapters externos falsos e journals reais. Só esse ensaio poderá comprovar a
ligação automatizada; os 669 testes anteriores não a cobrem. Ele continuará sem
comprovar geração real GCS, importação ou COS. Chamadas reais dependem de fechar
admissão/custo e das autorizações operacionais aplicáveis ao limite US$ 5 total.
Não abrir a 021 ou encerrar a 020 por concluir este tooling.

## Parcela do journal

`makeStagingPlan` fixa nomes, projeto/zona, archive e janela, sem gerações futuras.
`openStagingJournal` reaproveita o helper Java existente sem alterar seus fontes:
lock/CAS/fsync em diretório privado, schema próprio dentro do snapshot limitado.
Um binding divergente ou estado desconhecido é recusado, nunca reparado/resetado.
Reabertura conserva intenções e não concede novo envio; conflito de request/hash
é erro. Confirmação perdida pode preservar a intenção já publicada. A entrega
do bundle também exige claim exclusivo, sem autorizar outra chamada automaticamente.

Testes sintéticos exercitam concorrência entre instâncias no store real,
reabertura, expiração, transições inválidas, gerações diferentes, snapshot
imutável e confirmação perdida. Três regressões posteriores falharam antes
das correções: observação e readback alterados pelo chamador durante leitura
assíncrona, e hash dependente da ordem de propriedades do input. Agora as entradas
são copiadas antes da espera e o plano tem ordem canônica. Esses testes não
usam o archive privado, credenciais ou Google; os metadados são sintéticos.

Fechamento desta parcela: 30 testes dirigidos aprovados, sendo 12 novos e 18
regressões do journal anterior, sem falhas/cancelamentos/skips/TODOs. Não somar
esses 30 aos 669 como se fossem casos disjuntos ou nova suíte integral. A
fotografia dos 669 permanece com sua data e não cobre o journal posterior.

Recibo exclusivo `mount-staging.R9I651/verification.json`:
`278cae2ed0487abacbbccf1c03e03e2d5c815d391170eba7ff7708e99acc1278`.
TAP preservado; helper/journal antigos, recibos pinados, 419 paths/bytes do
gateway e ledger com duas reservas reconferidos/intactos. Sintaxe, links,
Prettier e diff do escopo aprovados. O EOF alheio de `PlatformBadge.tsx:44`
permanece no diff global. Maven/web/mobile/SDD não reexecutados ou redatados.

No fechamento histórico do journal, transporte de staging, validação física do
archive e integração do produtor ao ciclo continuavam pendentes. Sua implementação
posterior está separada no registro do transporte; esta fotografia não foi
promovida a evidência cloud. A skill `database-design` orientou o modelo de
intenções e o reaproveitamento delimitado do store; não foi introduzido banco
de negócio para tooling nem alterado o PostgreSQL da aplicação. Fechamento
documental acrescentado após o recibo e conferido separadamente, sem sobrescrita.
