# Processamento volátil — revisão autorizada em 2026-11-01

Ruan autorizou substituir a arquitetura de conteúdo remoto por processamento
em memória e retorno direto ao cliente. Esta decisão substitui as regras de
retenção de conteúdo, objetos, URLs assinadas, outbox de mídia e ACK de remoção
das versões anteriores de MOB-FEAT-017..021. Evidências anteriores descrevem
o desenho anterior; não comprovam este desenho. A aprovação não é um deploy.

## Contrato

- Original, pixels decodificados, OCR, tradução e manifesto existem somente
  na sessão de processamento, em memória. Nenhum desses conteúdos vai para
  banco, bucket, arquivo temporário, cache distribuído, fila ou log.
- A entrada é um corpo binário limitado, autenticado, com metadados limitados
  separados. Multipart com spool em disco não faz parte do novo transporte.
- O OCR usa Vision online com bytes inline; tradução usa texto inline na API
  síncrona. Não usar OCR batch assíncrono, URI GCS, glossário persistente ou
  exportação de resultados do provider.
- Uma página pesada por instância; admissão antes de ler o corpo ou chamar
  providers. Limites de bytes, dimensões, pixels e duração continuam válidos.
  Renderização nativa continua em processo isolado, com IPC por pipes e sem
  arquivos de conteúdo. Timeout encerra o processo antes de devolver capacidade.
  Cada filha pode criar somente assets técnicos de JVM/fontes públicas em um
  diretório privado de runtime; conteúdo do usuário nunca usa esse diretório.
  Removê-lo sem seguir symlinks e somente após morte confirmada da filha e
  encerramento do writer. Falha de cleanup conserva a capacidade indisponível.
  Revalidar deadline/cancelamento após admissão e criação do diretório, antes
  do lançamento e da escrita no pipe, impedindo trabalho após retorno tardio.
- O resultado e seu manifesto são entregues na mesma resposta autenticada,
  com `Cache-Control: no-store`. Não existe URL de download remoto.
- O aplicativo valida tamanho, hash, dimensões, vínculo e manifesto e efetiva
  resultado/regiões em armazenamento privado local antes de abrir o leitor.
  Original e resultado continuam disponíveis offline no aparelho.
- Encerramento/restart/desconexão não permitem recuperar o conteúdo no servidor.
  A mesma chave de tentativa nunca repete chamadas pagas automaticamente.
  Uma nova execução exige decisão explícita do usuário e nova tentativa.
- Logs operacionais e metadados de segurança continuam disponíveis com
  allowlist: identificador aleatório da operação, estado, código sanitizado,
  horários, duração e volumes. Nunca texto, bytes, tokens, URLs privadas,
  nomes de arquivos ou mensagens brutas de providers.
- Desabilitar dump de heap/core, swap e captura de corpo por proxy/APM na
  implantação admitida. Exclusão de referências/limpeza de buffers não é uma
  promessa de apagamento físico verificável de toda memória do sistema.
- Consentimento deve ter nova versão e dizer que o processamento usa rede,
  Vision US e tradução global. A política distingue infraestrutura operada
  pelo Toonlira das práticas contratuais dos subprocessadores.

## Recuperação e auditoria

O recibo durável registra a tentativa antes da chamada de provider. Uma falha
de confirmação no banco não autoriza repetição. `STARTED` sem conclusão após
restart continua indisponível para replay de conteúdo; a consulta informa
isso de forma honesta. Entrega HTTP concluída não comprova commit no aparelho.
Não existe ACK para excluir conteúdo que o servidor não mantém.

Registros e provas históricos são preservados. Antes de desativar eventual
implantação antiga, inventariar e remover seu conteúdo pelas ferramentas
operacionais existentes; não excluir logs de auditoria ou presumir que alterar
o código elimina objetos já existentes. Nenhuma ação cloud integra esta revisão.

## Plano de dados anterior ao código

### Banco escolhido

PostgreSQL para identidade, autorização, quota e recibos operacionais; nenhum
conteúdo de OCR/tradução/imagem. SQLite e arquivos privados do app continuam
sendo responsabilidade local do cliente.

### Modelo (BCNF)

Recibo `volatile_processing_attempts`: `operation_ref uuid` PK,
`installation_id uuid` FK, `idempotency_key uuid` v7, `status varchar(16)`,
`created_at timestamptz`, `finished_at timestamptz` opcional e
`error_code varchar(64)` opcional. Chaves candidatas: PK e
`(installation_id,idempotency_key)`; ambas determinam os demais atributos.
Sem conteúdo, manifesto, hash de imagem, URL ou referência de objeto.

### Integridade

FK da instalação com `ON DELETE CASCADE`; UNIQUE por instalação/chave;
CHECK da versão/variante UUIDv7. A chave usa o horário das capabilities,
com validade absoluta de sete dias; uma chave vencida é recusada antes de
qualquer provider, mesmo depois de remover o recibo. Nunca renovar sua data.
CHECK de estados `STARTED`, `FINISHED`, `FAILED`; timestamps coerentes e
erro permitido somente em falha. `FINISHED` significa resposta produzida,
não recebimento ou commit pelo cliente.

### Índices

UNIQUE `(installation_id,idempotency_key)` atende replay/owner e a FK.
Índice `created_at` atende quota diária global e limpeza de metadados.
Quota/reserva devem ser serializadas entre instâncias, sem transação longa
envolvendo rede, codec ou envio ao cliente.

### Derivados

