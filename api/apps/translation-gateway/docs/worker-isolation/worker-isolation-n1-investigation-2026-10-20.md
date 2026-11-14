# Alternativa N1: metadados e preços — 2026-10-20

Continuação do [plano de perfil compatível](worker-isolation-compatible-profile-plan-2026-10-19.md)
e da [admissão Spot offline](worker-isolation-spot-admission-offline-2026-10-20.md).
A quota Spot continua inconclusiva. Este incremento investiga uma alternativa
STANDARD explícita; **não habilita fallback, não cria VM e não aprova operação**.
A 020 permanece `in-progress/open` e a 021 bloqueada.

## Base documental e limites

A documentação admite [N1 custom com 1 vCPU e 1 GiB](https://docs.cloud.google.com/compute/docs/general-purpose-machines#n1_custom_machine_types).
Isso preserva a memória da prova mount-only, mas muda o perfil de CPU; não é
prova de orçamento do worker completo. A
[restrição a `MIGRATE` de E2 STANDARD](https://docs.cloud.google.com/compute/docs/instances/setting-vm-host-options#limitations)
não foi contornada: o candidato é outro tipo, mantendo `TERMINATE` e restart
desabilitado como requisitos futuros. O
[limite de duração](https://docs.cloud.google.com/compute/docs/instances/limit-vm-runtime)
admite término automático, mas sua aplicação real ainda precisa ser conferida.

Não há mudança de região, RAM cloud/default, gateway, upload público, IAM/API,
tradução, renderer, deploy, termos ou arquivos de performance.

## Dois GETs reais, nenhuma mutação

O candidato privado `mount-n1-profile-read.CyghGx` foi validado em **32 testes**:
22 do reader, oito da identidade e dois de entrypoint. O RED anterior preserva
20 falhas. A aquisição é lazy, usa a identidade/SDK existentes pinados, propósito
`READ_N1_PROFILE:toonlira-rm`, sem login, chave ou configuração nova.

A observação real ocorreu entre **22:40:21.953 e 22:40:23.890 UTC**, com projeção
`fields`, em dois endpoints fixos:

- [zones.get](https://docs.cloud.google.com/compute/docs/reference/rest/v1/zones/get):
  `southamerica-east1-a`, HTTP200, identidade correspondente e estado `UP`;
- [machineTypes.get](https://docs.cloud.google.com/compute/docs/reference/rest/v1/machineTypes/get):
  `custom-1-1024`, HTTP200, 1 vCPU, 1024 MiB, `isSharedCpu=false` explícito.

A zona lista plataformas Intel compatíveis com N1. **Arquitetura não veio no
GET do tipo**: o recibo registra `not-reported`, sem inventar `X86_64`. Isso
precisa ser considerado no futuro preflight junto da imagem/plataforma pinadas.
Receber 200 não garante capacidade física, boot, scheduling ou isolamento.

O reader limita bytes e prazo total, cancela requests pendentes, não lê corpos
de erro nem faz retry. Falha/404 não troca de tipo. Somente campos permitidos
foram persistidos; sem token ou resposta bruta. SDK permaneceu inalterado.
Após a leitura real, os mesmos 32 testes passaram novamente, sem alterar o
recibo nativo ou acessar Google nos testes.

## Preços: observação nova e cenário conservador

Foram recolhidas novamente sete linhas de 16 células da tabela da conta via
[atalho do projeto](https://console.cloud.google.com/billing/pricing?project=toonlira-rm).
CPU e RAM usam as SKUs N1 custom on-demand, não as Spot ou E2:

| Componente              | SKU              | Unidade | Preço de tabela USD observado |
| ----------------------- | ---------------- | ------- | ----------------------------- |
| N1 custom CPU São Paulo | `E4B6-CD20-6438` | vCPU·h  | `0.052689`                    |
| N1 custom RAM São Paulo | `A0B9-8027-D832` | GiB·h   | `0.00706125`                  |

Descrição, taxonomia N1 On Demand, `Default`, região, unidades, tiers, BRL e
conversão USD-per-BRL foram conferidos conjuntamente. A SKU custom já fornece
o preço aplicável: não foi acrescentado um segundo percentual genérico ao
[preço customizado](https://docs.cloud.google.com/compute/docs/machine-resource#custom_machine_types).
Imagem, disco, Storage e operações A/B também foram relidos, incluindo tiers
pagos. As tentativas de pesquisa agrupada não forneceram linhas confiáveis e
foram descartadas; a coleta aceita veio de consultas individuais por SKU.
Nas operações globais, a célula de região vazia foi preservada, sem deslocar
as colunas. O hash das sete linhas no navegador corresponde ao arquivo local.

O candidato privado `mount-n1-pricing.55pGOo` usa cálculo inteiro, cópias
defensivas e perfil candidato `n1-custom-1-1024-mount-v1`. Passou em **67 testes**:
38 N1 e 29 regressões do parser decimal anterior. O RED preserva cinco falhas.
Uma expectativa sintética inicial de 281 centavos foi corrigida para 282 após
conferência aritmética independente e asserts dos componentes; o diagnóstico
foi preservado. Não houve alteração do cálculo para caber no orçamento.

O cenário com **um vCPU e 1 GiB por hora**, retenção conservadora de discos/
imagem por sete dias, archive, operações, margem de rede, tributação hipotética
e fator de segurança resultou em **211 centavos USD**. Não é fatura, limite de
cobrança garantido, tributo confirmado nem admissão financeira.

O início conservador da coleta é **22:40:10.140 UTC** e a cotação expira em
**23:40:10.140 UTC de 2026-10-20**, com extremo exclusivo. A janela futura de
15 minutos deve caber integralmente nesse prazo. Preços anteriores não foram
redatados. Billing, quota e preflight ainda devem ser renovados para execução.

## Recibos sanitizados

| Evidência privada                       | SHA-256                                                            |
| --------------------------------------- | ------------------------------------------------------------------ |
| Reader/identidade/entrypoint, 32 testes | `70082b58b3f6b5798f56918d61b78671680c0d80baea5f3c339d991641c43714` |
| Resultado real dos dois GETs            | `79f1a868b662586095eb32d2b41df152a8d32266aeb1f4d124452575e799dfd5` |
| Reexecução offline posterior            | `120d4b29b6cba293c81dc2f85510bf7b477f96a1055b6ab9ebcc07e836ad13d6` |
| Parser/cenário N1, 67 testes            | `44e847ab344b2c24209e941e33476bf707a992f926ab21e9fa35db90ab6e12fb` |
| Observação nova de preços               | `71e9fdaefca0beb6b1f37f2644f0bd1563499667d42ccfdab87923daa7330b7d` |
| Sete linhas lidas no navegador          | `52892634f671f7535f355f0418d1bb75ab23a70adfedd362a2b155f88493b263` |

Os testes não usam rede/ADC nem alteram cloud. Não reinstalam dependências.
O ledger conserva quatro reservas de USD 5: reserva não é gasto faturado.
Uma consulta local inicial recusou caminho relativo; a repetição com caminho
absoluto canônico confirmou o estado sem escrever no ledger.

## Próximo trabalho e critérios ainda abertos

Preparar um contrato N1 explícito de requests e metadata efetiva, vinculado
ao perfil, bundle e CAS5, sem aceitar o executor STANDARD E2 anterior. Preservar
sem SA/IP público/NAT/PGA, deny-all, retirada de rota, 600 segundos, sem restart
e mount read-only/noexec/nosuid/nodev. Depois, testar grafo, admissão e cleanup,
renovar leituras e ausência dos escopos anteriores antes de qualquer reserva.

A investigação deixa N1 como candidato fundamentado para a prova restrita, não
decisão de produção. Não resolve os gates do worker completo: boot seguro,
runtime/CVEs, memória, renderer, qualidade, retenção e validação operacional.
Nenhuma task da 020 foi encerrada por este incremento.
