# Review — MOB-FEAT-019

- Spec revisada: `spec.md`
- Gate na entrada: `open`; dependência `MOB-FEAT-018` em `verification-pending`.
- Implementação/revisão: working-tree sha256:0197e775ac2875fd2619dc4a8a1a68162b97aa1591d460593588c2932c2d51b2
- Verdict: `verification-pending` — implementação técnica auditada, incluindo escrita local e ACK server-side; TASK-006 aberta para provider/qualidade reais, revisão linguística, medição física e operação.

## Findings e limites

Revisão pelo método `sdd-reviewer`, sob guardrails atuais que aceitam dependência
em verificação. Na fotografia inicial da TASK-001 não havia alteração de
persistência, migration ou integração ao worker. A parcela posterior introduziu
esses itens como código offline; a revalidação com PostgreSQL passou em 2026-10-02. Nenhuma
chamada paga ocorreu; naquela fotografia capabilities mantinha a lista central e o mesmo ETag.

ACK server-side e cleanup durável foram acrescentados e testados. A auditoria
integral de 2026-10-03 não encontrou lacuna funcional normativa restante na 019.
TASK-001..005/007 técnicas concluídas; TASK-006 aberta. Retorno renderizado e
aquisição/commit/ACK do aplicativo pertencem às 020/021, não são implementações
ausentes reclassificadas como benchmark. A 019 está `verification-pending`,
não `implemented`; suas verificações externas não receberam aprovação.

Ver [consolidação e checksum técnico](evidence/translation-consolidation-2026-10-03.md).
Dois testes multipágina adicionais comprovam um único upload da primeira página
ordenada e ausência de fallback para a segunda. Gates de runtime reexecutados:
Maven global offline com Docker, gateway com 352 testes, web type-check e
`pnpm check` mobile com 116 suítes/859 testes passaram.
O snapshot técnico Java de 191 arquivos corresponde à fotografia do ACK.
Revisão documental final/SDD registrada na consolidação após estabilização.

Decisão de 2026-09-27: o adapter usa Cloud Translation Advanced LLM no
endpoint global, com preflight de 30.000 pontos de código Unicode da requisição completa.
Testes fake verificam a requisição, mas nenhuma chamada real desta review prova
compatibilidade com o provider. A mudança de
localização exige atualizar disclosure/capabilities da 017 antes de uploads;
Essas pendências reais permanecem na TASK-006; não habilitam execução paga.

## Critérios e evidências

| Critério | Implementado | Evidência verificada                                                                    | Resultado                                            |
| -------- | ------------ | --------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| AC-001   | sim, técnico | 42 pares, subconjunto operacional compartilhado, ETag e rejeição antes de mídia         | configuração real pendente na TASK-006               |
| AC-002   | sim, técnico | envelope de página no gRPC local; IDs, ordem/texto preservados, commit transacional     | contexto, nomes próprios e qualidade reais pendentes |
| AC-003   | sim, técnico | variantes em request fake, UI/manifestos, SQLite v9, mapper e escrita de regiões        | variantes reais/revisão linguística pendentes        |
| AC-004   | sim, técnico | bytes/hash/UTF-8, IDs/metadados/limites e receipts; falhas não avançam; V1–V5/SQLite v9 | aquisição e renderer continuam nas 020/021           |
| AC-005   | sim, técnico | vazio sem RPC; reserva, falha, timeout, reentrega e cancelamento no PostgreSQL          | operação implantada pendente                         |
| AC-006   | sim, técnico | tentativa única medida, preflight, primeira página, storage/TTL e ACK por lease         | retenção/IAM/logs/custo reais pendentes              |

