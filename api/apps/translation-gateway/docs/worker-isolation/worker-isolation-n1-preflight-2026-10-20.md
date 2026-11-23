# Preflight N1: bloqueio real da imagem COS — 2026-10-20

Continuação do [contrato e admissão N1](worker-isolation-n1-contract-2026-10-20.md).
O preflight está implementado e testado, mas **não foi admitida uma execução N1**.
A leitura real encontrou a imagem COS pinada marcada como `DEPRECATED` pelo
Google. Não houve VM, upload, instalação, nova reserva ou chamada de provider.
A 020 continua `in-progress/open`, a 021 bloqueada e os defaults desabilitados.

## Contrato implementado

O candidato privado `mount-n1-preflight.MXe7nb` executa, nesta ordem:

1. Resource Manager: projeto correto/ativo e número pinado.
2. Compute project: ID pinado e ausência de metadados herdados.
3. Imagem COS: nome/ID pinados, READY, X86_64, disco 10 GiB e sem depreciação.
4. Tipo exato `custom-1-1024`: um vCPU não compartilhado e 1024 MiB.
5. Zona correta/UP, com Intel Broadwell disponível.

São somente cinco GETs, no máximo uma tentativa de cada, sem redirect ou retry.
O processo para imediatamente se uma condição falhar. Há orçamento total de
30 segundos incluindo credencial, limite de 32 KiB por resposta e UTF-8 estrito.
As consultas usam `fields`; metadata solicita somente
`commonInstanceMetadata/items/key`, não valores. Chaves e corpos brutos também
não são persistidos. A seleção parcial segue a [sintaxe oficial de fields](https://docs.cloud.google.com/compute/docs/api/how-tos/performance).

O número do Resource Manager e o ID do Compute são identificadores distintos,
conferidos por hashes separados. Fixtures usam valores sintéticos distintos e
testam a recusa de troca entre eles. Arquitetura omitida pelo tipo de máquina
permanece `not-reported`; não é preenchida artificialmente como X86_64.

O leitor puro sempre informa `simulated=true` e ausência de identidade nativa.
Somente o wrapper que verifica SDK/conta existentes e fontes antes/depois pode
emitir a observação nativa. Receber `200` não aprova capacidade ou operação.
O export para o operador futuro não aceita overrides de credencial/transporte.

Antes da implementação, **53 testes falharam** no RED preservado. O gate
posterior passou em **65 testes**, sem skips/cancelamentos, com rede/CLI reais
bloqueadas no processo. Cobrem política, bytes, expiração/cancelamento,
sanitização, identidade lazy e ausência de efeitos ao importar/invocar sem
autorização. O bloqueador de testes não é prova de isolamento do worker.

## Observações reais, sem aprovação presumida

A tentativa inicial em `mount-n1-preflight.MXe7nb/native-read` não chegou a
nenhum GET: o comando local de token falhou. Um diagnóstico separado indicou
erro de permissão; a segunda tentativa foi executada com a permissão local
necessária, em diretório exclusivo `mount-n1-preflight-read.hIXZ9Z`, sem alterar
o recibo da primeira. Não houve login, grant, mudança de conta ou instalação.

Na segunda tentativa, SDK e fontes permaneceram inalterados:

| Leitura          | Resultado observado                             |
| ---------------- | ----------------------------------------------- |
| Resource Manager | HTTP200, projeto ativo/número correspondente    |
| Compute project  | HTTP200, ID correspondente, metadata vazia      |
| COS pinado       | HTTP200, divergência: depreciação               |
| Tipo N1          | Não consultado nesta tentativa: parada anterior |
| Zona/CPU         | Não consultada nesta tentativa: parada anterior |

A inspeção específica da imagem, entre **23:20:20.674 e 23:20:21.740 UTC**,
confirmou nome/ID originais, READY, X86_64, 10 GiB e self-link correspondentes,
mas **`deprecated.state=DEPRECATED`**, com indicação de substituta. A ausência
de datas de depreciação/obsolescência não foi convertida em aprovação.
Conforme [images.get](https://docs.cloud.google.com/compute/docs/reference/rest/v1/images/get),
o Google ainda pode permitir criação com aviso nesse estado; nosso contrato
mais restrito continua recusando. Não foi enfraquecido para obter resultado verde.

### Substituta: metadados consultados, não selecionada

Entre **23:21:41.803 e 23:21:42.977 UTC**, `mount-cos-replacement.V9ypAA` fez
somente dois GETs: imagem antiga e uma substituta indicada por ela. O ponteiro
é aceito apenas em `cos-cloud`, imagem concreta COS125, sem query/fragment,
porta, família dinâmica, outro projeto ou cadeia adicional. Não há fallback.

A imagem indicada foi `cos-125-19216-739-16`, ID `3497199878532703206`.
Os metadados observados correspondem à família `cos-125-lts`, READY, X86_64,
10 GiB e ausência do campo de depreciação. Isso **não verifica boot, binários,
runtime, CVEs ou compatibilidade operacional**, nem seleciona a imagem para
uso. Nenhum pin/contrato/journal anterior foi alterado.

## Evidências e verificações

| Recibo privado                              | SHA-256                                                            |
| ------------------------------------------- | ------------------------------------------------------------------ |
| RED, 53 falhas                              | `aa2511030ef9cbdf3397330b41ec53e168be7ba2b05ccd6a3ce7982beb12c599` |
| Gate offline, 65 testes                     | `ed2f42b48597794e50af4ea60974be91ba48bbdbe70b7a1b92bd1602658c89c8` |
| Tentativa sem GET                           | `c34a7bd85ee91ef3f23603a581a1ae29dd4f22bb5b37ed1c335afd24e70111d1` |
| Preflight real recusado na terceira leitura | `ae63a5a05fba0f32471ef2f891d6ffe1942681c1d26ed9d9fe87823b9bdb351e` |
| Inspeção COS                                | `9be2e8473270ddcd3382eb1ba9212a09be98c560a123c87d8a491c54e7cee1cf` |
| Metadados da substituta                     | `0de0dae0ced02eeb3ef2d484c85e6897bf06dae3b153186ebeb15699cff33cc2` |

Os recibos são sanitizados: sem tokens, corpos brutos ou mídia. As chamadas
HTTP de metadados foram seis no total (3 + 1 + 2), sem repetição automática do
preflight recusado. Novos comandos diagnósticos são tentativas explícitas,
com intenção/resultado exclusivos; não são retomada ou aprovação desse preflight.

O snapshot técnico de 419 fontes continua como fotografia anterior, não
cobertura deste tooling Node privado. O ledger permanece com quatro reservas
de USD 5, nenhuma nova; reservas não são gasto faturado nem hard cap de cobrança.
Fontes de produto, performance, migrations, infraestrutura e defaults não mudam.

## Próximo trabalho necessário

A [revisão COS73916 de 2026-10-21](worker-isolation-cos-revision-2026-10-21.md)
implementa posteriormente contratos e preflight novos. Este registro histórico
da recusa e os pins/recibos anteriores permanecem preservados.

1. Revisar a substituta e preparar nova revisão explícita do contrato/pins e
   fixtures; não reescrever as evidências da imagem antiga.
2. Revalidar cadeia de requests/binding/admissão/preflight contra a nova revisão,
   mantendo recusa da imagem depreciada e sem adotar journals antigos.
3. Preparar o operador e renovar preços/billing/quota/preflight/ausências para
   a janela inteira antes de qualquer reserva ou criação.
4. Validar separadamente boot/isolamento, runtime/CVEs, memória do worker
   completo, renderização, qualidade e retenção. Mount-only não fecha a 020.

Maven global não foi reexecutado neste incremento sem alteração Java. A
evidência anterior permanece histórica. Validação deste preflight não é uma
nova execução completa do produto ou aprovação operacional.
