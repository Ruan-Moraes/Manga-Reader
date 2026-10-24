# Controles tipográficos pelo worker

Complemento dos [controles locais](synthetic-calibration.md). O executor separado
admite um bundle íntegro e uma orientação por rodada, sem cadastrar controles
como mangás. JavaScript prepara/verifica os arquivos e compara os símbolos;
Java reutiliza o harness do worker, PostgreSQL 17 temporário e gRPC falso offline.
Não há Python, novo schema, API pública, task ou mudança de defaults.

## Executar localmente

Requisitos: Node 22+, Java 23, Docker local e dependências/imagens técnicas já
disponíveis. Maven é sempre offline (`-o`), sem reinstalação implícita. A imagem
de PostgreSQL deve estar disponível antes de executar. Não há download de mídia.

Na raiz do repositório, após preparar o bundle:

```bash
node api/apps/translation-gateway/scripts/ocr-calibration-evaluation.mjs run \
  --calibration ja-kanji-java-20260927-b --orientation horizontal \
  --run-id horizontal-offline-01 --mode offline

node api/apps/translation-gateway/scripts/ocr-calibration-evaluation.mjs run \
  --calibration ja-kanji-java-20260927-b --orientation vertical \
  --run-id vertical-offline-01 --mode offline

node api/apps/translation-gateway/scripts/ocr-calibration-evaluation.mjs report \
  --calibration ja-kanji-java-20260927-b --run-id vertical-offline-01
```

IDs já usados são recusados. O caminho é sempre
`.local/ocr-samples/calibration/<bundle>/runs/<run-id>/`; não há opção para imagem
arbitrária, `--sample`, retomada, substituição ou injeção de resposta pela CLI.
A fonte não é carregada nem as imagens re-renderizadas neste fluxo.

