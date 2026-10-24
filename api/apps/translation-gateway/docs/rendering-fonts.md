# Fontes da renderização — plano e recursos verificados

MOB-FEAT-020/TASK-002. Incremento autorizado de 2026-10-03, sem integração ao
worker ou aprovação de legibilidade. Nenhuma chamada OCR/tradução ou upload.

## Plano antes do código

1. Adquirir somente os cinco arquivos oficiais originais, verificando tamanho
   e blob Git contra a árvore da revisão fixa. Registrar SHA-256 sobre os bytes
   recebidos antes de empacotar; não recomprimir, subsetar ou modificar fonte.
2. Empacotar Noto Sans Regular para `en`, `es`, `pt-BR` e Noto Sans CJK JP/KR/SC/TC
   respectivamente para `ja`, `ko`, `zh-Hans`, `zh-Hant`. Preservar as variantes
   chinesas e não selecionar face pelo idioma fonte.
3. Incluir licença SIL OFL 1.1, copyright/atribuição, revisão, versão, tamanho,
   SHA-256 e proveniência. Recursos acompanham o JAR, não fontes do computador.
4. Testes antes do loader Java. Construção explícita lê somente classpath;
   não possui bean, download, registro global de fonte ou fallback do sistema.
5. Validar catálogo integral, bytes/hash e nome físico. A mesma cópia validada
   alimenta `Font.createFont`; trocar o recurso entre hash/leitura não é aceito.
   Coleções imutáveis, exceções e representações sanitizadas.
6. Testar os sete destinos, glyphs/acentos/CJK, nomes, tamanhos e corrupção.
   Texto sem glyph disponível é identificado, não desenhado como tofu nem
   substituído por fonte silenciosa. Sua composição/fallback será TASK-004.

## Origem escolhida

CJK: tag `Sans2.004`, commit
`523d033d6cb47f4a80c58a35753646f5c3608a78`, quatro OTFs Regular da
[distribuição oficial](https://github.com/notofonts/noto-cjk/tree/Sans2.004/Sans/OTF).
Latina: Noto Sans Regular, revisão fixa
`ffebf8c1ee449e544955a7e813c54f9b73848eac` da
[distribuição arquivada oficial](https://github.com/notofonts/noto-fonts/tree/ffebf8c1ee449e544955a7e813c54f9b73848eac/hinted/ttf/NotoSans).

É uma aquisição explícita de recursos de desenvolvimento, não uma requisição
de task ou teste. Builds e testes comuns funcionarão offline com esses recursos;
ausência ou adulteração falha fechado. Glyph disponível não significa qualidade
visual, tipográfica ou linguística aprovada.

## Fronteiras

Nenhuma entidade/tabela/migration, SQLite, manifesto OCR/tradução, contrato
HTTP, infra ou default alterado. Fontes permanecem na infraestrutura; domínio
continua independente de AWT/Spring. TASK-002 também exige distribuição do codec,
e TASK-008 conserva profiling/revisão adequados.

## Parcela entregue

Os cinco arquivos originais, duas licenças exatas e `font-pack.json` estão em
`src/main/resources/rendering/fonts/`. Os binários foram comparados com tamanho
e blob Git publicados nas revisões acima antes de calcular SHA-256. A tabela
completa de pins/atribuição fica no manifesto empacotado, não em paths locais.

`BundledRenderingFonts` confere estrutura, revisões, licenças, tamanho,
SHA-256/blob Git e nome físico. O snapshot validado é o mesmo usado para criar
a fonte. O hash Git é incremental, sem segunda cópia integral do arquivo.
Os testes comprovam glyphs sintéticos nos sete destinos, faces chinesas
distintas, ausência/corrupção e recusa de aliases. Não são revisão tipográfica.
Nenhum resource é baixado durante build/teste/task. Não há bean ou registro
global de fonte. Empacotamento do codec por plataforma continua aberto.