[Evidência dos contratos](evidence/translation-contracts.md) e
[parcela offline do worker](evidence/translation-worker-offline-2026-10-02.md) e
[metadados locais SQLite v9](evidence/translation-local-metadata-2026-10-03.md).
Parcela posterior: [pares operacionais e contrato local](evidence/translation-capabilities-contracts-2026-10-03.md).
Correção seguinte: [segurança de reentrega](evidence/translation-delivery-safety-2026-10-03.md).
Parcela local seguinte: [integridade dos bytes](evidence/translation-manifest-byte-integrity-2026-10-03.md).
Fronteira seguinte: [receipts do worker](evidence/translation-job-receipts-2026-10-03.md).
Contrato seguinte: [associação local das regiões](evidence/translation-region-association-2026-10-03.md).
O hash histórico da 018 não foi sobrescrito; rebase SDD corrente não certifica
qualidade OCR nem renova conclusões históricas de outras features.

Parcela ACK server-side revalidada em 2026-10-03: Maven global offline com
Docker, gateway completo (352 testes), suíte leve (305 testes), Node (85
aprovados/um opt-in de fonte não executado), type-check web e `pnpm check`
mobile integral passaram. Essa parcela isolada não abriu 020/021. A auditoria
integral posterior resolveu a decisão de prontidão, sem ampliar a evidência
real. Ver
[evidência da retenção](evidence/translation-result-ack-2026-10-03.md).

## Gates históricos e parcelas incrementais

Resultados de 2026-09-27. Testes escritos antes do código; regressão das
capabilities passou antes e depois da extração, incluindo ETag fixado.
A primeira suíte leve teve sete erros de bind gRPC por sandbox, não de contrato;
reexecutada com loopback local autorizado, sem provider.

| Verificação                                                                                             | Resultado                                                                                                  |
| ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Gateway leve: `./mvnw -o -B -pl apps/translation-gateway -am test -Dtest.excludedGroups=testcontainers` | 202 testes, zero falhas/erros após liberar loopback                                                        |
| Gateway completo: `./mvnw -o -B -pl apps/translation-gateway -am test` com Docker                       | 247 testes, zero falhas/erros; 71 casos de contratos e cinco de capabilities                               |
| Maven global: `./mvnw -o -B test` com Docker                                                            | sete módulos SUCCESS; zero falhas/erros; 3 min 25 s                                                        |
| Web: `./node_modules/.bin/tsc -b`                                                                       | exit 0                                                                                                     |
| Mobile: `pnpm check`                                                                                    | cadeia completa aprovada; 109 suítes/674 testes Jest, 23 perf, 24 SDD e seis FSD                           |
| SDD/links, Prettier direcionado, `git diff --check`                                                     | aprovados; 22 links locais gateway/plano conferidos adicionalmente                                         |
| Contratos compilados por `javac` com classpath vazio em diretório temporário                            | aprovados somente com JDK/OcrLimits, sem Spring/Jackson/SDK                                                |
| Snapshot anterior OCR                                                                                   | 448 artefatos intactos; fontes existentes alterados apenas no catálogo capabilities e teste correspondente |

Avisos `act` existentes no mobile não foram corrigidos fora do escopo.
Não houve reinstalação, uso de ADC, chamadas ao provider ou alteração de defaults.
Somente as referências correntes SDD foram renovadas; conclusões históricas e
hash técnico anterior da 018 permanecem preservados.

## Tentativa inicial de 2026-10-02

A parcela de adapter, worker e V4 é código offline, com testes focados e suíte
leve aprovados. A execução inicial no sandbox teve sete falhas de bind do
servidor gRPC fake; a repetição com loopback autorizado passou. Docker/OrbStack
não está ativo, então migration, concorrência e Maven global não foram
validados. Nenhum default foi habilitado e nenhuma chamada Google ocorreu.
TASK-002..004 permanecem abertas por esses gates e pelas lacunas explicitadas
na matriz. Os resultados de 2026-09-27 acima são fotografia da TASK-001, não
uma alegação de aprovação desta parcela.

## Revalidação e parcela local — 2026-10-03

