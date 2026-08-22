# Auditoria nativa — MOB-FEAT-031

- Ambiente: Expo Go, Simulator iPhone 17, iOS 26.5.
- Data: 2026-08-22.
- Superfícies verificadas: aparência, leitor e sheet de qualidade.
- Matriz exercitada: retrato, paisagem, tema claro, tema escuro e escala
  confortável de texto (200%).

## Resultado

- Cards preservam rótulo, descrição, ícone, borda e seleção em retrato e
  paisagem; opções longas da direção do leitor permanecem integralmente visíveis.
- Segmentos mantêm valor selecionado textual e visual sem depender somente de cor.
- Sheet contém título, fechamento acessível e radios; fechar restaura a tela e o
  valor selecionado.
- Slider aparece como `adjustable` com valor, incremento e decremento; steppers
  anunciam ações e limites desabilitados; booleanos aparecem como switches.
- Rotação preserva a posição lógica do formulário. Em 200%, o conteúdo continua
  rolável e nenhuma ação essencial fica sobreposta ou inacessível.
- Tema escuro preserva contraste, bordas, seleção e legibilidade.
- Preferências temporariamente alteradas durante a auditoria foram restauradas
  para tema do sistema, texto padrão e orientação retrato.

## Ajuste originado pela auditoria

O primeiro passe revelou compressão dos cards percentuais e ocultação de rótulos
longos. A composição foi corrigida para coluna explícita quando empilhada e grid
com `flexBasis`, `minWidth: 0` e superfície interna; a segunda inspeção confirmou
o reflow correto.
