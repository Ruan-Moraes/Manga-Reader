# Evidência — ilustrações de estado (MOB-FEAT-057/AC-013)

- Data: 2026-11-08
- Origem: `~/Toonlira-Design-System/project/assets/illustrations/` (decisão D9).
- Processo: redimensionadas para 600 × 600 px com `sips -Z 600` (exibição máxima de 200 pt em 3×)
  e codificadas em WebP com `cwebp -q 86 -alpha_q 100 -m 6`, preservando a transparência.
- `pensando` reaproveita `assets/images/mascot-pensando.png`, que já existia no app.
- `zangada` não entrou: nenhum estado a usa.

| Ilustração           | Arquivo no app                     | Original (bytes) | No app (bytes) | Redução | SHA-256                                                            |
| -------------------- | ---------------------------------- | ---------------: | -------------: | ------: | ------------------------------------------------------------------ |
| triste (erro)        | `assets/images/mascot-triste.webp` |        1 436 146 |         48 528 |   29,6× | `9b176d85126c93fadfcaebaef771b9af41a505423d3299f3e87476b30bc7c289` |
| duvida (sem conexão) | `assets/images/mascot-duvida.webp` |        2 732 445 |         43 246 |   63,2× | `ca2e5c58186fde74f01beef26eea1f1ad46bc61a307c3e180088a87c2de5d0d7` |
| 404 (não encontrada) | `assets/images/mascot-404.webp`    |        2 416 326 |         46 668 |   51,8× | `4adc721a5f0eafd62507251ca63d333c0ed100d016b484a80549b654dc625f9e` |

Limite registrado para AC-013: nenhum arquivo novo acima de 64 KB. Todos ficaram abaixo.

Verificação visual: a versão de 600 px de `triste` foi inspecionada antes da codificação
(transparência e traço preservados). A conferência das três no aparelho fica para TASK-016.