O daemon Docker ficou disponível em 2026-10-02. Os testes PostgreSQL dirigidos,
a suíte completa do gateway (272 testes, zero falhas/erros/ignorados) e o Maven
global passaram. O hash técnico de 178 arquivos do gateway continua
`c4cd6f96ab748dcc0a80a5bdff7ad9ee404bd4848c6952ab1c3c463614ea7e01`.
A V4 deixou de ser uma verificação bloqueada; os resultados antigos acima
continuam identificados como fotografias anteriores.

A parcela local reutiliza `local-translation-result` e acrescenta apenas
metadados opcionais de tradução em SQLite v9. Testes executam SQL real em
SQLite em memória e verificam migração/reabertura, preservação de texto e
vértices, integridade de INSERT/UPDATE, cascade e rollback. Registros DEMO
continuam sem metadados de provider. TASK-005 permanece aberta para o contrato
e a gravação do resultado remoto; nenhuma UI ou integração renderer foi aberta.
As evidências de Node/Jest não constituem medição ou validação física mobile.

Gates de 2026-10-03: `pnpm check` integral aprovado (110 suítes/685 testes Jest,
30 de performance, 24 SDD e seis boundaries); Maven global `./mvnw -o -q test`
com Docker aprovado; web `tsc -b`, links, formatação e `git diff --check`
aprovados. Nenhuma dependência foi reinstalada. Somente os headers correntes de
checksum foram rebaseados nas demais reviews/drifts, preservando suas conclusões.

## Pares operacionais e parser local — 2026-10-03

O contrato normativo exige pares realmente habilitados. A divergência da
publicação fixa foi corrigida com testes escritos antes do código. Um único
parser configura capabilities/worker; a submissão verifica a lista publicada
antes de mídia/quota. O ETag inclui o conjunto canônico. Default desabilitado
publica lista vazia, aceita somente com gateway desabilitado no OpenAPI/mobile.

O parser local do manifesto `1.0` valida job, hash do OCR, modelo, idiomas,
IDs/ordem e limites UTF-16; associa resposta reordenada sem alterar texto e não
aceita geometria. O hash esperado é fornecido pelo chamador futuro; o parser
não comprova hashing/download de bytes nem gravação final. FSD preservada na
entity existente com API `@x`. SQLite v9 e Java V1–V4 não mudaram nesta parcela.
Review/drift aplicadas sob os guardrails atuais, que admitem a dependência 018
em `verification-pending`. Os resultados correntes ficam na
[evidência datada](evidence/translation-capabilities-contracts-2026-10-03.md).
Não foram adicionadas capacidades visuais sem implementação ou abertas 020/021.

## Review da segurança de reentrega — 2026-10-03

Finding P1 corrigido: falha anterior à reserva podia encerrar a etapa ativa de
outra entrega, inclusive numa janela de cancelamento. Testes vermelhos em
PostgreSQL reproduziram `FAILED`/`CANCELLED` indevidos. O novo caminho transacional
`failUnclaimed` preserva a PK já reservada e mantém `CANCEL_PENDING` até a
fronteira segura. Corrida entre reserva/falha e rollback foram cobertos.

Finding corrigido de confirmação perdida: um estado posterior a `RENDERING`
podia causar exclusão do manifesto confirmado. A recuperação verifica chave/hash
persistidos. Estados posteriores são fixtures de timing, não implementação de
renderer/READY. Não há transação aberta no provider, segunda chamada ou alteração
de schema, API, tarefa, manifesto/default. Não se iniciou download, ACK ou escrita
mobile. Gates e snapshot técnico separados na evidência datada.

A correção fecha essas divergências, não as lacunas integrais da feature.
Verdict parcial e tasks abertas permanecem; 020/021 continuam bloqueadas.

## Conclusão

TASK-001 encerra contratos e validação local. TASK-002..007 abertas;
adapter e worker foram validados offline com PostgreSQL. A fundação local de
metadados e parser está implementada; pares operacionais são publicados e
conferidos antes de submissão. Gravação remota, retorno/ACK,
qualidade e operação reais continuam pendentes. A 019 continua `in-progress`.

## Review da leitura estrita no gateway — 2026-10-03

