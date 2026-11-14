# Orçamento total de US$ 100 e preflight real somente leitura

Atualização posterior: houve uma [tentativa nativa e recuperação](worker-isolation-native-attempt-2026-10-18.md).
A ausência de reservas/criações descrita abaixo corresponde ao fechamento
deste incremento, anterior àquela rodada; não é o saldo corrente depois dela.

Data: 2026-10-18. Continuação da
[decisão anterior de admissão](worker-isolation-admission-status-2026-10-18.md).
A autorização humana posterior “Aumentei para 100. Continue” substitui o teto
anterior: **USD 100 no total, não USD 100 adicionais**. Não autoriza ignorar
segurança, instalar dependências sem aprovação ou habilitar uploads públicos.
A 020 continua `in-progress/open`; a 021 bloqueada.

## Controle financeiro implementado

A skill `database-design` orientou o plano anterior ao código em
`.local/worker-isolation/budget100.pevANi/design.md`: exceção explícita para
tooling privado local, sem banco/migration do produto, dinheiro em centavos,
chaves/constraints verificadas em código e nenhuma promessa de FK/BCNF SQL.

O ledger novo é separado do antigo e preserva seus dois registros por hash.
Contabiliza conservadoramente todo o teto anterior de USD 5, sem presumir
reembolso, saldo não usado ou gasto conciliado. A política local reparte:

| Parcela                | Centavos USD | Significado                                                 |
| ---------------------- | -----------: | ----------------------------------------------------------- |
| Carry-forward anterior |          500 | Todo o teto antigo, não valor medido na fatura.             |
| Contingência           |        1.000 | Margem retida, não uma reserva já consumida.                |
| 17 slots de 500        |        8.500 | Capacidade normal máxima, sem reservas novas nesta entrega. |
| Total                  |       10.000 | Limite autorizado no conjunto, não por rodada.              |

Arquivos exclusivos 0600/diretório 0700, owner/nlink e NOFOLLOW/NONBLOCK,
fsync de arquivo/diretório, autorização pinada e associação runId/hash do plano.
Um lock de escrita serializa a verificação de duplicata e escolha do slot entre
processos; concorrente recebe erro sem retry. Crash, lock abandonado ou registro
incompleto bloqueiam novas reservas; não há refund, reset ou recuperação
destrutiva automática. O CLI não aceita diretório ou valor alternativo.

Esses controles não protegem contra um usuário local que possa adulterar
simultaneamente código e estado. Não constituem fatura, imposto determinado,
cotação completa ou corte de cobrança aplicado pelo Google.
O [cenário BRL histórico](worker-isolation-account-pricing-2026-10-17.md)
permanece histórico; a autorização maior não transforma suas hipóteses em fatos.

```bash
node .local/worker-isolation/budget100.pevANi/operator.mjs status
```

`init` já foi executado explicitamente uma vez no diretório fixo; não repetir
para resetar. `status` não reserva, não inicializa SDK e não usa rede.
O resultado real é `limitCents=10000`, `reservations=0`,
`reservedCents=0`, `billVerified=false`, `providerHardCap=false` e
`permitsCloudMutation=false`. Reservas em fixtures não consomem o ledger real.

## Consultas reais executadas

Entre **13:40:18 e 13:40:21 UTC (10:40 de Brasília)** foi usado o loader/HTTP
nativo existente, com token somente em memória. Os manifests do SDK e a conta/TLS
foram verificados pela política existente; seis recibos encadeados/fontes do
bridge foram conferidos antes de acessar a identidade. Isso não atesta todos
os binários do SDK nem concede permissões de escrita.

| Consulta fixa                     | Resultado real sanitizado                                                 |
| --------------------------------- | ------------------------------------------------------------------------- |
| Resource Manager do projeto       | HTTP 200, `toonlira-rm`, ACTIVE e hash do número correspondente.          |
| Metadados Compute do projeto      | HTTP 200, zero itens; nenhum startup herdado encontrado.                  |
| Imagem COS pinada                 | HTTP 200, READY, x86_64, ID correspondente e sem depreciação informada.   |
| Tipo `e2-micro` na zona escolhida | HTTP 200, 1.024 MiB, dois vCPUs compartilhados, não dois cores dedicados. |

O gate permite somente identidade e os hashes das quatro requests GET exatas;
nega criação/delete. Não houve nova autenticação interativa, login, troca de
conta, ADC, instalação, upload, OCR, tradução, VM ou outra criação cloud.
A CLI existente pôde acessar seu cache de autenticação; não se afirma ausência
de toda escrita local interna do SDK.

O comando usado foi:

```bash
node .local/worker-isolation/budget100.pevANi/preflight.mjs --read-only
```

Sua captura exclusiva já existe em `native-read/result.json`; **não reexecutar
sobre esse destino**. Tentativa interrompida/falha também não é retomada nem
sobrescrita automaticamente. O relatório declara `simulated=false` e
`nativeIdentityObtained=true`, sem token, conta bruta, número bruto do projeto
ou body de erro. As fixtures de teste são explicitamente `simulated=true`.

## Testes e limites

Testes foram escritos antes das implementações e reproduziram módulo ausente.
A primeira rodada financeira falhou por caminho temporário não canônico no macOS
e, depois, por escape excessivo do regex de nomes. A fixture passou a resolver o
diretório real; a implementação teve o regex corrigido, sem relaxar os guards.
TAPs red são preservados; os recibos anteriores não foram reescritos.

Cobertura: limite/total, consumo integral dos slots, duplicatas e confirmação
perdida, processos concorrentes, vínculo ao plano, permissões/links/hardlinks,
locks abandonados, arquivos incompletos e erros sanitizados. CLI não expõe
execute/reset/reserve/override. Preflight testa gate default deny, quatro GETs,
403 sem retry, projeto divergente, startup herdado e imagem depreciada.
Os diretórios temporários novos dos testes são removidos pelos próprios testes;
imagens reutilizáveis e auditoria de performance não foram tocadas.

A verificação terminal agrega regressões de requests/prova/custo e do bridge
nativo. Contagens, hashes, links e resultados ficam no recibo exclusivo local,
sem chamar SDK/Google novamente. Maven/web/mobile/SDD não são presumidos
revalidados por essa suíte de tooling. Nenhum gate da feature foi promovido.

## Próximo trabalho

A restrição financeira anterior foi substituída, mas ainda faltam a admissão
da receita mínima de segurança/custo e a ligação do ticket ao executor real.
O ledger novo não pode ser confundido com essa admissão. Depois de fechá-las,
executar/retirar a prova mínima e validar separadamente o worker completo:
metadados lidos não provam boot, cgroups, seccomp, OOM ou limpeza operacional.
O estudo híbrido urgente continua separado e a implementação segue server-side.
