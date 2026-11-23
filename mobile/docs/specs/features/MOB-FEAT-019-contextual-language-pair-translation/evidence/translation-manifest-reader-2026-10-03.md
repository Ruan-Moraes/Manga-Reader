# Leitura estrita do manifesto de tradução no gateway — 2026-10-03

## Plano anterior ao código

Parcela técnica da TASK-004/007, autorizada pela continuidade da implementação
da 019. O renderer futuro precisa ler o artefato traduzido, não confiar em um
objeto Java ou JSON recebido sem validação. O serviço existente somente codifica
o manifesto; acrescentar leitura limitada, vinculada ao hash e à requisição OCR.

Sem persistência ou schema novo: PostgreSQL V1–V4 conserva metadados, bucket
privado conserva texto efêmero e a leitura é somente em memória. Nenhuma rota,
configuração, manifesto `1.0`, SDK, credencial ou default muda. Não abre o gate
da 020 nem implementa renderer neste incremento.

## Contrato de leitura

- Receber bytes, SHA-256 esperado, requisição derivada do OCR confiável e seu hash.
- Copiar bytes, limitar a 4 MiB, verificar SHA-256 e exigir UTF-8 válido.
- Exigir versão/modelo, job, par e hash OCR corretos; todos os campos conhecidos
  devem estar presentes com seus tipos exatos. Recusar chaves duplicadas,
  documentos concatenados, campos extras e coerção numérica/string.
- Usar reader privado estrito, mesmo quando o mapper global ignora propriedades
  desconhecidas. Não alterar a configuração compartilhada do aplicativo.
- Validar todos os IDs, ordem e textos com o validador de domínio; saída fora de
  ordem física pode ser associada por ID, nunca renumerada arbitrariamente.
- Preservar texto integral, variantes e limites 2×; vazio exige requisição vazia.
- Falha sempre `translation-invalid-response`, sem causa/conteúdo/IDs no erro.

O chamador permanece responsável por adquirir bytes limitados de storage e
fornecer metadados confiáveis. A leitura não inicializa provider, faz retry,
executa rede, grava dados ou altera estado de job.

## Testes planejados

TDD com round-trip, associação por ID, variantes, Unicode/HTML/linhas,
imutabilidade, hashes/contexto divergentes, IDs/ordem/tipos inválidos, JSON
ambíguo, UTF-8 inválido/UTF-16, vazio e excesso. Testar reader contra mapper
permissivo sem modificá-lo. Suítes leves/completas e Maven global offline com
Docker, além de gates mobile/web/documentais.

## Execução e resultados

O teste inicial falhou na compilação pela ausência de `decode`. Após a
implementação, os 26 testes da nova suíte passaram, sem falhas, erros ou skips.
Além do round-trip, a suíte verifica os limites exatos de 4 MiB e 524.288
unidades UTF-16, rejeição de excesso, associação por ID, imutabilidade e erros
sanitizados sem causas ou conteúdo. O mapper compartilhado continua permissivo
no teste; somente o reader privado rejeita dados não conformes.

```bash
# Em api/
./mvnw -o -q -pl apps/translation-gateway -am test \
  -Dtest=TranslationManifestServiceTest -Dsurefire.failIfNoSpecifiedTests=false
./mvnw -o -q -pl apps/translation-gateway -am test \
  -Dtest.excludedGroups=testcontainers
```

Os dois comandos terminaram com exit 0. A execução leve não substitui os
cenários PostgreSQL; a revalidação global com Docker é registrada abaixo
após sua conclusão.

- [Serviço](../../../../../../api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/application/TranslationManifestService.java).
- [Testes](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/application/TranslationManifestServiceTest.java).

## Limites e review

Sem aquisição, persistência, inferência, correção de texto ou geometria. Texto
é preservado integralmente e permanece apenas no artefato/objeto em memória.
O conjunto dos 42 pares serve à validação estrutural do artefato, não habilita
pares operacionais. Fixtures sintéticas não comprovam qualidade de tradução.
TASK-004/007 continuam abertas; 020/021 permanecem bloqueadas nesta fotografia.

## Revalidação integral e snapshot técnico

Maven global `./mvnw -o -q test` com Docker terminou com exit 0 após a leitura
estrita e os testes adicionais de transporte/integração. Gateway: 41 relatórios,
333 testes, zero falhas, erros ou skips; PostgreSQL 17/Flyway V1–V4. Web
`./node_modules/.bin/tsc -b` terminou com exit 0. Os resultados mobile e SDD
finais são registrados na evidência de transporte, após estabilizar os documentos.

Snapshot do gateway, 183 arquivos:
`937f50ceb766ce67ed60015dc6e5e6b3cc17df5a7ba807b6a11ac5d2952b2b69`.
SHA-256 dos caminhos relativos ordenados e conteúdos, separados por NUL,
de `src`, `scripts`, `openapi`, `pom.xml` e `.tf`/`.tfvars.example` diretamente
em `infra/terraform`. Build, documentos e artefatos privados ficam fora.
Esse hash técnico é separado do checksum SDD mobile e não sobrescreve a
fotografia histórica da 018.

Correção da soma inicial: quatro relatórios históricos `*IT` não pertenciam ao
comando padrão executado. A contagem acima considera somente as classes
selecionadas. A execução posterior da V5/ACK tem evidência própria; este hash
continua sendo a fotografia anterior, não o código corrente após ACK.
