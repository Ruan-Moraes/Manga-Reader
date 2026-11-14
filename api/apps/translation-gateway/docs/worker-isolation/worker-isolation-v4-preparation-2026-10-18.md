# Preparo local do operador v4 — 2026-10-18

Continuação do [journal de envio v4](worker-isolation-unsent-journal-2026-10-18.md).
A 020 permanece `in-progress/open`, com a 021 bloqueada. Esta parcela não
executou outra rodada nativa nem comprovou montagem, isolamento ou renderer.

## Entrega e fronteira

O tooling privado acrescenta `prepare` em
`.local/worker-isolation/mount-v4-operator.uE29u9/operator.mjs`.
O comando revalida os recibos do runtime v4, a política de disco, a retirada
explícita anterior, os locks históricos e os fontes auditados. Consulta somente
arquivos locais. Não carrega credencial, compila Java, cria lock/diretório de
rodada ou reserva dinheiro. `execute`, `resume`, flags e tickets arbitrários
são recusados; não há fallback para o operador antigo.

O resultado é um preview sem autoridade de execução. A verificação da retirada
é histórica: antes de uma futura reserva continua necessária uma leitura
autenticada atual das referências antigas. O lock antigo não foi removido nem
a intenção de protocolo anterior foi reinterpretada como v4.

A skill `database-design` orientou o plano anterior ao código: nenhuma tabela,
migration, estado do produto, índice ou contrato HTTP muda. O ledger aprovado
é reutilizado sem refund ou renovação das reservas anteriores. Os novos
registros são recibos privados, não persistência SQL do produto.

## Fontes financeiras renovadas

Os sete SKUs necessários foram conferidos na tabela da conta pelo Console,
em consultas somente leitura, entre **23:27:22 e 23:44:13 UTC**. A tabela
declarava atualização em **18/10/2026**, moeda BRL e conversão explícita
USD-por-BRL. Foram usados preços `Default`, região São Paulo onde aplicável,
e faixas pagas de operações; nenhum desconto contratado foi presumido.
O snapshot novo não substitui nem redata a observação histórica anterior.

A confirmação de billing utilizou a identidade existente e o SDK já fixado,
sem instalação ou alteração de configuração. Duas consultas GET retornaram
200: projeto com faturamento habilitado e conta vinculada aberta, em BRL.
Tokens, nome bruto da conta e resposta bruta não foram publicados.

A primeira tentativa parou antes das consultas por restrição local de acesso
à credencial. Seu registro sanitizado foi preservado. Uma nova tentativa,
com execução autorizada para a mesma leitura, concluiu sem ampliar escopo.

| Fonte privada nova                 | SHA-256                                                            |
| ---------------------------------- | ------------------------------------------------------------------ |
| `observations.json`                | `a81b2413b96f2e81df78c23a1cf188526b9eb395fc6a008bbc8caf71ccaea052` |
| `billing-network-read/result.json` | `948e4eb71aacc0dbfd65477226d4028d186e6931f6549f5f191da12b690dd028` |

Além do frescor no instante inicial, preços e billing precisam cobrir a janela
inteira da rodada e da limpeza, com validade estrita de 24 horas. `prepare`
exige 16 minutos de cobertura; a execução futura manterá 15 minutos e deverá
conferir novamente antes da reserva. Fonte ainda válida, mas prestes a vencer,
é recusada. Não houve aumento artificial de validade.

O cenário conservador existente continuou em **214 centavos USD**. Ele inclui
hipóteses de retenção, taxas e margem; não é fatura, cotação completa ou hard
cap do provider. O limite autorizado continua **USD 100 no total**. O ledger
permanece com duas reservas anteriores de USD 5, sem novas reservas nesta
parcela. Reserva contábil não equivale a gasto efetivamente conciliado.

## Verificação desta parcela

A consolidação passou **57/57**, zero falhas, skips ou cancelamentos:

| Cobertura                                                    | Testes |
| ------------------------------------------------------------ | -----: |
| Validade integral de preços/billing e fronteiras de data     |     17 |
| Preparação local, evidências, orçamento e falhas sanitizadas |     12 |
| CLI e preparo integrado sem HTTP, SDK, compilador ou reserva |      3 |
| Regressões do coletor de billing com portas falsas           |     25 |

O teste integrado bloqueia HTTP e qualquer processo que não seja o verificador
local fixado. Usa relógio explicitamente controlado; não é uma nova observação
financeira. Separadamente, o `prepare` foi executado com o relógio real e as
fontes novas. A consolidação revalidou os hashes e o ledger antes/depois.

Uma primeira versão do spy de processos perdeu o resultado especial de
`promisify(execFile)`, causando falha no teste integrado. Corrigiu-se somente
o spy para preservar `{stdout, stderr}`. O contrato de produção não foi
enfraquecido. O red semântico anterior da janela financeira permanece salvo.

| Evidência privada               | SHA-256                                                            |
| ------------------------------- | ------------------------------------------------------------------ |
| `preparation-verification.json` | `d918313a0aba33fd76e3ac33343ab83866dd4f2468e0f8e5027ec17246787f39` |
| TAP consolidado                 | `da504e377ea58feb17dddd89df2583faaea7b14ccec9e97a22c5e4cd8b2f37fa` |

Comandos executados na raiz:

```bash
node .local/worker-isolation/mount-v4-operator.uE29u9/operator.mjs prepare
node .local/worker-isolation/mount-v4-operator.uE29u9/verify.mjs
```

O recibo exclusivo vincula 17 artefatos locais. O runtime anterior continua
vinculado ao recibo próprio de testes, sem alegar reexecução desses testes
nesta parcela. O snapshot técnico de 419 caminhos permaneceu inalterado.

## Próximo gate

Ligar a execução restrita ao runtime v4 em uma nova revisão verificável,
preservando estes recibos. Antes de qualquer reserva: conferir ausência atual
do escopo antigo, identidade, integridade da prova, segurança e validade
financeira. Só depois iniciar uma rodada com ID novo e retirada rastreável.

Não houve nova VM, upload, criação de recurso, mudança de IAM, deploy, chamada
OCR/tradução ou instalação. Arquivos de performance não foram alterados.
Maven, web, mobile e SDD não foram reexecutados nesta parcela de tooling privado;
não há declaração de gates globais aprovados ou de conclusão da 020.

A formatação direcionada do tooling e desta evidência passou. Foram conferidos
199 links relativos nos três documentos correntes, sem destino ausente;
âncoras e URLs externas não foram validadas. O `git diff --check` direcionado
passou. O global continua apontando uma linha vazia no fim de
`web/landing-page/src/shared/component/PlatformBadge.tsx:44`, fora deste escopo;
esse arquivo não foi corrigido automaticamente.