Quota calculada dos recibos aceitos, incluindo falhas após reserva; sem cache
ou contador incrementado sem fonte. Não repetir provider automaticamente.
Recibos deixam de ser consultáveis no vencimento da chave e a rotina de
limpeza remove metadados antigos em lotes limitados somente quando o recibo
tem ao menos sete dias e a chave já venceu. A tolerância futura do UUIDv7 não
pode permitir exclusão enquanto a chave ainda estiver ativa. Remoção física da linha
depende da disponibilidade do banco/job; logs operacionais seguem a política
própria da infraestrutura. Não prometer prazo físico absoluto para esses logs.

### Migration e código

Migration aditiva V10; preserva histórico V1..V9 e registros existentes.
Port de recibos, adapter JDBC e use case transacional separados da sessão.
Testes de concorrência/replay/rollback e cadeia completa em PostgreSQL real;
testes de corpos limitados, ausência de escrita e descarte em falhas.

## Plano local de dados — antes da integração móvel

O schema SQLite já admite contrato técnico textual, tentativas
`CREATED/SUBMITTING/UNKNOWN/ACCEPTED/FAILED` e página/projeto `PROCESSING`.
Essas transições usam os enums existentes. A versão mínima 10 acrescenta somente
`volatile_receipt_status`, conforme o plano de dados abaixo, para distinguir
recibo conhecido de estado desconhecido sem sobrecarregar o enum remoto antigo.
As chaves/FKs e a unicidade de tentativa ativa permanecem no mesmo modelo BCNF.
O aceite da resposta direta vincula operação/tentativa e muda página/projeto
para `PROCESSING` na mesma transação; `READY` continua exclusivo do commit
verificado do resultado local. Interrupção ou perda irrecuperável muda somente
o estado local para falha, preservando original e histórico. Uma nova execução
explícita cria nova tentativa/chave e admite `FAILED → PROCESSING`.

Uma única entrega transitória no aparelho guarda bytes e o hash do original
enviado até a aquisição local assumir sua posse. O encerramento descarta essa
entrega; consulta de recibo nunca a reconstrói. O slot permanece ocupado até
o consumidor liberar os buffers. Replays/404 não reenviam a mídia.

## Termos e subprocessadores

O usuário deve possuir direitos ou autorização para o material enviado e
cumprir a legislação aplicável. Esse dever não elimina obrigações legais do
operador. O EULA descreve processamento/entrega e armazenamento no aparelho;
não promete imunidade ou transferência integral de responsabilidade legal.

Segundo a documentação consultada em 2026-11-01, Vision online processa imagem
em memória, sem persistência em disco, e mantém metadados operacionais;
Cloud Translation mantém o texto brevemente em memória para traduzir.
Tradução global não garante permanência em uma região.

- [Vision: uso de dados](https://docs.cloud.google.com/vision/docs/data-usage)
- [Translation: uso de dados](https://docs.cloud.google.com/translate/data-usage)

## Verificação

Gates antigos não são reutilizados como aprovação desta revisão. O transporte
real no mobile, isolamento nativo, falhas/restarts e configuração dos proxies
precisam de evidência específica antes de ativação pública.

### Correção de isolamento da identidade local (2026-11-02)

Reusar o único registro SecureStore existente (`gatewayKey`, instalação e
credencial), sem migration, nova coluna ou conteúdo. Bearer em memória deve
estar vinculado ao mesmo `gatewayKey`. Limpar os dados invalida a geração das
operações pendentes; resposta tardia não pode recriar instalação ou sessão.
Serializar somente mutações do SecureStore para que um delete iniciado durante
uma gravação pendente execute depois dela, sem aguardar chamadas de rede.

### Plano de dados: último recibo conhecido no aparelho (2026-11-02)

**Banco escolhido:** SQLite existente do aparelho; somente metadados sanitizados.
O enum `remote_status` representa o contrato antigo e não deve inventar uma
etapa OCR/fila para representar `STARTED`, nem confundir produção com READY local.

**Modelo BCNF:** adicionar `volatile_receipt_status TEXT NULL` à tabela
`remote_processing_attempts`. A PK `id` determina esse atributo; as chaves
candidatas, FKs e índices existentes permanecem. `NULL` significa ausência de
recibo atual confiável; valores admitidos são `STARTED`, `FINISHED`, `FAILED`.
O vínculo de operação usa `remote_job_ref` existente; a consulta usa
`last_queried_at` existente. Não duplicar manifesto ou resposta JSON.

**Integridade:** CHECK exige contrato `2.0` e referência de operação não nula
quando houver status volátil. As transições de página/projeto/attempt continuam
nos enums atuais. Atualizar vínculo, observação e falha local em transação
exclusiva, preservando READY/CANCELLED. Resultado produzido não é entrega local.

**Índices e derivados:** nenhum índice novo, pois lookup e update usam a PK;
nenhum contador, cache de conteúdo, desnormalização ou novo FK é introduzido.

**Migration e código:** mudança aditiva/idempotente para versão mínima 10,
verificando `PRAGMA table_info` antes de `ALTER TABLE ADD COLUMN`. Banco novo já
nasce com a coluna. Sem backfill inferido: dados históricos continuam nulos,
originais/resultados/credenciais/keys não são apagados, e uma versão global mais
nova nunca é rebaixada. Atualizar mapper/porta/reconciliação/UI e os três locales.
Provar upgrade de banco antigo, round-trip dos três estados, vínculo divergente,
terminais e rollback com SQLite real. A revisão normativa vigente já exige essa
distinção; esta alteração corrige código divergente sem mudar o requisito.
