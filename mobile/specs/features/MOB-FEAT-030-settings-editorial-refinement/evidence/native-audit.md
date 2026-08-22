# Evidência nativa — MOB-FEAT-030

Data: 2026-08-22  
Ambiente: Expo Go, iPhone 17 Simulator, iOS 26.5

## Referência e composição

O estado `#settings` de `design/manga-translation-mobile.html` foi analisado
como referência de hierarquia, superfícies, agrupamento e ritmo editorial. A
implementação manteve as sete rotas reais do aplicativo e descartou os controles
demonstrativos sem contrato funcional.

## Matriz executada

| Estado           | Resultado                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------ |
| Claro, retrato   | header compacto, introdução editorial, cards e linhas alinhados                                        |
| Escuro, retrato  | neutros quentes, accent e separadores preservam contraste e hierarquia                                 |
| Paisagem         | conteúdo centralizado, rolável e sem sobreposição lateral                                              |
| Font scale 200%  | fonte e altura de linha crescem sem recorte; heading editorial substitui o título redundante do header |
| Árvore assistiva | quatro headings de grupo e sete ações com label, status e hint presentes                               |
| Sessão anônima   | itens privados anunciam `Login necessário` sem esconder seus destinos                                  |

Em escala ampliada, a inspeção revelou recorte causado pela composição nativa de
`fontSize` e `lineHeight`. `AppText` passou a aplicar a escala do sistema uma
única vez às duas métricas, preservando a preferência real do usuário. A árvore
assistiva continuou contendo as sete ações e todos os grupos.

## Restauração

Ao final, o simulador foi restaurado para retrato, tema claro, `Tamanhos Maiores`
desativado e slider de texto em 50%.
