# Admissão Spot e integração CAS5 offline — 2026-10-20

Continuação da [preparação de preços/quota](worker-isolation-spot-admission-preparation-2026-10-20.md).
Entrega uma admissão concreta e sua integração local, **não uma execução cloud**.
A 020 continua `in-progress/open`; 021 bloqueada. Defaults e código do produto
não mudaram. Sem instalação, upload, nova reserva, chamada de provider ou mudança
de IAM/API/quota.

## Implementação local

O candidato privado `mount-spot-admission.jh06VM` vincula perfil fixo
`e2-micro-spot-mount-v1`, preços Spot, janela integral de 15 minutos, billing
BRL do projeto, preflight recente, quota recente e reserva revogável existente.
Dinheiro continua em nanos/centavos inteiros. Não reserva orçamento nem abre
conexão por conta própria. Não cria tabelas, migrations, índices ou caches.

Foram executados **61 casos**, incluindo oito regressões herdadas da admissão
STANDARD, com zero falhas/skips/cancelamentos. O RED inicial preserva cinco
falhas. Um teste adicional reproduziu a regressão de relógio após a verificação
assíncrona da reserva; o novo candidato conserva o maior instante observado.
Prazo de criação não estende cleanup, e cleanup não reabre criação.

### Divergência encontrada na integração

O primeiro ensaio integrado recusou handoff e cleanup: o bundle preserva a ordem
das propriedades de sua entrada ao calcular o hash. A admissão acrescentava o
perfil no fim, enquanto o handoff CAS5 o colocava no início. As requisições eram
equivalentes, mas o compromisso de bytes era diferente. Não foi aceito um hash
alternativo nem enfraquecida a conferência.

O candidato posterior `mount-spot-runtime.gJBmvs` inclui `admission-v2.mjs` com
a mesma ordem canônica usada pelo handoff. O predecessor e seus recibos foram
preservados. O teste compara também contra o bundle STANDARD real, que continua
recusado. O wrapper usa os ports nativos existentes e a composição CAS5; perfil
inválido falha antes de workspace, aquisição de identidade ou HTTP.

O gate consolidado passou em **75 casos**: 61 na suíte da admissão e 14 na suíte
de integração, esta incluindo novamente as oito regressões herdadas. Portanto,
não são 75 cenários novos independentes. Usa CAS Java real e o archive local
existente, mas credenciais e HTTP são falsos. A execução confirmou:

- fluxo Spot completo, uma criação por recurso e retirada dos recursos simulados;
- HTTP 400 sem operação terminal inventada, sem `NOT_SENT` e sem segunda criação;
- upload com confirmação perdida, seguido de recuperação restrita;
- reserva revogada impedindo aquisição de credencial e chamadas;
- inicialização/encerramento lazy sem SDK, ADC ou rede;
- hash dos fontes/imports inalterado antes/depois do gate.

Não há CLI novo de criação nem execução deste wrapper com credenciais reais.
Simulação de metadados efetivos não comprova scheduling ou isolamento no Google.

## Quota real: decisão ainda conservadora

O histórico de pedidos do projeto foi consultado no Console, sem filtros
visíveis. A tabela informou que não havia pedidos disponíveis. A
[documentação de consulta](https://docs.cloud.google.com/docs/quotas/view-manage#view_quota_increase_requests)
descreve a visão como pedidos pendentes e passados. Não foi localizado um prazo
de retenção independente que prove exaustividade histórica; histórico vazio
não foi convertido em capacidade concedida.

Permanece o fato anterior: o GET retornou `PREEMPTIBLE_CPUS` com limite/uso zero.
A [regra de quota preemptible](https://docs.cloud.google.com/compute/resource-usage#preemptible-quotas)
admite quota padrão sob condições históricas específicas. Não basta um booleano
local `historyEmpty` para autorizar fallback. O primeiro validador implementa
somente quota dedicada positiva e suficiente, recusando zero/ausência/warning,
duplicatas, observação velha e valores inválidos. É uma **restrição conservadora
local**, não prova de que Spot seja proibido ou de que quota padrão não funcione.
Exige também folga padrão conservadora, sem afirmar que ela será consumida no
regime dedicado. Quota disponível nunca garante capacidade Spot na zona.

Consequentemente, **o ambiente real ainda não recebe admissão**. A cotação
coletada anteriormente também já expirou; não foi regravada com data nova.
Não foi solicitado aumento, executada VM por tentativa ou trocado perfil/região.

## Recibos

| Evidência privada                      | SHA-256                                                            |
| -------------------------------------- | ------------------------------------------------------------------ |
| Admissão inicial, 61 casos             | `e9beb65560bd23ff8352b65ba1265ebf96cdaf4d97fcce85b020347005df1fb3` |
| RED do relógio                         | `370ee050f52d6ca425003473e12caa1fdb0a2e559f36d7b7358b91474a446a2a` |
| RED integrado, três falhas             | `ecb8e0a3a1a89451a01a338fa854502b60fb674ffd3b5c945f8557ad101c3958` |
| Gate integrado final, 75 casos         | `76dbe1ea12f38b87ec2bcd7efc2ef27aae8a1f9b7ca2c1987b39ae91afc9afd5` |
| Histórico visível de quota, sanitizado | `a6ab495176d84f6840fb2221bb2b7a0eccf61c4511d66f7d11d131d673244779` |

Reprodução offline: no diretório do candidato final, executar
`node --test admission-v2.test.mjs integration.test.mjs`. Requer o JDK 23 já
disponível para o helper CAS e os artefatos locais pinados; não baixa dependências.
Recibos são exclusivos e não devem ser sobrescritos. O gate selado não é comando
para executar cloud.

## Verificação e próximo passo

O snapshot técnico de 419 fontes foi reconferido sem divergência. Type-check web
e `pnpm specs:check` foram reexecutados e aprovados; este último inclui seus 24
testes, integridade e links mobile. Links locais dos documentos afetados,
Prettier direcionado e diff restrito também passaram. O diff global continua
acusando a linha em branco preexistente de `PlatformBadge.tsx:44`, não alterada.
O Maven global aprovado no incremento anterior continua como evidência daquela
execução, não como nova execução deste tooling. Não houve mudança em fontes
Java, migrations, mobile ou arquivos da auditoria de performance.

A integração offline remove o bloqueio de hash, mas não o de admissão nativa.
Próximo passo: resolver explicitamente o regime de quota e, antes de qualquer
tentativa, renovar preços/billing/preflight, conferir ausência dos escopos
anteriores e revisar o operador com este grafo CAS5. O ledger mantém quatro
reservas de USD 5; isso não representa gasto faturado nem hard cap do Google.

Segurança no boot, runtime/CVEs, memória, renderer completo e qualidade continuam
pendentes. Uma prova de montagem restrita não conclui esses gates nem a 020.
