# Scan offline do pacote corrigido — 2026-10-12

Complemento da [correção de cleanup](cleanup-owned-objects-2026-10-12.md).
É verificação das imagens novas, não aprovação de segurança, qualidade ou
operação. 020 permanece `in-progress/open`; 021 continua bloqueada.
Sem download, instalação, credencial, provider pago, push ou recurso cloud.

## Alvos e vínculo com os artefatos

JAR: `69a9ae7baaaa285068aabe1ad0b9928d66b0ae5df90aa18e158856072d5d9059`.
Fonte técnica auditada: 419 arquivos,
`1925cc08e68adbe5a5768f1077f1f25995d8da438f02b7dcdcc45ea233acf82a`.

| Alvo   | ID Docker local                                                           | Config exportado identificado pelo scanner                                |
| ------ | ------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| ARM64  | `sha256:db24fa6bf51994837bbd8144177864a67d3ee6f67dca97d0376d4c794f3dc0e9` | `sha256:47a5ac736086e77b4b6d65650d74aca4c2222f831f4c492e324ae19289b866a7` |
| x86_64 | `sha256:94c72a7496b4dbc073412a1fd42b8d9ab984f5e2af107d871831cfb3be3dcc7f` | `sha256:169a38fbcf18f4c6c627f2b228a1e247deef92c25ffe30c6789f48e0ea172ad8` |

Os exports vieram exclusivamente desses IDs. Arquitetura, datas, configuração,
base corrigida e sete camadas conferidas contra os recibos da construção.
Cada blob comprimido e diff ID descomprimido teve hash conferido. O config hash
do export é distinto do ID Docker; `Metadata.ImageID` do scan foi vinculado
explicitamente ao config, não comparado incorretamente com o ID Docker.

| Alvo   | SHA-256 do export                                                  | SHA-256 do scan JSON                                               |
| ------ | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| ARM64  | `584cd67bd674ef50a0fc10eaadf74f84520329ee4cf602767800f01339532178` | `ba0d1b6237ad446aa3dce498093506cfd519e6429d26766d93fba4f79545f8cb` |
| x86_64 | `a1edee08c3e573742d2572a4ae91d6a8c1fa1ad50cb32ca24084eafbf4284bbf` | `8a7411c3c6f05a0eaa2ce511184cac28c3067703e1a70f804420518767c7e81a` |

## Scanner, dados e execução

Trivy 0.75.0 já adquirido na preparação autorizada. Binário conferido por
SHA-256 `32b84c068e11e5381fc85d3fe2e8ac238659ab22524ce1b2b9dfcbd0b1f7331a`;
isso é integridade, não verificação independente de assinatura do binário.

Os bancos existentes foram conferidos por hash e copiados para um cache
exclusivo da rodada, com arquivos/metadata readonly; os originais não foram
modificados. Mesmos hashes antes e depois dos scans:

- OS: `80395a349960522ea33bb01e35ff87d3a59ce9ecff0a1a8793e1383566d1ee29`;
  atualizado em 2026-10-11T13:06:05Z, próximo update 2026-10-12T13:06:05Z.
- Java: `6c1859b93bb33ff808b5b02eb31f1e79b91a521d3aec2af92fdb0368d4abe699`;
  atualizado em 2026-10-10T00:59:51Z, próximo update 2026-10-13T00:59:51Z.

Scans concluídos em 2026-10-12T12:11Z, antes dos dois prazos de update.
Esse fato vale para essa execução: não significa que o cache continuará válido
em uma rodada futura. Expiração bloqueia a ferramenta, sem download automático.
Nenhuma atualização do sistema, banco de vulnerabilidades ou dependência.

Execução equivalente, com caminhos de artefatos locais exclusivos:

```bash
trivy --config scan-config.yaml --cache-dir cache image \
  --input worker.tar --offline-scan --skip-db-update --skip-java-db-update \
  --skip-check-update --skip-vex-repo-update --scanners vuln \
  --ignorefile scan.ignore --format json --output scan.json \
  --no-progress --timeout 3m
```