O serviço do manifesto agora oferece leitura com hash e contexto esperado,
reader privado estrito e validação integral de IDs/texto/ordem. UTF-16 JSON,
UTF-8 inválido, campos desconhecidos, chaves duplicadas, valores coercíveis e
documentos concatenados são recusados. A configuração compartilhada do Jackson
permanece intacta. Os 26 testes sintéticos aprovados incluem limite exato de
4 MiB e limites UTF-16 de região/página, sem rede ou capturas privadas.

É uma fronteira preparada para o renderer, não renderização implementada.
Aquisição de bytes/metadados confiáveis continua responsabilidade do chamador.
Manifesto, API, migrations e defaults permanecem inalterados. Ver
[evidência da leitura](evidence/translation-manifest-reader-2026-10-03.md).

## Review do transporte integrado — 2026-10-03

A evidência de uma chamada por mock foi complementada com o transporte gRPC
do client oficial contra serviço sintético local. Tentativa única é medida
também após timeout e `UNAVAILABLE`, sem ADC. O worker e o adapter foram
exercitados conjuntamente com PostgreSQL, upload e leitura do manifesto:
reentrega, rollback e confirmação perdida não repetem RPC ou apagam artefato
confirmado. Os 16 cenários novos passaram. A mudança de visibilidade do
configurador é interna ao pacote; não muda comportamento ou contrato público.

Isso fecha uma lacuna de evidência automatizada, não aprova qualidade real,
operação cloud ou renderer. Tasks e verdict parcial permanecem nesta fotografia.
Ver [evidência do transporte](evidence/translation-grpc-integration-2026-10-03.md).

Finding P1 identificado antes da V5 na TASK-004: `GatewayController.acknowledge` sempre
rejeita, sem registro durável ou limpeza por ACK. O produtor de `READY` e o
download/commit do aplicativo continuam nas 020/021, mas a retenção server-side
não será considerada concluída por ausência de consumidor. Próximo trabalho:
preparar aceitação idempotente e cleanup remoto com testes, sem habilitar
uploads nem inventar resultado renderizado.

Resolução posterior: V5 e fronteira server-side implementadas, com owner/estado,
ACK repetido, rollback e cleanup idempotente concorrente. O finding anterior
fica preservado como histórico; não está mais aberto para a aceitação server-side.
Ver [evidência da retenção](evidence/translation-result-ack-2026-10-03.md).
`READY` usado nos testes é fixture; a operação e a revisão completa da 019
continuam pendentes, sem promoção automática ou abertura da 020.

## Review da integridade dos bytes — 2026-10-03

Confronto da TASK-005 com AC-002/003/004: a entrada de bytes verifica SHA-256
esperado antes de JSON, conserva o snapshot durante hashing assíncrono e rejeita
UTF-8 inválido sem conteúdo sensível na exceção. Reutiliza o parser sem alterar
modelo/idiomas/texto/ordem. O teto corresponde aos 4 MiB já existentes no Java;
o hash esperado depende de uma fonte confiável no futuro chamador.

FSD e performance revisadas: helper em shared, contrato na entity existente,
barrels/@x preservados, sem UI, cache ou aquisição de rede. Teste com decoder
Expo instalado não equivale à medição em dispositivo ou execução nativa do
digest. Nenhuma persistência/schema foi alterada. TASK-005/007 e o verdict
parcial permanecem abertos; não houve abertura dos gates 020/021.

## Review dos receipts do worker — 2026-10-03

Finding corrigido na fronteira 017/019: parser ignorava seis erros já previstos
no OpenAPI; agora observa `FAILED` legítimo sem conteúdo bruto ou segundo upload.
Finding de integridade corrigido: referência divergente podia confirmar
cancelamento ou atualizar a tentativa local. Consulta/cancelamento conferem
referência e versão antes de mutação; tentativa sem referência preserva recovery
por idempotência com versão correspondente. Testes vermelhos antes do código e
regressões verdes na evidência. O enum local de erros não foi ampliado.
Filtro de versão antes da consulta impede replay por `404` incompatível;
o caso também foi reproduzido em teste antes da correção.

