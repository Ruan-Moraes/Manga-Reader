# Layout experimental — evidência de 2026-09-27

## Decisões e observações locais

Aquisição e instalação receberam confirmação explícita do usuário. Hash e contrato
ONNX verificados. Nenhuma credencial, chamada Vision, upload cloud, deploy ou mudança
mobile/legal. Extensão própria do gateway; `MOB-FEAT-018` continua `in-progress`.

Fonte: `pt-p01-real-20260927-a`, página `pt-ep01-p01`. Nesta execução, OCR foi
**reproduzido de captura anterior**, não reconhecido novamente pelo serviço.

- `layout-20260927-a`: três quadros/duas detecções, mas caixas deslocadas por inversão
  de largura/altura em `orig_target_sizes`. Evidência preservada, não aprovada.
  Contrato do exportador confirmou a causa; nenhuma regra específica da página.
- `layout-20260927-b`: três quadros, dois balões, grupos OCR `[8,9]` e `[4,5]`.
  Primeiro grupo inclui parágrafos de blocos Vision diferentes. Manifesto idêntico,
  etapa `SUCCEEDED`, job `TRANSLATING`; layout `partial` por textos externos aos balões.
- Duração do replay/worker/exportação: 1.403 ms, excluindo startup/modelo.
  Soma dos picos dos pools heap: 194.966.464 bytes; **não** é RSS nem memória nativa.
  Uma chamada ao replay, zero chamadas novas ao Vision, nenhuma limpeza pendente.
- Ordem sugerida inclui rótulos de cenário, sem removê-los para coincidir com a
  sequência narrativa candidata. Não há pontuação corrigida ou texto concatenado.
  Qualidade geral, direções/idiomas adicionais e revisão humana permanecem abertas.

## Validação

```bash
node --test api/apps/translation-gateway/scripts/*.test.mjs
cd api
./mvnw -o -pl apps/translation-gateway -am test -Dtest.excludedGroups=testcontainers
./mvnw -o -pl apps/translation-gateway -am test
./mvnw -o test
```

Testes gRPC inicialmente bloqueados pelo sandbox (socket local); reexecução autorizada
passou. V1–V3 aplicada em PostgreSQL 17, constraints/cascade, rollback, cancelamento,
confirmação perdida, cleanup e independência da falha experimental verificados.
Node e type-check web executados.

### Resultado final dos gates

- `./mvnw -o test`: **BUILD SUCCESS**, todos os módulos, zero failures/errors;
  gateway com 148 testes. A primeira execução encontrou um erro no novo setup
  Mockito de timeout; corrigido e reexecutado integralmente, sem excluir testes.
- A reexecução global aguardou longamente o Docker, que voltou a responder sem
  reinício ou alteração de containers do usuário. Tempo de parede dessa execução
  não serve como medição de performance do pipeline.
- Scripts Node: 29 testes aprovados. Type-check web (`tsc -b`) aprovado.
- SDD: 24 testes de validação aprovados; validação de specs e links mobile aprovada.
- Prettier dos scripts/documentos do gateway alterados e do plano arquitetural:
  aprovado. `git diff --check`: aprovado.
- Links novos válidos; pendências documentais preexistentes descritas abaixo.

Cancelamento nativo foi exercitado explicitamente com `ManualLayoutNativeIT`,
modelo local e raster branco sintético: timeout sanitizado, seguida de execução
nova com opções independentes. Não se trata de uma imagem nova ou chamada Vision.
Regeneração do HTML confirmou hashes inalterados da captura, manifesto, resultado
OCR e layout. A prévia automatizada do HTML foi bloqueada pela política de URLs
do navegador; não foi contornada. O arquivo permanece disponível para abertura manual.

Pendências preexistentes fora desta extensão: `docs/tech-debt.md` já não satisfaz
Prettier no `HEAD` e contém duas referências ao relatório ausente
`audits/2026-07-02-project-audit.md`. Preservadas, sem formatação global ou remoção
de histórico. Os links introduzidos por esta extensão resolvem corretamente.

Checksums SDD mobile não são afetados por mudanças apenas na API/docs raiz.
Nenhum teste sintético equivale à inferência local ou à aprovação humana.
