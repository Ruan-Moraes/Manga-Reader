# Controles tipográficos sintéticos — avaliação local

Preparar duas imagens com a mesma sequência conhecida, em posição horizontal e
vertical, para separar reconhecimento, geometria, quebras e ordem. Não executar
OCR, baixar fontes, ler ADC ou enviar arquivos. Este utilitário não altera o
worker, o catálogo real, o manifesto OCR ou os defaults desabilitados.

## Referência e limites

Receita `kanji-grid-1`: 16 ideogramas CJK compartilhados, organizados em dois grupos
de oito. Não é uma frase nem uma referência linguística independente de japonês.
Sem pontuação, furigana, rotação, balões, textura ou degradação histórica.

- PNG RGB, 1.200 × 1.200, preto sobre branco; fonte de 84 pixels, células de 112.
- Horizontal: esquerda → direita, primeira linha antes da segunda.
- Vertical: cima → baixo, coluna direita antes da esquerda, glifos em pé.
- Mesmo raster de cada glifo nas duas imagens; muda somente sua posição.
- Quebra declarada após o oitavo caractere; nenhum espaço introduzido.
- Receita congelada antes da renderização, com texto, IDs, ordem e células.
  Referências acrescentam quadriláteros dos pixels de tinta e hashes dos glifos.

A fonte física carregada com `Font.createFonts` é verificada por `canDisplay` e
pelos IDs dos glifos; fonte incompleta, formato incompatível ou face inexistente
são rejeitados. Não há fallback silencioso. Fonte local
é identificada por nome, face, família, versão do renderer e SHA-256; seu arquivo
não é copiado. Uso local não constitui autorização de redistribuição da fonte.

## Comandos

Na raiz do repositório, usar Node.js 22+ e JDK 17+ já instalados, além de uma fonte
local com cobertura dos caracteres. Java2D renderiza em modo headless; JavaScript
cuida dos arquivos, PNGs, comparação e relatório. Somente bibliotecas padrão,
sem Python, Pillow, Maven ou instalação automática. Substituir os caminhos abaixo
pelos existentes na máquina; os comandos não fazem reconhecimento.

```bash
node api/apps/translation-gateway/scripts/ocr-calibration.mjs prepare \
  --id ja-kanji-java-20260927-a \
  --font '/caminho/local/fonte.ttc' --font-index 0

node api/apps/translation-gateway/scripts/ocr-calibration.mjs report \
  --id ja-kanji-java-20260927-a

OCR_CALIBRATION_FONT='/caminho/local/fonte.ttc' node --test \
  api/apps/translation-gateway/scripts/ocr-calibration.test.mjs
```

O teste de renderização exige a variável de fonte; sem ela, esse teste fica
explicitamente ignorado. A primeira execução registrada usou Hiragino Sans W3,
face 0, já instalada no macOS, sem download ou redistribuição.

### Variante experimental de espaçamento

`prepare --recipe kanji-grid-wide-1` admite somente uma segunda receita congelada.
O default continua `kanji-grid-1`. Na variante, os centros das colunas verticais
passam de x=710/490 para x=768/432: distância de 220 para 336 pixels, centro
conjunto em x=600. Nenhuma mudança de sequência, fonte, tamanho, coordenadas
verticais ou ordem. O controle horizontal permanece idêntico.

```bash
node api/apps/translation-gateway/scripts/ocr-calibration.mjs prepare \
  --id ja-kanji-wide-01 --recipe kanji-grid-wide-1 \
  --font '/caminho/local/fonte.ttc' --font-index 0
```

Usar a mesma fonte física/face e verificar igualdade dos hashes das máscaras dos
16 glifos contra o bundle original antes de comparar OCR. A nova receita usa ID
exclusivo, nunca altera imagens ou referências anteriores. Receitas desconhecidas
e mistura entre manifesto, referência e posições são rejeitadas. Não há opções
livres de coordenadas nem ajuste específico de um caractere. A admissão Java do
harness também confere revisão e centros; a verificação Node mantém os checks
integrais de pixels, máscaras e hashes para ambas as receitas.

