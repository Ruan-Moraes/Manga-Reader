# Formatos máximos no worker — entrega parcial, 2026-10-08

Parcela de TASK-002/007/008 e AC-001/003/004/005/006. Mantém a decisão humana
de usar libwebp com orçamento total medido. Somente fixtures, harness, testes
e governança foram alterados. 020 `in-progress/open/changes-requested`,
021 `approved/blocked`; nenhuma task aberta foi concluída.

Sem imagem real, download, credencial, rede Google, provider pago, deploy,
schema, runtime mobile ou mudança de configuração cloud/defaults.

## Preparação e integridade

Dois formatos reais de 10.000 × 8.000, exatamente 80 milhões de pixels:

- JPEG RGB sintético, qualidade de aquisição 0,9, gerado em JVM Java isolada.
  A qualidade descreve somente a fixture de entrada; não altera WebP lossless/exact.
  Heap 768 MiB, container 2 GiB, swap zero, uma CPU, 64 PIDs.
- WebP lossless/exact gerado pelo cwebp ARM64 já adquirido/pinado, a partir da
  PNG sintética multicolor anterior, com `-q 100 -m 4 -metadata none`.
  Container de preparação 2 GiB, swap zero, uma CPU, 64 PIDs. A mesma preparação
  ARM64 é usada para ambos os workers, sem executar o CLI ARM64 no x86_64.

Preparação sem rede/pull, root readonly, non-root, sem capabilities/privilégios;
arquivo limitado pelo kernel a 12 MiB, core zero, 64 descritores, espera máxima
de dois minutos. Remove somente seu container/diretório conhecido. A JVM que
supervisiona os testes não aloca o raster completo da fixture JPEG.

Arquivos create-only, assinatura/MIME, dimensões, bytes e hash revalidados antes
de iniciar o worker. Dois testes leves conferem JPEG real RGB, dimensões exatas,
preservação do arquivo existente e recusa de dimensões inválidas antes da
alocação. RED de compilação precedeu o helper e a extensão da fixture.

| Entrada |     Bytes | SHA-256                                                            |
| ------- | --------: | ------------------------------------------------------------------ |
| JPEG    | 6.854.706 | `f0cd20201a8d9e6f69a05ef0bc18c1f49a4672a134cde52813d809db4e535522` |
| WebP    |    24.738 | `07d6f608433046d70748047730c61374557ea86fc0fe8eac37bd0342a31d1d3e` |

## Worker e resultado observado

Mesmo bootstrap/factory/admissão de produção, sem bypass: pai e filha com
teto virtual 3 GiB, cgroup diagnóstico 8 GiB, swap zero, uma CPU, 64 PIDs e
tmpfs 512 MiB. Java 23.0.2+7 Alpine, pacote libwebp 1.6.0 pinado/readonly.
PostgreSQL 17 privado separado do cgroup do worker, storage local, OCR/tradução
falsos, layout disabled; não é medição da operação cloud com SDKs residentes.

Cada formato exige três jobs sequenciais: zero regiões; uma região com
16/32 caracteres fonte/destino e overflow zero; 1.024 regiões com 256/512
caracteres cada. Sucesso exige READY, três etapas SUCCEEDED, hashes do arquivo
e manifesto, IDs/ordem/texto íntegros, original reutilizável preservado,
staging limpo e reentrega sem outra chamada ao provider falso. Não basta HTTP 204.

| Formato/alvo        | Resultado inicial                             | Pico cgroup (bytes) | Duração worker (s) |
| ------------------- | --------------------------------------------- | ------------------: | -----------------: |
| WebP ARM64          | três READY                                    |       2.406.141.952 |             88,818 |
| WebP x86_64 emulado | três READY                                    |       2.643.910.656 |            201,274 |
| JPEG ARM64          | falha no primeiro job, sem resultado aprovado |       2.233.126.912 |             25,175 |
| JPEG x86_64 emulado | falha no primeiro job, sem resultado aprovado |       2.483.924.992 |            146,827 |

