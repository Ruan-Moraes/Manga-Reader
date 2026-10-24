# Preparação da admissão Spot — 2026-10-20

Parcela posterior ao [protocolo CAS5 de recuperação](worker-isolation-http400-protocol-2026-10-19.md).
Entrega validação de preços e observação de quotas; **não entrega admissão
nativa nem autoriza criação de VM**. A 020 permanece `in-progress/open` e a
021 bloqueada. Sem instalação, imagem nova, upload, chamada OCR/tradução,
deploy, alteração IAM/API ou mudança de quota.

## Preço: fatos e estimativa são coisas diferentes

A tabela da conta foi consultada somente por UI autenticada, por meio do
[atalho do projeto](https://console.cloud.google.com/billing/pricing?project=toonlira-rm).
Foram registrados privadamente sete conjuntos de 16 células, sem identificador
de billing, identidade ou dados de fatura. O hash das linhas lidas pela UI
foi confrontado com o arquivo local; não houve redatação das cotações antigas.

As SKUs Spot de CPU e RAM são distintas das STANDARD anteriores. Ambas aparecem
com `Default` na coluna de modelo de consumo: o novo validador confere também
código, descrição, taxonomia Preemptible, região, unidade e tier. A palavra
`Default` sozinha não identifica o provisioning model. Imagem, disco, storage e
operações preservam suas próprias SKUs/taxonomias e só usam tiers pagos.

O candidato privado `mount-spot-pricing.765DFo` contém parser imutável e cálculo
BigInt de nanos/centavos, sem SDK, rede, reserva ou autoridade de execução.
Exige cobertura da janela inteira de 15 minutos e expiração exclusiva uma hora
após o início conservador da coleta. Esta fotografia expira em
**2026-10-20 17:29:29.813 UTC**; a execução futura precisa de fonte ainda válida.

Para as quantidades conservadoras já planejadas, o cenário derivado foi de
**199 centavos USD**. Preserva duas CPUs completas e 1 GiB por hora, retenção
de discos/imagem por sete dias, archive, operações, margem de rede, 30% de
tributação hipotética e fator 2. **Não é fatura, forma de cobrança shared-core
confirmada, tributo confirmado ou teto garantido.** A admissão continua ausente.
Os [preços Spot podem mudar diariamente](https://docs.cloud.google.com/compute/docs/instances/spot#pricing).

O gate executou **67 casos aprovados**, incluindo os testes anteriores do
parser decimal reutilizado. O RED inicial preserva quatro falhas; uma segunda
evidência RED reproduziu o caso de término do plano exatamente na expiração.
Esse endpoint é recusado, preservando a regra conservadora da admissão antiga.

## Quota: leitura real, sem autorização de capacidade

O candidato `mount-spot-quota.pkJWSz` passou em **28 testes** antes de usar a
identidade existente e pinada. Executou somente dois GETs projetados com
`fields`, para o [projeto](https://docs.cloud.google.com/compute/docs/reference/rest/v1/projects/get)
e a [região](https://docs.cloud.google.com/compute/docs/reference/rest/v1/regions/get).
Ambos retornaram HTTP200 e identidade de recurso correspondente. SDK permaneceu
inalterado; token e resposta bruta não foram gravados. Só ficaram métricas
técnicas selecionadas, limite/uso e metadados sanitizados.

O reader recusa warning de quota, lista ausente/vazia, duplicatas, geografia
divergente, tipos/bytes inválidos e cancelamento. Não faz retry e não adquire
credencial no import. A primeira consolidação parou após os testes por uma
quebra de linha do Prettier; o TAP e fonte anterior foram preservados. O gate
final passou sem mudar guard ou overwrite de evidência. Depois da leitura
real, os mesmos 28 testes passaram novamente, comprovando que entrypoints sem
autorização não alteram registros existentes.

### Ponto que ainda exige investigação

`PREEMPTIBLE_CPUS` veio presente com **limite zero**. Quota padrão disponível
não é autorização automática para fallback. A
[regra oficial](https://docs.cloud.google.com/compute/resource-usage#preemptible-quotas)
condiciona o consumo da quota padrão à inexistência de quota preemptible e de
solicitação anterior. A leitura atual não distingue, sozinha, um zero padrão
de uma situação em que o projeto já usa o regime dedicado.

Logo, não foi declarado que Spot está disponível ou definitivamente proibido.
O **regime de quota continua não confirmado**. Não houve solicitação de aumento,
teste pago para descobrir o comportamento, troca de região, perfil ou fallback
para STANDARD. É necessário esclarecer essa condição antes da criação.

## Recibos sanitizados

| Evidência privada                         | SHA-256                                                            |
| ----------------------------------------- | ------------------------------------------------------------------ |
| Parser/cenário Spot, 67 casos             | `143cddb1210b4ae51f7bbf89e997243408f5fef69f8c3cb411907bb95febd1d6` |
| Observação de preços, arquivo local       | `2be254fd6dc9154c1f6a570f46572ca99f19f0b0a1c8927df56f5e949c5123ef` |
| Linhas extraídas da UI                    | `77646b50d615ab27f5a3e2d7364218122135ae26e6bdffcddd86275e2464221c` |
| Leitor de quota offline, 28 casos         | `912f65f2d4276f979a3f3f2246315f1e21bd13e8025ad70baa6a1b19da33a66b` |
| Resultado dos dois GETs                   | `fab0ee0efd1018df98f5799f1f3183eb695f144b554bf5cbf72994a87279d90a` |
| Auditoria da leitura e reexecução offline | `d15f90b458b214f3072682a35649a9cec3c9da320329245b5d7ca9dd5569abd7` |

Foram revalidados o snapshot técnico de 419 fontes e os recibos anteriores.
O Maven global aprovado com toolchain existente, type-check web e SDD continuam
registrados no incremento anterior, não apresentados como novas execuções
deste módulo puramente local. Nenhum fonte/configuração do produto mudou.
O ledger conserva quatro reservas de USD 5, sem reserva nova ou alegação de
gasto faturado; o teto autorizado USD 100 não é hard cap do Google.

## Próximo trabalho

**Continuação posterior:** a [admissão e integração offline CAS5](worker-isolation-spot-admission-offline-2026-10-20.md)
foram entregues após esta fotografia. O gate local passou, mas a quota real zero
continua sem admissão e esta cotação já expirou. O histórico vazio do Console
foi registrado sem inferir capacidade ou habilitar fallback.

1. Esclarecer o regime de quota sem mudar limites ou criar VM por tentativa.
2. Implementar a admissão vinculada ao perfil/bundle v2, cotação válida,
   billing atualizado e observação de quota suficiente; testar offline.
3. Integrar essa admissão ao runtime CAS5, sem reaproveitar o executor selado
   STANDARD, e validar o grafo completo.
4. Só então produzir review de escopo, renovar leituras necessárias e ausência
   dos três escopos anteriores, reservar novo ID e executar a prova restrita.

Os gates do worker completo, segurança no boot, runtime/memória, renderização,
qualidade e validação operacional permanecem separados da prova de montagem.
