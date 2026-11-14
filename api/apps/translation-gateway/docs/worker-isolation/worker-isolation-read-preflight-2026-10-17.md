# Pré-flight de leitura da prova mínima — 2026-10-17

## Escopo e autorização

Continuação dos [leitores HTTP](worker-isolation-http-readers-2026-10-17.md).
Usada a autorização continuada de preparação com a identidade existente; não
houve nova instalação, login, grant, habilitação de API, envio de arquivos,
chamada de provider ou recurso criado. A autorização final de ativação continua
separada. Arquivos de performance, runtime, migrations e defaults preservados.

Tooling/recibos privados em
`.local/worker-isolation/mount-read-preflight.kgsuJO/`, ignorados pelo Git.
`inspect.mjs --authorized-read-only` fez seis GETs e um POST de diagnóstico IAM.
O argumento é uma barreira local contra execução acidental, não autorização
humana por si só. Intent registrado antes das credenciais, saída sanitizada e
arquivos exclusivos; não sobrescreve nem repete a execução automaticamente.

## Fatos observados

Consulta autenticada em 17/10, 12:01:48–12:01:54 UTC:

| Verificação         | Resultado observado                                                                                 | Limite da evidência                                                                                             |
| ------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Identidade/SDK      | Mesma conta pelo hash fixado; TLS sem override; manifests do SDK inalterados                        | Token somente em memória; não é prova de acesso a cada recurso futuro                                           |
| Projeto             | `toonlira-rm`, `ACTIVE`, número Resource Manager correspondente                                     | ID numérico do Compute validado separadamente, sem confundir os dois IDs                                        |
| Metadata de projeto | Sem itens no momento da consulta                                                                    | Será reconferida antes de criar recursos; não é garantia permanente                                             |
| COS fixado          | `cos-125-19216-739-5`, ID `3332869554998116417`, `READY`, X86_64, 10 GiB, sem estado de depreciação | Não aprova segurança nativa nem equivale a boot executado                                                       |
| Máquina             | `e2-micro`, 1.024 MiB, 2 vCPUs compartilhadas na zona candidata                                     | Perfil da prova mínima de montagem, não capacidade do renderer completo                                         |
| APIs                | Compute e Storage `ENABLED`                                                                         | Nenhuma API habilitada por este script                                                                          |
| IAM de observação   | As 13 permissões consultadas retornaram no teste do projeto; nenhuma ausente                        | Subconjunto de leitura, não IAM completo de criação/cleanup, nem teste das políticas de bucket/recursos futuros |

O POST foi exclusivamente
[projects.testIamPermissions](https://docs.cloud.google.com/resource-manager/reference/rest/v1/projects/testIamPermissions):
consulta de permissões do chamador, não mudança de política. A lista fixa contém
leituras de projeto, rede, instância, serial, imagens, discos, subnetworks e
firewalls, além de listagem de rotas, routers e packet mirroring. Inclui as
permissões específicas de
[firewall efetivo da rede](https://docs.cloud.google.com/compute/docs/reference/rest/v1/networks/getEffectiveFirewalls),
[firewall efetivo da instância](https://docs.cloud.google.com/compute/docs/reference/rest/v1/instances/getEffectiveFirewalls),
[routers agregados](https://docs.cloud.google.com/compute/docs/reference/rest/v1/routers/aggregatedList)
e [packet mirroring agregado](https://docs.cloud.google.com/compute/docs/reference/rest/v1/packetMirrorings/aggregatedList).
Não foram criadas rede/VM para conferir essas respostas específicas: só o teste
IAM foi executado para elas. Um retorno positivo não substitui os guards reais.

## Probe e proteção local

`createPermissionProbe` é lazy e de uso único, com credential/fetch injetados e
sem ADC implícita. URL, método e corpo são fixos; não oferece mutador, retry,
fallback ou troca de identidade. Rejeita redirects e respostas inesperadas,
incluindo permissões extras/duplicadas. Resposta omitida/vazia concede zero
permissões no relatório. Nunca retorna `allowed=true`; mantém
`operationalApproved=false` e `resourceAccessProven=false` mesmo com 13/13.

Prazo de dez segundos, resposta até 64 KiB, coleções imutáveis e erros
sanitizados. Abort/close impedem envio tardio após resolver credenciais e uma
segunda leitura; dependência injetada que ignore abort não abre fila/retry.
Testes sintéticos cobrem esses casos, tokens inválidos, excesso de bytes, JSON/
UTF-8 inválidos, 403/429/503, falha de transporte e mutação das dependências.
O teste não instala SDK, busca ADC ou consulta Google.

## Integridade e pendências

| Artefato privado  | SHA-256                                                            |
| ----------------- | ------------------------------------------------------------------ |
| `preflight.json`  | `4062cd65f4ec53756856a74f313eb6575ae6972fdcbf3627f5a4a642e2fcdfb1` |
| `permissions.mjs` | `921b154dcf73ce1991b3ec4d41b1f8ff29a7bd53888d4057cfe21bb9036b8e17` |
| `inspect.mjs`     | `ea0e94554ccf4b864f05b046137a4b37740cbd6659bc1ab60a3487c1fd0b327d` |

O recibo conserva datas, decisões, hashes e observações, sem token, identidade
pessoal completa, número privado do projeto ou resposta REST bruta. O probe
registra somente nomes de permissões e hash da resposta. Estes fatos são reais;
os ensaios de lifecycle/serial anteriores continuam simulados.

Não houve reserva nova no teto total de US$ 5 nem confirmação de faturamento.
Cotação completa, revisão COS, staging/geração real, IAM de criação/retirada,
admissão operacional e autorização final permanecem pendentes. Nenhum sucesso
de consulta libera o executor ou comprova isolamento do worker completo.
020 continua `in-progress/open`; 021 bloqueada.

## Fechamento local

625 testes Node aprovados (49 arquivos), zero falhas, cancelamentos ou casos
ignorados, incluindo os 11 testes novos do probe. Executados sem Google nos
testes; não confundir com as sete consultas autenticadas separadas acima.
Os diagnósticos intermitentes anteriores permanecem registrados e não foram
considerados resolvidos por esta rodada posterior aprovada.

Conferidos 155 links relativos, sintaxe JavaScript, formatação dirigida e diff
dos quatro documentos. Recibos/fontes anteriores pinados e as duas reservas do
ledger intactos. Os 419 paths/bytes técnicos do gateway continuam com SHA-256
`1925cc08e68adbe5a5768f1077f1f25995d8da438f02b7dcdcc45ea233acf82a`;
essa fotografia não cobre Dockerfile, mobile, docs, tooling privado ou aprovação
operacional. Maven/web/mobile/SDD não reexecutados ou redatados nesta parcela.

Recibo privado `verification.json`:
`6994746e3205bdb55a523ecc8e57a69f8811b13decd1be98eef9f0219a9b50bc`.
Diff global continua com linha vazia no EOF de
`web/landing-page/src/shared/component/PlatformBadge.tsx:44`; arquivo alheio
preservado. O fechamento documental foi acrescido depois do recibo, com nova
conferência dirigida de formatação/diff, sem sobrescrever evidências.
