# Proposta de verificação privada AMD64 — 2026-11-03

Estado: **preparada localmente, sem autorização para executar a nova rodada**.
A revisão automática rejeitou `cloud_round.py prepare` antes da criação do
processo: a autorização confiável selecionava contenção local, sem nova rodada
cloud. Não houve criação, publicação ou concessão de permissões nessa tentativa.
A autorização histórica e o nome `authorized-round-plan.json` não autorizam
esta execução. É necessária uma nova aprovação explícita do proprietário.

Inventário somente de leitura em 2026-11-03T09:47:26Z encontrou zero recursos
`mob020` nas oito categorias consultadas; IAM do projeto manteve SHA-256
`c4941313cdd4802ea8357ff1ef3f53ba9ad8b1cd1e5436081b29cd67f7945452`.
Recibo local `inventory-20261103T094715Z/summary.json`. Revalidar antes de
qualquer criação; essa consulta não concede autorização.

## Resultado que falta comprovar

Reproduzir a composição volátil da candidata 6 no alvo Linux AMD64/COS125.
As provas locais ARM64, incluindo o encerramento de um processo nativo suspenso,
reinício real do servidor e matriz de 22 renders, não comprovam esse alvo.
O procedimento usa somente imagens sintéticas e providers simulados, sem
chamadas pagas de OCR/tradução ou mídia do usuário.

## Ação concreta proposta

- Projeto `toonlira-rm`, região `southamerica-east1`, zona `southamerica-east1-a`.
- Rodada única `mob020-1102-v5-374bb591`; o nome histórico não indica a versão
  do binário: o pacote atual fixa a candidata 6 pelos hashes abaixo.
- Uma VM `e2-highmem-2` com 16 GiB, COS `cos-125-19216-760-20`, ID
  `2384932116280116826`, disco de boot `pd-standard` de 20 GiB com auto-delete.
- Duração máxima de quatro horas, sem reinício automático, ação `DELETE` no
  limite. Worker com 2 CPUs/8 GiB, espaço de endereçamento de pai e filha de
  3 GiB, 64 PIDs, swap zero, scratch tmpfs de 512 MiB.
- VPC/sub-rede próprias, Private Google Access, sem IP público, ingressos
  permitidos, SSH, IAP, NAT, Cloud SQL ou Cloud Run.
- Uma service account sem chave, somente `roles/artifactregistry.reader` no
  registry dedicado. Nenhum papel no projeto, bucket, signer, permissão Vision
  ou Translation; nenhuma mudança de ADC ou instalação de SDK.
- Registry privado com três imagens necessárias: worker, código do teste e
  PostgreSQL. Nenhuma imagem de usuário ou fixture de página fica no registry.
  Execução exclusivamente por digest publicado e verificado.
- Originais sintéticos gerados no tmpfs do cliente de teste; servidor recebe
  bytes por HTTP/stdin, sem mount de imagens. PostgreSQL conserva apenas os
  metadados necessários à prova de recibos após reinício.
- Coleta limitada de métricas e logs operacionais sanitizados pela saída
  serial; remoção dos recursos da rodada com comprovação de posse/ID e
  inventário final, incluindo disco de boot e comparação do IAM do projeto.

## Artefatos fixados

O pacote local está em
`.local/mob020-volatile-20261101/compute-repro-20261102-1/`.

| Artefato | SHA-256 |
| --- | --- |
| `execution-package.json` | `6a60443c436a32b4e3ae4b897e4221ff1caf6045fec0106917381affd200219f` |
| JAR do gateway | `fb07569a75535dbfa6db8698ad01f762250207cf097bb13954b28fc3aa244386` |
| Imagem worker AMD64 | `5b37fd92b99bb2b5dcc480a65cb2c58dd02dad45941a5dd9ea7e65aa99b17c18` |
| Imagem de código do teste | `0a4882ea45a61a1a2800c65602649808ffecbe1fe7bb9076823e2215cb793199` |
| Imagem PostgreSQL | `e4cb93687b062cd25a0e8f672d85a7708235009d70d31f8a7698d9370092a9c4` |
| Manifesto de codecs AMD64 | `0103ab2d4d789b5244371bbb276550a81a77797c583591b008fdba64f683dae5` |

O pacote registra também hashes das fontes, scripts, startup, pipeline,
catálogo de preços e provas locais. As três imagens somam 1321694274 bytes
antes da compressão, abaixo do limite de 2 GiB. A cópia de revisão do startup
usa digests fictícios, tem 14614 bytes, passou `bash -n` e não deve ser executada.
Os coletores passaram sete testes de integridade, fragmentação, cursor e
isolamento entre rodadas. Esses testes são locais e não validam APIs cloud.

## Limite financeiro proposto

Reserva adicional máxima de **US$ 2,00**. Catálogo oficial consultado em
2026-11-03T09:27:17Z, conservando os SKUs e conversões no pacote:

| Item | Estimativa em USD |
| --- | ---: |
| VM por quatro horas | 0,573970 |
| Disco de 20 GiB por quatro horas | 0,006657 |
| Registry de 2 GiB por seis horas, sem descontar faixa gratuita | 0,001665 |
| Margem de operações | 0,10 |
| Margem de transferência | 0,50 |
| Margem de cobrança tardia | 0,80 |
| Total conservador | 1,982292 |

A unidade mensal desse snapshot corresponde a 721 horas pelo fator de
conversão do catálogo. O histórico estimado de US$ 4,972073643410706 não é
fatura. Com a reserva nova, a estimativa comprometida seria
US$ 6,972073643410706; mantêm-se parada de novos compromissos em US$ 15,
limite global de US$ 20 e reserva de US$ 5 para retirada/cobranças tardias.
Esses valores são estimativas; o limite depende também do acompanhamento e
da retirada de todos os recursos, além do delete automático da VM.

## Execução somente após aprovação

1. Registrar a resposta explícita vinculada ao hash do pacote; não fabricar
   `current-round-human-approval.json` a partir de silêncio ou de “continue”.
2. Atualizar inventário/IAM e comprovar ausência de recursos conflitantes;
   conferir preços, identidade existente do operador e orçamento disponível.
3. Executar `cloud_round.py prepare`, `publish_images.py` e `create_vm.py`,
   conservando os recibos e interrompendo em qualquer admissão recusada.
4. Usar `collect_once.py` em consultas limitadas. Falta de ACK/timeout não
   autoriza repetir criação ou provider. Acompanhar a mesma operação/recurso.
5. Validar terminal, métricas, logs, pressão/OOM do host e todos os casos;
   executar `cloud_round.py cleanup` e o inventário final mesmo em falha.

Falhas e evidências negativas permanecem registradas. O teste não abre gates
públicos nem substitui a verificação nativa do aplicativo, qualidade humana
ou políticas dos fornecedores.
