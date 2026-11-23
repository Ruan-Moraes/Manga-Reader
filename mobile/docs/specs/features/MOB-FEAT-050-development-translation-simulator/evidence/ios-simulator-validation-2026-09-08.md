# Evidência — fluxo demo no iOS Simulator

- Data: 2026-09-08
- Ambiente: Expo Go, iPhone 17, iOS 26.5
- Sessão: guest, projeto local com 6 imagens

## Cenário validado

1. O projeto persistido abriu diretamente em `Revisar` (`5/5`), sem retornar à
   primeira etapa.
2. `Gerar resultado de demonstração` concluiu a substituição idempotente dos
   resultados e abriu a rota dinâmica do leitor sem exigir login.
3. O leitor exibiu o badge `RESULTADO SIMULADO`, a imagem da página 1 e a região
   com texto demonstrativo.
4. A navegação avançou para a página 2 e persistiu a posição `1` (índice zero).
5. A ação `Ver original` alternou para `Ver resultado`.
6. Após recarregar o aplicativo, a biblioteca indicou `Continuar na página 2
de 6` e o leitor reabriu diretamente nessa página.

## Integridade observada

- Projeto: `READY`.
- Resultados: 6; regiões: 6; vértices: 24.
- `PRAGMA foreign_key_check`: nenhuma violação.
- O reparo de inicialização removeu 6 filhos órfãos legados de
  `local_media_import_items` sem afetar os originais do projeto.

## Critérios cobertos

- `MOB-FEAT-050/AC-002`: resultado demonstrativo e identificação visível.
- `MOB-FEAT-050/AC-003`: reexecução e persistência child-first íntegras.
- `MOB-FEAT-050/AC-004`: fluxo pt-BR e controles acessíveis no Simulator.
- `MOB-FEAT-026/AC-001`: leitor local, alternância e navegação.
- `MOB-FEAT-026/AC-002`: progresso persistido na segunda página.
- `MOB-FEAT-026/AC-003`: abertura guest sem redirecionamento ao login.
- `MOB-FEAT-027/AC-002`: recuperação determinística do órfão legado.
- `MOB-FEAT-027/AC-003`: integridade referencial após geração e reexecução.
