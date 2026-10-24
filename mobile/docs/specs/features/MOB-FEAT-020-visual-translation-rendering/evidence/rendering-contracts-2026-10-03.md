# Evidência parcial — contratos da renderização, 2026-10-03

MOB-FEAT-020/TASK-001. Execução autorizada após abertura humana do gate e
019 `verification-pending`. A 020 está `in-progress`; a 021 continua bloqueada.
Esta evidência não demonstra imagem traduzida, qualidade visual ou operação cloud.

## Implementação e método

- Testes de domínio escritos antes dos tipos: compilação vermelha por
  `RenderPort`, `RenderPolicy`, `RenderRequest`, `RenderManifest` e metadados
  ausentes; após implementação, execução verde.
- Testes de serialização escritos antes de `RenderManifestService`: compilação
  vermelha por serviço ausente; após implementação, execução verde.
- Tipos imutáveis sem Spring/Jackson/AWT/SDK no domínio, porta sem adapter/bean,
  vínculo exato entre mídia/OCR/tradução e snapshots defensivos.
- Revisão adicional reproduziu duas janelas de mutação de coleções: texto
  alterado entre validação/cópia e placements extras após consulta do tamanho.
  Regressões vermelhas confirmadas; snapshot profundo antes de validar e limite
  durante consumo corrigiram os casos. Suíte leve/global reexecutadas após a correção.
- Fonte/target, texto HTML como dado, CJK, emoji, espaços e quebras preservados;
  1.024 regiões, limites UTF-16 e ordem original. Geometria inválida falha;
  não é corrigida silenciosamente para passar no contrato.
- Política versionada `clean-box-1.0`: WebP lossless, fonte experimental
  12..48 px/padding 2 px, arquivo até 64 MiB, manifesto até 4 MiB;
  capabilities futuras podem restringir os limites de mídia, nunca ampliá-los.
- JSON final UTF-8 estrito com SHA-256, metadados, hashes de origem e fallback
  textual completo por ID. Encode limitado conta escapes nos bytes e falha
  inteiro; decode rejeita coerções, campos ambíguos e vínculo divergente.
- Nenhuma migration, dependência, fonte, codec, download, credencial,
  provider, imagem privada ou integração com worker adicionada nesta parcela.

Fontes e testes:
[plano/contrato técnico](../../../../../../api/apps/translation-gateway/docs/rendering-contracts.md),
[domínio](../../../../../../api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/domain/rendering),
[porta](../../../../../../api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/application/port/RenderPort.java),
[codec do manifesto](../../../../../../api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/application/RenderManifestService.java),
[testes de contratos](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/domain/rendering/RenderingContractsTest.java),
[testes de serialização](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/application/RenderManifestServiceTest.java).

## Matriz parcial — não é aceite integral

| Critério | Evidência automatizada nesta parcela                                                                | O que permanece sem prova/implementação                                          |
| -------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| AC-001   | cópia defensiva da geometria/texto e rejeição de vínculos inválidos                                 | nenhuma pintura, codec ou diff de pixels executado                               |
| AC-002   | códigos dos sete destinos, texto preservado e política explícita                                    | fontes, glyphs, wrapping, contraste, direção e revisão visual                    |
| AC-003   | overflow mantém texto completo, metadados e IDs na ordem original                                   | decisão de caber/desenho e representação segura reais                            |
| AC-004   | zero regiões exige zero placements/manifesto                                                        | equivalência visual da imagem codificada                                         |
| AC-005   | metadados finais e manifesto com SHA-256/UTF-8/bytes verificados contra o request                   | cálculo/verificação do arquivo WebP, upload, URLs, commit e retenção             |
| AC-006   | contagem/texto/media/bytes limitados; stream de encode para no teto, incluindo expansão por escapes | decode/encode de mídia, memória nativa, isolamento e fault injection do renderer |

## Referência técnica do gateway

201 arquivos; SHA-256:
`4117155959007bf3f003e4e12c92e9f3608d5fe1095b12b807f23663498e6051`.

Mesmo algoritmo reproduzível descrito na
[consolidação anterior](../../MOB-FEAT-019-contextual-language-pair-translation/evidence/translation-consolidation-2026-10-03.md#referência-técnica-reproduzível-do-gateway):
caminhos relativos ordenados de `src`, `scripts`, `openapi`, `pom.xml` e
Terraform `.tf`/`.tfvars.example`, separados dos bytes por NUL. Não inclui
docs/build/modelos/capturas. Executar o comando hoje calcula esta nova fotografia;
o hash histórico da 019 permanece ligado à implementação anterior, sem renovação.
O checksum SDD mobile é separado e registrado nos headers correntes de review/drift.

## Performance e segurança

Sem runtime mobile alterado: MOB-DEC-007 não exige benchmark de aparelho nesta
parcela documental. No Java há limites estáticos e testes, não medição de
latência/memória física. Fonte mínima é parâmetro experimental, não aprovação
de legibilidade. Nenhum conteúdo OCR/tradução é escrito em banco/log; contratos,
exceções, encoded bytes e caminhos têm representações sanitizadas. O manifesto
privado futuro contém texto por requisito de fallback, sem publicação.

## Gates

Comandos já encerrados nesta fotografia, sem credenciais/chamadas Google:

| Comando                                                                                             | Resultado observado                                                                                             |
| --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Testes focados de contratos/serialização                                                            | 79 testes, zero falhas/erros/skips no Maven global                                                              |
| `cd api && ./mvnw -o -q -pl apps/translation-gateway -am test -Dtest.excludedGroups=testcontainers` | exit 0, incluindo transporte gRPC local; repetido após ampliar casos de fronteira                               |
| `cd api && ./mvnw -o -q test`, Docker e loopback autorizados                                        | exit 0; gateway 431 testes/45 classes, zero falhas/erros/skips; cadeia V1–V5 preservada                         |
| Sete arquivos Node `ocr-*.test.mjs`                                                                 | 85 aprovados, zero falhas, um opt-in de fonte não executado                                                     |
| `cd web/toonlira && ./node_modules/.bin/tsc -b`                                                     | exit 0                                                                                                          |
| `cd mobile && pnpm check`/`pnpm specs:check`                                                        | exit 0; cadeia integral, 116 suítes/859 testes, 30 performance/24 SDD/seis FSD; links e classificação aprovados |
| Prettier direcionado e `git diff --check`                                                           | exit 0; revalidação final após registro/rebase documental                                                       |

Os XMLs agregados são somente `*Test`, selecionados pelo Surefire padrão; não
incluem os `*IT` antigos em `target`. O opt-in Node não executado depende de
`OCR_CALIBRATION_FONT`; não comprova a disponibilidade de fontes da 020. A
aprovação dos contratos não substitui o renderer. Defaults e contratos públicos
inalterados.

## Próximo trabalho

TASK-002: fontes licenciadas/versionadas e codec WebP real, comprovando round-trip
lossless inclusive pixels transparentes. TASK-003..006 integram pintura e worker;
TASK-007 acompanha testes/gates, TASK-008 mantém revisão/perfiling adequados.
Não há `READY` de produção, ativação de uploads, chamada paga ou abertura da 021.
