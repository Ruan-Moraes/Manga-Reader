# Composição textual — plano do adapter raster

MOB-FEAT-020/TASK-004, incremento local de 2026-10-03. Não integra worker,
persistência ou estados públicos. Fixtures são sintéticas; nenhum provider.

## Plano antes do código

1. Testes antes do compositor. Usar as fontes físicas do pacote verificado;
   ausência de glyph ou caracteres de controle sem composição segura usa
   fallback completo. Não registrar fontes do sistema ou tratar HTML como markup.
2. Para cada quadrilátero, selecionar deterministicamente uma caixa retangular
   interna dentre quatro cortes verticais simétricos (0, 1/8, 1/4 e 3/8),
   respeitando os spans e padding. Preferir a maior área. Não ampliar região,
   consumir balões/colunas experimentais ou alterar vértices.
3. Usar Java2D TextLayout/LineBreakMeasurer com locale explícito do destino e
   direção horizontal LTR para os sete destinos deste conjunto. Texto vertical
   do original não determina rotação do destino. Quebras declaradas separam
   parágrafos; espaços e caracteres permanecem dados, sem inserir espaços CJK.
   Tabs/controles não suportados não são convertidos silenciosamente.
4. Tentar tamanhos inteiros de 48 até 12 px na política inicial. Validar largura
   incluindo bearings e altura integral antes de desenhar. Centralizar cada
   linha; escolher preto/branco pelo maior contraste com a cor estimada,
   composta sobre branco quando houver transparência. Estes são parâmetros
   iniciais, não aprovação de legibilidade.
5. Desenhar apenas após o texto inteiro caber. Composição usa um raster de uma
   linha e transfere pixels somente dentro do span OCR; antialias de glyph não
   pode alterar pixel externo. Não criar segundo raster de página inteira.
6. Neutralização e texto de cada região seguem ordem OCR, com cores estimadas
   antes de qualquer escrita. Se não couber, marcar overflow/font=0 e usar
   marcador geométrico discreto quando houver espaço, nunca trecho truncado.
   O contrato final existente conserva a tradução completa por ID.

## Aceite e fronteiras

Testar sete destinos, variantes chinesas, CJK sem espaços, quebras, caracteres
inertes, glyph ausente, caixa estreita, mínimo de fonte, sobreposição, região
inclinada, página vazia e interrupção. Conferir pixels externos também após
codec nativo. Revisão visual e profiling permanecem abertos; métricas de font
ou testes com texto conhecido não provam qualidade linguística.

Nenhuma migration, bean, default, imagem privada ou chamada externa. O adapter
de arquivos e a integração transacional serão parcelas seguintes da 020.

## Configuração de teste e execução observada

Java2D deve executar offscreen/headless. Surefire do gateway configura
`java.awt.headless=true`, como o utilitário Java de calibração já fazia.
A primeira execução sem essa propriedade encerrou a JVM macOS com exit 134;
foi repetida explicitamente em headless e depois com a configuração do módulo,
sem omitir testes. Não se atribui esse erro a OCR, tradução ou qualidade da fonte.
O worker Spring não é alterado nem recebe novo bean nesta parcela.