O leitor admite as receitas congeladas `kanji-grid-1` e `kanji-grid-wide-1`, com
revisão consistente no manifesto/referência e centros esperados na admissão Java.
Não há parâmetros de espaçamento no comando `run`: eles pertencem ao bundle
verificado antes da reserva. A [variante de espaçamento](synthetic-calibration.md#variante-experimental-de-espaçamento)
não modifica os controles ou capturas antigos.

## Proveniência e isolamento

`imageOrigin=synthetic-control` permanece verdadeiro mesmo em futura captura real.
`responseOrigin=simulated` indica retorno do gRPC falso; `vision-capture` identifica
captura real validada. São eixos diferentes: imagem sintética não significa
automaticamente resposta simulada. Rodadas offline mostram permanentemente
**SIMULAÇÃO — não reconheceu o texto da imagem**.

A fixture do harness é independente da referência e retorna uma frase fictícia,
com símbolo sem geometria; não é um OCR dos glifos. É esperado que a comparação
aponte sequência divergente e referência não coberta. Um teste unitário positivo
construído da referência valida somente o comparador, não reconhecimento.

O Node valida bundle, pixels, referência e hashes antes de reservar a rodada.
O Java revalida o vínculo de arquivos, idioma, orientação, dimensões e metadados;
o harness inspeciona bytes/MIME/hash/dimensões antes do storage ou provider.
O banco é Testcontainers, nunca uma URL de banco compartilhado. O worker processa
uma cópia; o original e a referência não são removidos. `ja → pt-BR` é apenas o
par técnico exigido pelo schema; nenhuma tradução ocorre.

Reserva exclusiva no Node e `invocation.lock` create-only no Java impedem reuso.
O modo offline reentrega a mesma task para verificar ausência de segunda chamada.
Não altera o comportamento de retry do adapter nem abre um servidor público.
Variáveis cloud/JVM herdadas são removidas antes de iniciar o harness.

## Artefatos

- `request.json`: bundle/orientação, hashes da imagem, referência e manifesto do
  bundle; modo, versões, Git/árvore suja e hash do tooling nas rodadas atuais.
  Esse hash agrega os scripts de calibração e as classes Java de admissão/entrada;
  não é uma assinatura do repositório ou de todas as dependências.
- `invocation.lock`: início durável, sem retomada automática.
- `vision-response.pb`, `manifest.json`, `result.json`: captura, manifesto OCR
  original e estados/hashes exportados pelo harness existente.
- `diagnostic.json`: símbolos e propriedades do protobuf, extraídos pelo parser
  puro existente somente após replay do mapper corresponder ao manifesto.
- `comparison.json`: medidas, símbolos na sequência recebida, proveniência e
  hashes das entradas, sem inferência de idioma ou qualidade geral.
- `report.html`: referência e caixas recebidas, texto, quebras e medidas.
- `notes.md`: espaço de observações; não reescrito pela regeneração.

Resultados exigem `OCR=SUCCEEDED`, job `TRANSLATING`, manifesto e captura íntegros.
HTTP 204 sozinho não basta. O diagnóstico é ligado por hash ao resultado, que
também registra hash da request e da referência. São verificações de integridade
local, não assinaturas contra adulteração coordenada de todos os metadados.

`report` só usa Node/arquivos e refaz a comparação pura; não inicia Java, Docker,
ADC, inferência ou provider, nem reescreve `comparison.json` ou capturas.
Resultado ausente aparece como interrompido. Cadeia de captura inválida não gera
medidas ou texto confiável. Se o bundle/referência mudar, a operação é recusada.
Arquivos incompletos permanecem para diagnóstico, sem tentativa automática.

## Interpretação da comparação

Página única e dimensões iguais às verificadas; até 256 símbolos, 64 pontos de
código por símbolo neste controle pequeno. Limites excedidos falham sem truncar.
Esses limites são da calibração, não uma mudança no contrato de OCR do produto.

Associação por IoU poligonal ≥ 0,5, mutuamente única, sem usar texto para decidir
posição. Geometria ausente, normalizada ou inválida fica explícita, sem inventar
caixas. O limiar continua experimental: uma caixa do provider maior que os pixels
de tinta pode não corresponder; isso não prova erro textual.

Sequência exata, texto nas posições associadas, ordem e quebras são medidas
separadas. Preservar todos os símbolos, inclusive os de parágrafos filtrados pelo
mapper. Não eliminar repetições, inserir espaços, reorganizar, corrigir ou traduzir.
Quebras `SPACE`, `SURE_SPACE`, `EOL_SURE_SPACE`, `HYPHEN`, `LINE_BREAK`, desconhecidas
e prefixos permanecem distintas. Não converter automaticamente uma em outra.

Sem CER, nota geral, aprovação automática de japonês ou cobertura das 18 amostras
reais. Mesmo igualdade perfeita destes controles não aprova mangá histórico.

## Gate real separado

O caminho `--mode vision` exige os mesmos projeto, bucket privado US, credencial
impersonada explícita e `--confirm-paid-call` do [executor manual](manual-test.md).
A confirmação deve ser obtida antes de usar credenciais, preflight ou upload.
Não executar agora com base no aceite da implementação local.

Após autorização específica, usar os mesmos argumentos de bundle/orientação,
com novo ID e os parâmetros cloud documentados. Uma imagem por rodada, deadline
de 60 segundos, retries OCR desabilitados, sem fallback para simulação. Não criar
recursos, habilitar uploads ou usar a ADC pessoal. Não registrar o caminho ADC,
tokens ou resposta bruta nos logs. Recuperação de objetos segue exclusivamente
o diário da rodada descrito no executor manual; nunca limpar o bucket inteiro.

## Testes

```bash
node --test api/apps/translation-gateway/scripts/ocr-calibration-evaluation.test.mjs
cd api
./mvnw -o -B -pl apps/translation-gateway -am test \
  -Dtest=CalibrationAdmissionTest,CalibrationWorkerTest \
  -Dsurefire.failIfNoSpecifiedTests=false
```

`ManualCalibrationEvaluationIT` só é selecionado explicitamente pela CLI, não
pela suíte padrão. Testes automatizados usam fixtures, nunca credenciais reais.
Registro: [evidência de integração](calibration-worker-validation-2026-09-27.md).
As [primeiras observações reais](calibration-real-observation-2026-09-27.md)
registram horizontal completo e uma omissão no vertical, sem aprovação geral.