Config vazia e ignorefile vazio, ambiente sem credenciais/Docker, telemetry
desabilitada. Sem filtro de severidade, `ignore-unfixed`, VEX ou suppressions.
O scanner não recebeu socket Docker e não executou as imagens.

## Resultado observado e limites

| Alvo   | Pacotes OS | Ocorrências OS | Severidade        | Dependências Java identificadas | Ocorrências Java |
| ------ | ---------: | -------------: | ----------------- | ------------------------------: | ---------------: |
| ARM64  |        121 |             18 | 13 MEDIUM / 5 LOW |                             195 |                0 |
| x86_64 |        121 |             18 | 13 MEDIUM / 5 LOW |                             195 |                0 |

Não há CRITICAL/HIGH/UNKNOWN retornados neste snapshot. Os tuples
CVE/pacote/versão instalada/fix/severidade coincidem com o scan anterior das
imagens pré-cleanup, mas estas são execuções novas com identidade conferida,
não reatribuição de scans antigos. Nenhuma ocorrência retornou `FixedVersion`
neste banco; isso não prova inexistência de patch upstream ou sua disponibilidade.
Contagem de ocorrências não é contagem de CVEs únicas nem avaliação de exploração.

JRE e codec instalados manualmente não têm cobertura integral desse scanner.
Não foram feitos scan de secrets/misconfig nem análise de explorabilidade.
Zero ocorrências Java e exit 0 não significam segurança aprovada. Não remover
dependências, suavizar filtros ou conceder waiver para produzir resultado verde.

## Pendências para concluir a 020

- **Segurança/distribuição:** revisão das ocorrências residuais, cobertura do
  JRE/codec, atributos Linux não verificados, assinatura/publicação e distribuição
  operacional. Não há atualização de pacote implicitamente autorizada.
- **Admissão operacional:** o worker local tem guards e provas, mas orçamento
  candidato de 2 CPUs/8 GiB e controles do ambiente alvo não foram admitidos.
  Baseline 1 GiB e modos disabled permanecem. Os
  [limites documentados](rendering-memory-admission.md#limites-da-garantia)
  não garantem reserva atômica contra ancestrais/pressão global.
- **Qualidade:** revisão adequada dos sete destinos, HTML manual e avaliação
  independente; a galeria sintética não é tradução real ou aprovação humana.
- **Operação/integração:** IAM/GCS/Tasks e retenção real no ambiente alvo,
  publicação legal e fluxo mobile completo continuam pendentes. A 021 não é
  implementada para contornar o gate da 020.
- **Gate externo:** `git diff --check` global continua apontando linha vazia
  extra em `PlatformBadge.tsx`; o arquivo externo não foi alterado.

Nenhuma lacuna funcional nova foi confirmada por este scan ou pela leitura
dos guards. Essa conclusão é restrita à inspeção feita, não prova de ausência
de defeitos. Para avançar nas pendências operacionais/externas é necessária
decisão humana e autorização específica, antes de credenciais, custo, recursos
ou envio de arquivos. Não promover a 020 a concluída com base nesta rodada.

## Fechamento local

Recibo final sanitizado, 18 artefatos conferidos:
`6e7fc65c63b770d949ceb99596f2176103d87c65fa853473892a1ca5ecac9a6b`.
`pnpm check` reexecutado integralmente: 116 suítes/892 testes aprovados;
SDD/links/FSD/formatação válidos. Checksum mobile permanece
`43d6fae8dc16997f2e4e032e837dbc22be6b590eee424ee41218423ed03ad065`.
Fonte Java e JAR não mudaram: os gates Java anteriores mantêm datas/escopo,
sem alegar uma nova execução Maven por atualizar esta documentação.

Removidas somente as cinco cópias/cache temporárias da rodada, aproximadamente
3 GB; os bancos originais, metadata/recibos, exports e scans permanecem.
As cópias podem ser recriadas dos originais, sem download; uma nova execução
ainda deve conferir hashes e datas e recusar dados vencidos. Não foi removida
mídia, resultado OCR/render, imagem Docker ou evidência histórica.