Runtime restrito a entity/features existentes, sem schema, UI ou imports
horizontais. Review de performance estática: comparações constantes, nenhum
request/retry adicional, coalescing preservado; sem nova medição física.
Gravação remota, retorno/ACK e operação continuam abertos. Verdict parcial,
tasks e gates mantidos; esta parcela não conclui tradução ou a 017.

## Review da associação local — 2026-10-03

TASK-005/007 recebe mapper puro e testes sintéticos: valida referência fonte,
reutiliza o parser integral e associa traduções por IDs sem corrigir Unicode,
texto, ordem ou polígonos. Resultado é copiado/congelado; metadados têm
versão/modelo e instante local fornecido pelo chamador, não horário comprovado
de processamento remoto. A fonte exige a geometria convexa do OCR Java.

Nenhuma lacuna bloqueante foi encontrada nesta associação; limites do contrato
foram testados exatamente no teto e acima. A revisão não aprova aquisição,
autenticidade da referência, escrita SQLite, overflow/READY ou resultado final.
Esses itens dependem dos casos de uso futuros e dos gates 020/021, que continuam
bloqueados. FSD/BCNF preservadas sem repository/migration. Análise de performance
limitada ao mecanismo linear/limitado, não a medição física. Verdict e tasks
abertas mantidos; resultados correntes na evidência datada.

## Review da escrita local — 2026-10-03

Adapter separado na entity existente, exposto pelo barrel: insere somente
regiões/vértices dentro da transação exclusiva recebida. Revalida referência,
manifesto, flags e vínculo pai remoto/attempt/página/job/idiomas antes do insert.
Rejeita cancelamento, estado remoto não terminal, replay sobre regiões já
existentes e foreign keys desabilitadas. Não cria resultado pai ou READY local.

SQLite real cobre rollback de dados e pai por falha de escrita/commit, cascade,
leitura pelo repository atual e snapshots anteriores ao await. No teto de 1.024
regiões, batching limita as escritas SQL sem mudar conteúdo/ordem. Isso é medida
de quantidade de chamadas no teste, não benchmark de Expo SQLite físico.

Não há chamador de aquisição em produção nesta parcela. A função não verifica
arquivos/bytes; a transação final, download, navegação e ACK continuam na 021.
FSD/BCNF preservadas sem migration ou alteração das specs normativas. A review
não promove o estado da 019 antes da auditoria integral de suas fronteiras;
ver [evidência da escrita](evidence/translation-region-storage-2026-10-03.md).

## Conclusão corrente — auditoria integral de 2026-10-03

As fotografias incrementais acima foram reconciliadas com os fontes e a
evidência corrente. Nenhuma lacuna funcional restante da 019 foi encontrada;
finding ACK corrigido, escrita local existente e dois cenários adicionais da
primeira página verificados. A 019 fica `verification-pending/open`, não concluída:
TASK-006 mantém revisão linguística/provider real, qualidade, performance física
e operação. A abertura condicional da 020 é autorizada por Ruan; suas oito tasks
continuam abertas e a 021 permanece bloqueada.

Gates reexecutados antes e depois da transição: Maven global offline/Docker
exit 0, web type-check exit 0, mobile integral com 859 testes, SDD/links,
Prettier direcionado e `git diff --check` aprovados. Gateway: 352 testes, zero
falhas/erros/skips. Node: 85 aprovados e um opt-in de fonte não executado,
explicitamente fora da evidência de fontes da 020. Checksum técnico separado
na [consolidação](evidence/translation-consolidation-2026-10-03.md).

Mudanças fora da spec: nenhuma funcionalidade adicional. Atualização de
resumos correntes e checksums de outras reviews é documental/mecânica, sem
renovar conclusões históricas. Não houve runtime Java, mídia, credencial,
cloud, deploy, provider pago, reinstalação ou ativação nesta auditoria.
