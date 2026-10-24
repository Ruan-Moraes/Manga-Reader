# Guarda da décima retirada — 23/10/2026

Continuação do [candidato de cota explícita](worker-isolation-crm-quota-native-2026-10-23.md)
e dos [registros da décima rodada](worker-isolation-zoneb-operator-2026-10-23.md).
**Preparação e integração offline, sem novo operador cloud selecionado.**

## Escopo e integridade

O pacote privado `.local/worker-isolation/mount-tenth-retirement.cBsDEd/` acrescenta
o contexto encerrado `mount-check-20261023-e04f69c8` ao conjunto de ausências.
Agora são nove registros de escopo cobrindo dez rodadas, com **97 URLs únicas**.
Os onze alvos novos incluem também disco de dados, boot e VM, embora não tenham
sido criados: ausência desses alvos não autoriza inventar recibos de criação ou
delete.

O loader confere hashes próprios de capturas, journals, reserva, launcher e das
duas auditorias. Revalida os fontes do operador e do launcher, além da ausência
do lock original dessa rodada. O lock retido da oitava rodada permanece intacto;
seus controles continuam sendo conferidos pela implementação anterior.

A guarda confere cinco POSTs Compute com os requestIds reais e os cinco deletes
terminais correspondentes, rota e gerações do storage. A auditoria suplementar de
dispatch liga o conjunto completo de POSTs à captura. Não se usa o hash de uma
coleção VM sem query para inferir ausência de envio. Disco de dados tem somente
intenção; boot e VM não têm intenção. O trace não teve envio de VM e não é usado
como autoridade de posse ou cleanup.

Cada arquivo JSON mantém seu hash original. A reserva compacta do ledger e sua
captura formatada têm hashes diferentes, mas payloads iguais: os dois hashes e a
igualdade do conteúdo são conferidos separadamente, sem reformatar o histórico.

O contexto parou em um GET 429 antes do dispatch do disco. A causa dessa recusa
continua desconhecida. A retirada e as onze últimas respostas 404 são evidência
histórica, **não ausência fresca** ou aprovação de montagem/boot.

## Consultas admitidas e integração

`scanTenthScope` admite somente GET das onze URLs derivadas do plano e dos recibos
fixados. A validade é de 60 segundos, iniciada após a auditoria histórica. Alvo
não-404, erro, cancelamento, escopo alterado ou registro expirado falham sem retry
e sem autoridade de mutação. O escopo é copiado antes de obter identidade; o corpo
pendente continua retendo a capacidade até seu cancelamento/conclusão real.

A agregação mantém dois ramos: 64 alvos antigos em um; oitava, nona e décima
rodadas sequenciais no outro. Mesmo após erro, os ramos já iniciados terminam
antes do retorno. O resultado precisa de todos os nove registros válidos, sem
trocar falta de evidência por confirmação.

`engine`, `guard` e `admission` foram transplantados somente para remapear imports;
seus corpos normalizados permanecem iguais aos do operador anterior. O guard
seleciona o conjunto novo, e o teste integral utiliza o runtime de cota explícita
já auditado. Não há CLI nativa, financeiro aprovado ou ativação cloud neste
pacote. A composição injetada continua incapaz de atestar transporte real.

## Verificação local

Os testes foram escritos antes dos módulos. O primeiro RED ocorreu entre
23:44:18.881 e 23:44:19.004 UTC, por módulos ausentes; SHA-256 do TAP
`6c367127a052f9f4f39a7533ee749be4b52fa7f486f5f28f302e9a95048ab374`.
O RED do coordenador, entre 23:48:19.923 e 23:48:20.028 UTC, tem SHA-256
`4d1812d0bea2dd9533ba4940a2fa2e484149207f6496069ea241816c754ec728`.

A execução integral ocorreu entre **23:50:42.027 e 23:54:28.665 UTC** e encerrou
com código zero: **75/75 testes**, sem falhas, skips ou cancelamentos. O recibo
`verification.json` tem SHA-256
`bc2841e1a9622abc30ab3d696984122628f856e85b8c48c7477c06020fa6243a`;
o TAP, `697e5290ae8869032af995287ece606ebfa8e999b4a021de4ef584f061a3d83b`.
Foram revalidadas 454 entradas de fontes/insumos, sem alterar o ledger original.

