# JPEG máximo, espaço virtual e política 1.1 — 2026-10-08

Parcela de TASK-002/007/008 e AC-001..006. Corrige a falha técnica registrada
na [matriz anterior](rendering-maximum-formats-2026-10-08.md), sem substituir
o JPEG, reduzir pixels/qualidade, elevar caps ou alterar cloud. Testes locais
sintéticos; OCR/tradução falsos. 020 in-progress/open, verdict changes-requested,
021 approved/blocked e tasks abertas preservados. Não é aprovação de operação.

## Diagnóstico reproduzido

JPEG RGB real de 10.000 × 8.000, 6.854.706 bytes, SHA-256
`f0cd20201a8d9e6f69a05ef0bc18c1f49a4672a134cde52813d809db4e535522`.
Mesma fixture/assinatura/dimensões nos controles. O worker anterior confirmou
OCR/TRANSLATING SUCCEEDED e RENDERING FAILED/internal-error. Probe independente
com os limites da filha separou guard/fontes/decode/pintura/encode/verificação.
Decode concluiu; o erro estava no encode, não na assinatura da mídia.

O adapter agora conserva somente uma categoria nativa fixa e interna:
ALLOCATION, BITSTREAM_ALLOCATION ou OTHER. Códigos 1/2 seguem o enum do header
oficial libwebp 1.6.0 já adquirido; valores desconhecidos ficam OTHER. Mensagem,
causa, toString e código público continuam sanitizados e iguais. Não serializa
texto, path, URI, ID ou diagnóstico bruto. Dois testes leves precederam essa
classificação; os testes ordinários não inventam uma razão nativa ausente.

| Controle local           | AS                | Heap    | Resultado         | Pico cgroup (bytes) |
| ------------------------ | ----------------- | ------- | ----------------- | ------------------: |
| ARM64, método 4          | 3 GiB             | 256 MiB | encode/ALLOCATION |       1.953.837.056 |
| ARM64, método 4          | 4 GiB diagnóstico | 256 MiB | pixels exatos     |       2.754.146.304 |
| ARM64, método 4          | 3 GiB             | 64 MiB  | pixels exatos     |       2.621.952.000 |
| ARM64, método 4          | 3 GiB             | 128 MiB | pixels exatos     |       2.813.796.352 |
| x86_64 emulado, método 4 | 3 GiB             | 64 MiB  | encode/ALLOCATION |       1.961.938.944 |
| x86_64 emulado, método 4 | 3 GiB             | 128 MiB | encode/ALLOCATION |       1.982.279.680 |

Zero oom_kill nos controles observados. Falha de alocação não é OOM de cgroup:
AS inclui reservas/mapeamentos, não apenas memória residente. Antes do encode,
VmSize do controle 128 MiB era 820.789.248 bytes em ARM64 e 1.252.495.360 no
x86_64 emulado. A comparação de 4 GiB era explicitamente diagnóstica: não alterou
limites do worker. Controles ARM64 preservaram pixels e hash visual legado
`830f2d541cb3038ebe81b1bb1de5db2913d7aab727bc4c15b1977e0327b441b4`.

Reduzir a reserva Java para 128 MiB resolveu o worker ARM64, mas não o x86_64:
primeira regressão completa, 19 testes/um failure. Não foi aprovada pelo sucesso
parcial. AS de 3 GiB, cgroup diagnóstico 8 GiB, swap zero, 64 PIDs, uma CPU,
tmpfs 512 MiB e deadlines permaneceram iguais.

## Correção versionada, sem perda visual

Experimento separado avaliou método 0 mantendo lossless=1, exact=1, quality=100,
os limites de bytes e a mesma superfície ARGB. Passou em ambos os alvos:
todos os pixels após decode coincidiram com o raster anterior ao encode.
Saída 1.523.108 bytes, hash
`59d836302cba3639acd0139c1452affcdec1abe29fc99352f2097a80e0251952`.
Picos individuais 1.323.458.560/1.460.543.488 bytes em ARM64/x86_64 emulado.
Esses valores não são SLA, distribuição estatística ou garantia operacional.