A preparação é local. Envio e custo são um gate distinto: repetir o controle
original e só então avaliar a variante, conforme escopo autorizado. Este recurso
não normaliza imagens de mangá nem corrige o OCR. Ver
[experimento limitado](spacing-experiment-2026-09-27.md).

`CalibrationGlyphRenderer.java` é executado diretamente pelo source launcher do
JDK, com fonte limitada a 32 MiB no stdin, saída limitada a 1 MiB e timeout de
30 segundos. Não faz parte do artefato Spring Boot. Não carrega ADC ou clients.
`report` não inicia Java, não carrega a fonte e funciona somente com Node.js.

A implementação anterior em Python foi removida. Seus controles e evidências
históricas permanecem intactos e verificáveis pelo leitor JS. Java2D pode produzir
pixels diferentes de Pillow: cada nova preparação usa ID exclusivo e registra
versão Java, Node e hashes dos dois sources. Não sobrescrever o bundle anterior
nem alegar igualdade binária entre renderers distintos. A receita continua igual.

## Artefatos e recuperação

Cada ID reserva atomicamente um diretório exclusivo em
`.local/ocr-samples/calibration/<id>/`, ignorado pelo Git. Não usar `samples.json`.
Contém receita, texto fonte, dois PNGs, duas referências JSON, testes simulados,
manifesto de execução e relatório HTML com sobreposições numeradas. PNGs limpos
não contêm números de anotação. Nenhum texto vem das capturas reais anteriores.

O manifesto registra hashes, versões, data, revisão Git e árvore suja, além de
`providerStatus=not-executed`. Fontes e credenciais não entram no diretório.
ID existente bloqueia nova preparação; falha conserva a reserva e erro sanitizado.
Inspecionar a falha antes de decidir outra execução com novo ID; não há retomada
automática nem remoção de diretórios anteriores.

`report` verifica hashes, dimensões, pixels e referências antes de regenerar
somente o HTML. Não carrega a fonte, re-renderiza imagens ou executa comparação.
Arquivos adulterados, symlinks ou caminhos inválidos são rejeitados. A comparação
de hashes é verificação de integridade local, não assinatura de autenticidade.

## Comparador testado, não benchmark executado

O comparador aceita **somente saída fabricada** com `origin=synthetic-test`.
Associa símbolos por IoU dos quadriláteros ≥ 0,5, com correspondência mutuamente
única. Ausência, duplicação e ambiguidade permanecem explícitas; texto não decide
a associação. Igualdade de sequência, texto por posição, ordem e quebras são
registradas separadamente. Nenhum CER, nota de qualidade ou aprovação geral.

Saída perfeita construída da referência testa apenas o caso básico do comparador;
casos negativos alteram caracteres, geometria, quebras, quantidade e ordem.
Esses resultados nunca são apresentados como retorno Vision.

O executor do catálogo de mangás não admite estes controles. A integração usa
agora um [executor de calibração separado](calibration-worker.md), com referências
congeladas, captura preservada e comparação offline. O comparador de fixtures
acima continua restrito a saída fabricada; o novo leitor vincula captura e
proveniência antes de aplicar as medidas compartilhadas. Execução real exige
autorização específica para credenciais/envio/custo; não foi feita neste marco.

Este suporte local de TASK-004 não encerra TASK-004/005 ou MOB-FEAT-018
(`in-progress`). A insuficiência da experiência anterior e a revisão competente
de japonês histórico continuam abertas. Não pedir ao usuário sem domínio do idioma
que aprove qualidade linguística. Ver [evidência](synthetic-calibration-validation-2026-09-27.md).
Migração de runtime: [evidência JS/Java](synthetic-calibration-js-java-2026-09-27.md).