Primeiro reactor: seis testes, dois failures JPEG, zero errors/skips; exit 1.
Os dois testes leves e os dois WebP passaram. Seis READY WebP observados;
isso não aprova JPEG ou a matriz extended integral. Todos os counters de
`oom_kill` observados são zero; zero OOM não identifica a causa da falha.

WebP vazio conservou inclusive o hash do arquivo de entrada. Controle pintado
produziu hash `2857eec996bd758450d42f474d2f7706418fe833ab9f1d507214ef90050251ba`,
overflow zero. Limite de texto produziu
`260a8b2b25a78c7c3f585dbc58ae71d47bbe34f41b51dd625e749d57a206cb77`,
com 1.024 fallbacks completos, não evidência de glyphs pintados. Os três hashes
visuais coincidiram entre alvos; manifestos são específicos de cada job.
Comparação de componentes pixel a pixel permanece evidência separada.

## Finding e próximo trabalho

**Finding funcional aberto:** JPEG válido no limite aceito não concluiu o
worker nos dois alvos. Não trocar por fixture mais simples, reduzir dimensão,
qualidade ou limites, nem aumentar caps/defaults para obter green silencioso.
O teste de sucesso permanece exigindo READY e falha até corrigir a causa.

O primeiro probe tinha somente `phase=processing` e tipo de exceção sanitizado.
Foi acrescentada observação test-only de estado do job/etapas e códigos de erro
em allowlist, sem texto, IDs, chave, URI ou exceção bruta. Reprodução diagnóstica
ARM64 terminou exit 1: quatro testes, um failure JPEG, zero errors/skips.
OCR e TRANSLATING estavam SUCCEEDED; RENDERING estava FAILED com `internal-error`
e job FAILED. Pico 2.246.594.560 bytes, 57,482 segundos, zero `oom_kill`.
WebP novamente concluiu três READY com os mesmos hashes visuais, pico
2.431.856.640 bytes e 107,089 segundos. Os dois testes leves passaram de novo;
não são duas novas capacidades ou aprovação do JPEG. Não atribuir o source
diagnóstico à medição anterior ou à execução x86_64, que não foi repetida nele.
Hipótese de insuficiência de recurso dentro da filha não equivale a causa validada;
decode, encode, timeout/cap virtual ainda precisam ser discriminados.

## Reprodução e snapshots

Em `api/`, usar Maven offline/reactor e os pins locais da
[prova de timing](rendering-admitted-timing-2026-10-08.md), sem instalar/puxar
dependências. Seletores:

```text
-Dtest=SyntheticResourceJpegTest,NativeRenderingWorkerLinuxTest#admittedWorkerCompletesMaximumAlternateInputFormats,NativeRenderingWorkerAmd64LinuxTest#admittedAmd64WorkerCompletesMaximumAlternateInputFormats
```

Primeiro source/tests/config auditado: 357 arquivos, SHA-256
`4dc108ea999ea8ec2f06c452284022837820b7d931d76902c2030896cfa3f338`.
Após observabilidade diagnóstica test-only: 357 arquivos, SHA-256
`d4da86db670cc20228787114bf5a735d2ff209c97f7d53152eff7e7da01dcf3b`.
Receita: paths relativos ordenados + NUL + bytes + NUL. JAR de produção
inalterado: `9d0c63570e85fe6ed55f22bd3f5d81c15d9f3284d4c19a67543687d7b8e99131`.
Checksum SDD separado, somente nos headers de review/drift excluídos do hash.

Node: 92 pass, um opt-in não selecionado, zero failures. Web `tsc -b`: exit 0.
Gates padrão e diagnósticos finais serão registrados na [review](../review.md)
após execução terminal. Green padrão com opt-ins não selecionados não apaga
os failures da matriz nativa. Retenção, SDKs/layout, orçamento operacional,
qualidade/revisão humana e distribuição operacional continuam pendentes.
Performance mobile N/A: apenas governança, sem runtime do aplicativo.
