# Diagnóstico estrutural offline

Parcela diagnóstica de TASK-004 / MOB-FEAT-018. Não corrige reconhecimento,
reorganiza colunas ou aprova qualidade vertical. A feature permanece `in-progress`.

## Preparar e executar

Requer Java 23, Node e as dependências Maven já instaladas. Preparação explícita
na pasta `api/`, sem download, Spring, Docker ou serviços Google:

```bash
./mvnw -o -B -pl apps/translation-gateway -am test \
  -Dtest=VisionDiagnosticTest -Dsurefire.failIfNoSpecifiedTests=false
```

Não executar builds Maven simultâneos na mesma árvore `target/`. O comando
abaixo reutiliza o classpath desse teste; se dependências/relatório de teste
estiverem ausentes, falha sem instalar nada. Na raiz do repositório:

```bash
node api/apps/translation-gateway/scripts/ocr-evaluation.mjs diagnose \
  --run-id ja-tokyo-puck-real-20260927-a --analysis-id structure-local-01

node api/apps/translation-gateway/scripts/ocr-evaluation.mjs report \
  --run-id ja-tokyo-puck-real-20260927-a --diagnostic structure-local-01
```

`diagnose` aceita somente rodada e análise. Recusa credenciais, projeto, bucket,
modo, modelo, direção e opt-in pago. Não lê ADC nem cria clients; o helper Java
fica exclusivamente em `src/test`. O subprocesso recebe ambiente allowlisted,
limite de heap de 256 MiB e timeout de 60 segundos. Nenhum cliente Google,
Spring, banco, ONNX ou Maven é iniciado pelo comando diagnóstico.

O helper lê protobuf local (até 4 MiB), reproduz o mapper puro e exige igualdade
exata com o manifesto salvo. Imagem, dimensões, assinatura e hashes são
revalidados por `loadRun`; nenhuma imagem é baixada ou alterada. Rodadas antigas
sem captura bruta íntegra não são aceitas. Capturas simuladas permanecem marcadas
como simulação, nunca OCR real.

## Artefatos privados e segurança

Cada análise reserva atomicamente
`.local/ocr-samples/runs/<run-id>/diagnostics/<analysis-id>/`, ignorado pelo Git:

- `request.json`: hashes de origem, revisão Git/dirty, versões, hash do helper,
  do mapper compilado e do classpath; zero novas chamadas e leituras de credencial;
- `diagnostic.json`: árvore linearizada com posições página/bloco/parágrafo/
  palavra/símbolo, polígonos em pixels e normalizados quando fornecidos,
  símbolos, quebras, confiança e associação estrutural às regiões existentes;
- `result.json`: conclusão do parser e SHA-256 do diagnóstico;
- `report.html`: imagem original, parágrafos e detalhes expansíveis com palavras
  e símbolos; toggles locais não executam JavaScript nem inferência;
- `notes.md`: observações humanas/assistidas separadas, exibidas como texto escapado
  após regenerar o relatório;
- `failure.json`, se necessário: somente erro sanitizado.

JSON limitado a 16 MiB e 100.000 nós; HTML a 64 MiB. Excesso falha sem truncar.
IDs não admitem traversal; diretórios e arquivos simbólicos são recusados. Uma
análise existente/interrompida não é retomada ou sobrescrita: investigar primeiro,
depois escolher outro ID. Nenhuma captura, manifesto, imagem ou relatório OCR
histórico é substituído. Somente o HTML diagnóstico identificado pode ser
regenerado; isso não inicia Java ou provider e revalida os hashes.

Texto e capturas ficam somente nesses arquivos locais, nunca nos logs ou Git.
Falhas do parser não imprimem exceções brutas. O relatório inclui licença/créditos.
Links externos só acessam a rede quando clicados. Não publicar o diretório.

## Como interpretar

Os IDs são relacionados pela posição estrutural usada pelo mapper, não por índice
de array após filtragem nem por igualdade de texto. Parágrafos descartados ficam
explícitos: vazios, geometria inválida ou duplicata exata. Texto repetido em outra
posição não é fundido. Polígonos inválidos/ausentes são inventariados, não inventados.

`wide|tall|square` descreve apenas a proporção do bounding box alinhado aos eixos.
Não confirma idioma, direção, ordem narrativa ou qualidade. A sequência original
de símbolos e quebras é preservada. Confiança proto3 implícita em zero é exposta
como não informada, pois não distingue ausência de zero efetivamente enviado.

Separar nas observações:

1. reconhecimento: caracteres incorretos/ausentes, somente quando verificáveis;
2. segmentação: mistura de colunas, palavras e anotações pequenas;
3. ordem: sequência inadequada dentro/entre parágrafos;
4. revisão humana: leitura histórica, variante, furigana e ambiguidades pendentes.

Reorganização geométrica pode ser plausível sem recuperar texto omitido ou
confundido. Não calcular CER ou aprovar qualidade sem referência humana. O próximo
experimento requer aprovação própria; esta ferramenta não muda worker, manifesto
`1.0`, layout, schema, traduções ou defaults operacionais.

Validação e limitações: [evidência datada](offline-diagnostic-validation-2026-09-27.md).

Experimento posterior, aprovado separadamente:
[agrupamento conservador por colunas](experimental-columns.md). O diagnóstico
continua somente leitura; agrupar exige comando, perfil e diretório próprios.
