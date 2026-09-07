# Evidência — auditoria nativa de configurações

Data: 2026-08-22  
Ambiente: iOS Simulator, aplicação Expo nativa

## Matriz executada

| Variação                   | Superfícies verificadas            | Resultado                                    |
| -------------------------- | ---------------------------------- | -------------------------------------------- |
| tema claro                 | índice, aparência e leitor         | pass                                         |
| tema escuro                | aparência e leitor                 | pass                                         |
| alto contraste             | aparência                          | pass; borda e seleção não dependem só de cor |
| densidade confortável      | aparência e leitor                 | pass                                         |
| densidade compacta         | aparência                          | pass                                         |
| retrato                    | aparência e leitor                 | pass                                         |
| paisagem                   | aparência                          | pass; conteúdo centralizado e rolável        |
| font scale próximo de 200% | aparência e leitor                 | pass após reflow adaptativo                  |
| largura compacta           | segmentos, cards, switches e ações | pass                                         |

## Achados e correções

- Os segmentos inicialmente perdiam separação visual e aproximavam labels em
  espaço restrito. A primitiva passou a empilhar alternativas em largura
  compacta ou fonte ampliada, mantendo estado selecionado e semântica de radio.
- Cards de leitura em duas colunas ficaram estreitos com fonte próxima de 200%.
  `ChoiceCards` passou a usar uma coluna nessa condição.
- A seleção ganhou superfície de accent, borda e estado assistivo; o check só é
  exibido quando o layout empilhado oferece espaço seguro.
- Toda a linha de uma preferência booleana passou a aceitar toque, mantendo o
  `Switch` nativo como único elemento assistivo e com foco visível.
- Selects, cards, segmentos e slider tiveram foco visual confirmado. Valores e
  estados permaneceram anunciados na árvore assistiva.
- O botão voltar reutilizável permaneceu no topo esquerdo das sete subtelas e a
  navegação retornou ao índice pelo mesmo contrato.

## Estado final do ambiente

Tema claro, densidade confortável, escala padrão, alto contraste desativado e
orientação retrato foram restaurados após a auditoria.

Critérios cobertos: AC-002, AC-003, AC-006 e AC-007.
