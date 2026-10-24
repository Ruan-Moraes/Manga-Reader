# Origem não observável no GET da imagem e orçamento — 2026-10-14

## Autorização e controle financeiro

Ruan autorizou continuar a validação com limite de **US$ 5**, sem solicitar
aprovação financeira a cada tentativa dentro desse limite. Continuação da
[primeira importação](worker-isolation-image-import-real-2026-10-14.md), sem
alterar seus registros ou converter o resultado anterior em aprovação.

O controle desta parcela é local e conservador, não um bloqueio de faturamento
do provedor. [Alertas de orçamento](https://docs.cloud.google.com/billing/docs/how-to/budgets)
não interrompem gastos; [spend caps](https://docs.cloud.google.com/billing/docs/how-to/budgets-spend-caps)
não pausam custos fixos de recursos persistentes e não são garantia instantânea.
Não foi criada/alterada configuração de billing, alerta, cap, IAM ou API.
Não consultamos fatura: gasto efetivamente lançado permanece **não verificado**.

Ledger compartilhado privado, ignorado:
`.local/worker-isolation/budgeted-import.t0Af3K/budget.VNEDyk/`.
Próximas continuações devem usar esse ledger, nunca começar outro para zerar
as reservas. Claims exclusivos, fsync antes de rede; sem liberação automática
de reserva após cleanup. Rodada repetida, claim inválido ou capacidade
esgotada bloqueiam a execução antes da credencial. Concorrência não permite
ultrapassar os três slots de US$ 1. Registros parciais falham conservadoramente.

| Parcela do limite            | Valor | Significado                                                   |
| ---------------------------- | ----: | ------------------------------------------------------------- |
| Margem histórica             | US$ 1 | Provisão conservadora; não cobrança anterior apurada.         |
| Rodada `import-d3bb58bc`     | US$ 1 | Slot 1 reservado antes da execução.                           |
| Rodada `import-428f8ba6`     | US$ 1 | Slot 2 do mesmo ledger, antes da execução.                    |
| Slot normal ainda disponível | US$ 1 | Não utilizado; não implica autorização para ampliar o escopo. |
| Contingência                 | US$ 1 | Preservada para retirada/observação, não novas tentativas.    |

Cada estimativa superdimensionada resulta em aproximadamente US$ 0,20:
imagem de até 10 GiB por 24h, archive por 24h + sete dias de retenção,
1 GiB de saída, dez mil operações classe A e dez mil classe B. Usa a
[cotação pública regional](worker-isolation-import-recipe-2026-10-14.md)
de 14/10, recusada pelo runner se tiver mais de 24h. Esses volumes excedem
o observado; não são orçamento por conta, garantia de preço, valor faturado
ou prova de eliminação física. Impostos e consumo alheio não foram apurados.
A reserva de US$ 1 por rodada permanece consumida, sem alegar saldo real.
Se cleanup ficar inconclusivo, parar novas criações e priorizar os recursos
próprios pendentes; uma pausa local não interrompe cobrança no provedor.

## Duas execuções reais, sem provider ou VM

Pacotes exclusivos `budgeted-import.t0Af3K` e `source-echo.S5Abak` em
`.local/worker-isolation/`, ambos ignorados. A segunda rodada refinou a
captura da origem; não mudou o body do insert, a query experimental de geração,
o adapter de Storage ou a admissão estrita. Nenhum fallback para URI sem geração.

| Rodada           | Horário de Brasília em 14/10 | Bucket / imagem (sufixo comum) | Target ID             | Geração do objeto  |
| ---------------- | ---------------------------- | ------------------------------ | --------------------- | ------------------ |
| Campo divergente | 20:10:32–20:12:40            | `d3bb58bc`                     | `8824817199576102165` | `1792019444451075` |
| Origem detalhada | 20:14:11–20:16:28            | `428f8ba6`                     | `1018367191637930553` | `1792019663019799` |

Nomes completos: `toonlira-prepull-20261014-<sufixo>` e
`toonlira-prepull-image-20261014-<sufixo>`. Runtime conhecido, não imagens OCR:
62.359.506 bytes, SHA-256
`f8b8009f1684e29050a5472c2dc3077e6177ef322c667000e532c8bc2dd6135c`.
Cada upload create-only teve MD5 validado pelo Storage e leitura de volta da
geração específica com SHA-256/tamanho correspondentes. Bucket privado Standard
São Paulo, acesso uniforme, bloqueio público e soft delete de sete dias;
permissões conferidas no recurso, sem grants ou objetos públicos.

Um insert por rodada, observado no mesmo handle até DONE sem erro da API.
Identidade própria terminal e target ID conferidos. As duas respostas GET
indicaram READY, RAW/TAR, X86_64, armazenamento `southamerica-east1`,
`diskSizeGb="1"` e `archiveSizeBytes="73862272"`. O tamanho informado pela
imagem não é igual ao upload; não inferir motivo nem comparar como se fossem
o mesmo arquivo. O validador usa cap, não igualdade desses dois tamanhos.

O único predicado reprovado foi **`sourceUriEcho`**. Na captura detalhada,
`rawDisk.source` estava **presente e igual à string vazia**, comprimento zero
e SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.
Não era URI sem query, `gs://`, URL estrangeira ou valor nulo. Não há evidência
de que o importador respeitou ou ignorou a seleção de geração.

Conclusão limitada: nesta execução, exigir eco exato do input no GET impediu a
admissão local de uma imagem READY. **Não é falha de OCR, ausência de READY ou
erro informado pela importação.** A [referência de images.get](https://docs.cloud.google.com/compute/docs/reference/rest/v1/images/get)
descreve os campos, mas não substitui essa observação nem comprova bytes.
Não generalizar que toda imagem/versão da API sempre retorna source vazio.

Nenhum validador anterior foi relaxado: receipts mantêm `importValidated=false`
e `partial-or-unconfirmed`. Fatos READY/região/tamanho agora estão registrados
separadamente de origem/generation/filesystem não comprovados. A decisão futura
deve separar essas verificações, não remover uma checagem só para obter verde.

## Retirada e retenção

Um delete de imagem por rodada, operação até DONE sem erro e GET posterior 404.
Depois, objetos próprios removidos com generation/metageneration e GET 404;
bucket vazio, identidade revalidada, DELETE 204 e GET 404. Nenhuma mutação repetida.
Em conjunto: 34 requests Storage e 49 Compute, seis comandos gcloud, 12 mutações
(seis por rodada). Há journal durável por imagem e ledger separado do staging.

Soft delete observado antes de retirar cada bucket:

- `d3bb58bc`: 14/10 23:12:39.478Z; hard delete previsto 21/10 23:12:39.478Z.
- `428f8ba6`: 14/10 23:16:27.521Z; hard delete previsto 21/10 23:16:27.521Z.

Esses horários são fotografias, não comprovação de remoção futura; a exclusão
do bucket pode afetar retenção. Não houve restauração, mudança de prazo ou
grant para consultar buckets soft-deleted. Recursos ativos dessas duas
rodadas estão confirmadamente ausentes; eliminação física e cobrança efetiva
continuam não verificadas.

## Testes, rastreabilidade e próximo trabalho

Seis testes de orçamento e seis de origem detalhada, escritos antes da
implementação: reserva/concorrência/tamper/repetição, origem vazia/ausente/nula,
HTTPS/gs/geração, strings malformadas e proteção contra URI, query e credenciais
arbitrárias no registro. Payloads dos testes são sintéticos, sem chamadas cloud.
Regressões do macOS exigem caminho temporário canonicalizado; validação não
foi desabilitada para aceitar o alias `/var` em lugar de `/private/var`.

163 testes Node locais aprovados. Capturas mantêm `intent.json`, plano, receipt,
diagnóstico e journals originais; verificações posteriores são arquivos novos.
Fontes do gateway, runtime, SDK e arquivos de performance preservados. Sem
instalação, disco, VM, deploy, tradução/OCR, mídia real ou credencial persistida.
Maven/web/mobile/SDD não redatados por tooling ignorado e documentação; statuses,
defaults, migrations e contratos não foram alterados.

Fechamento: 125 links relativos, Prettier dos sete arquivos JS e três
documentos, scanner dos registros privados e diff-check direcionado aprovados.
Diff global conserva o EOF alheio de
`web/landing-page/src/shared/component/PlatformBadge.tsx:44`, não alterado.
Conjunto de paths e bytes dos 419 arquivos auditados do gateway revalidado,
com hash técnico inalterado
`1925cc08e68adbe5a5768f1077f1f25995d8da438f02b7dcdcc45ea233acf82a`.
Não cobre Dockerfile, mobile, tooling ignorado ou admissão de segurança.

| Artefato local preservado                             | SHA-256                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| Receipt `budgeted-import.t0Af3K`                      | `498501f395d5d5cc7284efdf30bedd241ecc97657a11e6ac15bd95881a8e4a7c` |
| Receipt `source-echo.S5Abak`                          | `9f51c31ca746968a568a21f31875c651d68892c7e604287e051597ec31d13f14` |
| Diagnóstico detalhado da origem                       | `7e8d3d02d67637a4426c74c3979b18235f82b6ac4dfd8ae2ab7d54868926bb6f` |
| `budgeted-import.t0Af3K/completion-verification.json` | `9b8e71d5ff8e3465136ff40bdb39a00101d261a5dbb17de91be153cae9b6b0de` |

O manifesto final confere as duas retiradas, 35 fontes/registros e o ledger
compartilhado, sem sobrescrever capturas. Os dois pacotes novos ocupam cerca
de 244 KiB, sem cópia grande; arquivos de performance e caches anteriores não
foram removidos.

Não repetir mais importações para diagnosticar o mesmo eco vazio. Próximo
trabalho: preparar prova independente do conteúdo do disco de dados, em mount
read-only e por inventário/hashes ancorados, mantendo origem/generation como
pendências distintas. Host COS/kernel, bootstrap DNS/TLS, JRE/codec, OOM e
pipeline completo continuam sujeitos aos gates de segurança existentes.
Orçamento financeiro não substitui admissão de segurança nem autoriza instalar
pacotes. Nenhuma dessas provas foi executada aqui; 020 aberta e 021 bloqueada.

Continuação: [preparador mínimo de montagem/conteúdo](worker-isolation-mount-only-preparation-2026-10-14.md)
separa a próxima prova do worker/pull. Preparado e testado localmente, sem usar
outro slot do orçamento ou criar recursos; verificação systemd nativa e execução
COS permanecem pendentes. Este registro conserva as capturas e reservas acima.