A cobertura reúne 30 testes do contexto da décima rodada, seis da agregação,
22 regressões financeiras/pré-reserva, quatro recusas do coordenador antes de
reservar, dois de integridade/importação e 11 cenários CAS integrais. Esses
últimos incluem sucesso, recusa de capacidade, confirmação perdida, cancelamento,
negação de admissão, falhas de transporte/escopo e HTTP 429 com retirada.

Checksum do escopo agregado:
`a50707e76b2615cfae36b398840c9c13aaca6bc2ba74cc5dae67f1878f64d4ed`.
Checksum do escopo da décima rodada:
`e95af17aa3a866dd14e900158b18bfd486a8f7f67341b2e5a475c664ba6926f5`.
Nenhum desses hashes representa aprovação de ausência fresca, orçamento ou cloud.

Os gates globais de 19:27–19:30 UTC (Maven offline com Docker, type-check web e
`pnpm check`) passaram e seus logs foram novamente conferidos, sem repetir esses
comandos neste incremento. O recibo histórico tem SHA-256
`c862b57030e37356a74582ee41ca38a57835d2e97999f9df86e5ce0eaefcec72`.
Os 419 fontes técnicos do gateway permanecem com checksum
`1925cc08e68adbe5a5768f1077f1f25995d8da438f02b7dcdcc45ea233acf82a`.
Esse hash não é o checksum mobile/SDD nem o checksum do código operacional.

O diff global mantém somente o alerta conhecido de linha em branco ao fim de
`web/landing-page/src/shared/component/PlatformBadge.tsx:44`; não foi corrigido
neste escopo. Formatação e links dos documentos deste incremento são verificados
separadamente.

Comando da suíte, na raiz do repositório:

```bash
node --import ./.local/worker-isolation/mount-n1-cos-admission.y8ogL1/offline-network-v2.mjs \
  --test --test-concurrency=1 \
  .local/worker-isolation/mount-tenth-retirement.cBsDEd/tenth.test.mjs \
  .local/worker-isolation/mount-tenth-retirement.cBsDEd/absence.test.mjs \
  .local/worker-isolation/mount-tenth-retirement.cBsDEd/guard.test.mjs \
  .local/worker-isolation/mount-tenth-retirement.cBsDEd/prereservation.test.mjs \
  .local/worker-isolation/mount-tenth-retirement.cBsDEd/coordinator.test.mjs \
  .local/worker-isolation/mount-tenth-retirement.cBsDEd/integration.test.mjs
```

O guard global bloqueia rede e comandos reais de credenciais. As consultas
Google, identidades e dados financeiros de teste são sintéticos; journals CAS,
admissão, código de transporte e cópia privada do ledger são reais locais. Os
horários operacionais modelados começam em 23:50 UTC; capturas históricas não são
redatadas. Somente a décima reserva da cópia pode ser substituída pelo cenário;
o original é comparado antes/depois e a cópia é removida ao final.

`verify.mjs` sela fontes e insumos com recibos de escrita exclusiva. Não repetir
esse comando em contexto já selado; o helper desta fotografia exige dez reservas
e falha se o ledger avançar. Não reutilizar o contexto para nova rodada paga.

## Limites e próximo passo

PostgreSQL, migrations, APIs, contratos Java, imagens e defaults não mudam.
Nenhuma chamada Google, instalação ou reserva foi realizada neste incremento.
Os registros novos são locais, privados e ignorados pelo Git; fontes, capturas,
locks e arquivos de auditoria de performance anteriores permanecem preservados.

O orçamento continua com dez reservas de USD 5, total reservado de USD 50, e
máximo contabilizado de USD 65 incluindo folgas anteriores. Não é fatura
verificada nem hard cap do provedor; não foram liberados valores antigos.

O próximo passo é selecionar estes componentes em um novo operador com suas
próprias provas de integridade, entrada nativa e captura financeira atual. A
cotação anterior expirou. Somente depois cabem consultas frescas de metadados,
quotas e 97 ausências, antes de qualquer nova reserva/criação autorizada.

Montagem/boot, segurança, memória total, falhas do worker, integração privada,
retenção operacional e qualidade final continuam abertos. A 020 permanece
`in-progress/open` e a 021 `approved/blocked`. Nenhum upload ou provider foi
habilitado, nem houve aprovação operacional.