A [API oficial](https://developers.google.com/speed/webp/docs/api) distingue
esforço de compressão de perdas de pixels no modo lossless. Não usar a opção
`low_memory` como falsa solução para lossless: a
[documentação cwebp](https://developers.google.com/speed/webp/docs/cwebp) a limita
à codificação lossy. A evidência visual aqui vem do round-trip, não só do nome
de um parâmetro.

RenderPolicy passa a produzir `clean-box-1.1`: mesma geometria, fontes, padding,
limites, encoding e formato de manifesto; método de compressão 0. Política
legada `clean-box-1.0` conserva método 4. Sem fallback automático após erro ou
nova tentativa de provider. Java FFM e CLI selecionam o mesmo método pela versão,
nunca por ID da amostra. O construtor experimental de override foi removido;
teste de interface exige somente o construtor original de cinco parâmetros.

O bean nativo admite heap 64..128 MiB, default 128; valores maiores falham no
bootstrap, sem coerção silenciosa. Campos Java e YAML ficam alinhados/testados.
Modo continua disabled, gateway/worker cloud false e Terraform 1 GiB inalterado.

## Persistência — plano anterior à integração

Conforme database-design, PostgreSQL continua somente metadados, bucket privado
para imagem/manifesto. `(job_id, stage)` permanece PK/determinante dos estados,
timestamps, chaves e hashes, em BCNF. policyVersion continua no JSON efêmero,
sem coluna, texto/região no banco ou jsonb novo. Mesmas FKs cascade, CHECKs,
unicidades e índices; nenhuma consulta, contador ou cache novo. Nenhuma migration:
V1–V7 preservadas. Modelo do manifesto 1.0, task jobRef e `/v1` não mudam.

## Regressões observadas

Depois de versionar a política: foco com 19 testes, zero failures/errors/skips.
Doze READY em quatro workers frios — três por formato/alvo — com SQL/storage/
renderer/fontes reais e providers falsos. Cada sucesso exige três etapas
SUCCEEDED, arquivo e manifesto recuperados/hash, texto/IDs/ordem íntegros,
original reutilizável intacto, staging limpo e reentrega sem outra chamada.
Controle pintado exige overflow zero e imagem diferente do vazio; limites
textuais preservam 1.024 fallbacks completos, sem truncamento.

| Worker/política 1.1 | Pico cgroup (bytes) | Duração (s) |
| ------------------- | ------------------: | ----------: |
| JPEG ARM64          |       1.696.153.600 |      26,413 |
| JPEG x86_64 emulado |       1.948.852.224 |     106,890 |
| WebP ARM64          |       1.613.242.368 |      19,692 |
| WebP x86_64 emulado |       1.885.638.656 |      76,484 |

Hashes de cada saída coincidiram entre alvos. Manifestos são específicos de cada
job; política 1.1 não reatribui a si medições/hashes da 1.0. Página JPEG vazia
também teve round-trip exato no probe. A matriz ampliada separa comparação
independente de alpha/RGB invisível, scripts, dimensões e falhas controladas;
seus resultados terminais ficam na [review](../review.md), sem transferir
aprovação de uma fase para outra.

## Reprodução e snapshots

Em `api/`, Maven offline/reactor e os pins da
[prova de timing](rendering-admitted-timing-2026-10-08.md). Novos seletores:
NativeRenderResourceTest#maximumJpegCompletesWithProductionChildLimitsAndReportsItsPhase,
RenderingConfigurationTest, RenderCodecNativeFailureTest, RenderingContractsTest
e os métodos admittedWorkerCompletesMaximumAlternateInputFormats dos dois alvos.
Para controles explícitos, usar os métodos de AS/heap/experimental desse probe;
eles não são admissão do worker ou de orçamento maior.

Receita técnica: paths relativos ordenados + NUL + bytes + NUL, separada de SDD.
Snapshots não são intercambiáveis:

- Probe de fases anterior à razão nativa: 357/c123461d…5ef7, JAR 9d0c6357…9131.
- Razão ALLOCATION: 358/313fee24…13f2, JAR cc15e194…327e.
- Primeiro worker com heap 128/método 4: 358/a430ab60…967f, JAR 25e88567…c259.
- Experimento método 0 ainda não ativo: 358/bf69df1d…7736, JAR 36351ab3…2570.
- Foco da política 1.1: 358 arquivos,
  `1f22ddad2fe28807d6868d14939ab8c73c873a0abb9558387059d598072ad100`,
  JAR `9498d055c6b02021537d127ac4bf50738c284d0a8f21a29338305960a6da7d24`.
- Matriz ampliada recompilou observabilidade/asserts/compatibilidade legada:
  `508c647f3714c68ac0483687331bd160b5432445b4a849437d42708ac661b2da`,
  mesmo JAR. Não atribuir o foco anterior a esse source novo.

Gates finais e matriz ampliada são registrados na review somente após execução
terminal. Evidência/task/mapa estabilizam antes do checksum SDD; headers de
review/drift não renovam verdicts históricos. Continuação: SDKs/layout residentes,
retenção integral, qualidade independente e operação ainda pendentes. Nenhuma
credencial, mídia real, provider pago, deploy, tradução real ou runtime mobile.
Performance mobile N/A.
