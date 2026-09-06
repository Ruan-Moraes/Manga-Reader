# Refinamento do arraste — MOB-FEAT-043

Data: 2026-08-30. Aprovação do plano registrada em `spec.md` antes da implementação.
Estado: `verification-pending` para a matriz de gestos físicos.

## Implementação

- Reconhecedor Pan no container estável da viewport; hit test restrito à imagem,
  ativação de 200 ms e cancelamento ao receber segundo dedo. O gesto deixa de
  depender da montagem da célula original.
- Overlay fora da FlatList, sem ações nem acessibilidade duplicadas. A célula
  original só fica invisível depois do layout do overlay.
- Repouso, arraste, encaixe e cancelamento têm fases explícitas e token por
  sessão. Callbacks antigos, cancelados ou duplicados não repetem persistência.
- Ordem persistida, ordem otimista e apresentação são independentes. O drop
  válido salva uma vez; a apresentação congela os slots até concluir o encaixe.
  O handoff exige callback de animação e confirmação nativa do slot correspondente.
  Um destino fora da viewport dispensa medição de célula não montada depois de
  reconciliar a apresentação; o overlay já está fora da área visível nesse caso.
- Elevação de 120 ms, vizinhos de 160 ms e encaixe/cancelamento de 180 ms com
  `withTiming` e desaceleração cúbica. O acompanhamento do dedo é direto.
- Inserção preserva a ordem relativa dos vizinhos; histerese de 8 dp além das
  fronteiras reduz alternância. Indicador absoluto não muda medidas ou bordas.
- Auto-scroll quadrático em 56 dp, até 480 dp/s, aceleração de 100 ms e parada
  imediata ao sair da faixa, soltar ou cancelar. Atualização ocorre no runtime UI.
- Redução de movimento elimina escala e transições decorativas, preservando
  acompanhamento, indicação e auto-scroll. Resize, background e desmontagem
  invalidam a sessão. Persistência pendente continua bloqueando mutações.
- Sem novas dependências, mudança de versões, banco, API ou barrel público.

## Regressões antes das correções

| Caso                        | Resultado anterior                      | Correção verificada                               |
| --------------------------- | --------------------------------------- | ------------------------------------------------- |
| Fronteiras e auto-scroll    | 3 casos de geometria falharam           | histerese, reversão e velocidade quadrática       |
| Rollback rápido no encaixe  | offset final incorreto: 363 em vez de 0 | retarget animado antes do handoff                 |
| Ref Fabric ainda vazia      | `_measure(null)` produz erro nativo     | não medir antes de existir wrapper nativo         |
| Célula reutilizada na Lista | overlay permanece após animação         | ref local estável e registro explícito no handoff |

Logs de execução locais: `/tmp/mobile-drag-polish-red.log`,
`/tmp/mobile-drag-polish-session-red.log`, `/tmp/mobile-drag-null-ref-red.log` e
`/tmp/mobile-drag-late-ref-red.log`. Não são mocks usados como aprovação nativa.
O último mock reproduz o encaminhamento da referência somente na montagem pelo
AnimatedComponent de Reanimated 4.1; Grade passava e Lista falhava antes da correção.

As regressões cobrem 1/2/4 colunas, última linha incompleta, pequenos movimentos,
reversão, saltos, animação/layout em ordens diferentes, cancelamento, callbacks
obsoletos/duplicados, persistência rápida/lenta, rollback/retry, segundo dedo,
interrupções, preview, ações assistivas e redução de movimento. A coleção de 100
itens exercita auto-scroll com dedo parado e mantém a configuração virtualizada;
o mock não comprova reciclagem nativa fora da janela.

## Verificação no iOS

iPhone 17 Simulator / iOS 26.5, Expo Go, Hermes, Fabric. Os callbacks de produção
foram executados com `runOnUISync` no runtime UI nativo. Isso usa animações,
layout e persistência reais, mas **não percorre o reconhecedor físico**.

Durante a primeira repetição da Lista surgiu um novo abort em `_measure`:

```text
facebook::jsi::JSError: Value is null, expected an Object
_measure (native)
measureNative_Pnpm_measureTs1
useSortableReviewDragTs10
```

Relatório: `Expo Go-2026-08-30-153535.ips`; console:
`/tmp/mobile-drag-polish-ios-console.log`. Na instalação 4.1.7, `measureNative`
rejeita `-1`, mas o ref Fabric ainda não anexado retorna `null`. Nossa integração
agora confere esse wrapper antes de medir. O teste reproduziu o erro antes da correção.

O reteste deixou de abortar, mas expôs a referência não reaplicada na célula da
Lista, que sobrevive ao reorder. O registro explícito da ref já montada corrigiu
esse segundo caso. Após recarga completa, Grade e Lista executaram ida e volta
entre os dois primeiros slots: `phase=0`, `activeIndex=-1`, `overlayReady=false`.
Cancelamento também retornou ao repouso sem alterar a ordem. Após recarregar o
app e reabrir Organizar, a ordem anterior ao diagnóstico continuou persistida.
O passo nativo medido da Lista
foi 137,333 dp. Logs finais: `/tmp/mobile-drag-final-native-smoke.log` e
`/tmp/mobile-drag-polish-ios-final.log`.

Vídeo local do diagnóstico parcial (reversão/cancelamento na Grade e recarga):
`/tmp/mobile-drag-final-native-smoke.mp4` (8,3 MiB), SHA-256
`a498b51ebac28f1ca8212558b9811081f5c87e60971d97d402854dec19618ee2`.
Não registra os ciclos físicos exigidos nem serve como medição de FPS. A gravação
anterior inclui a interrupção da sessão e não é usada como baseline de desempenho.
O console do processo final não contém novo JSError/abort durante esse smoke.

Esses defeitos da integração não estabelecem a causa do abort anterior das
14:49:14 no dispatcher de worklets. A investigação em `ios-crash-analysis.md`
continua aberta; a mitigação de clipping é uma correção independente.

## Gates e limites

- Suíte completa: 87 suítes / 495 testes aprovados, sem snapshots.
- Export Hermes de Android e iOS aprovado em
  `/tmp/mobile-drag-polish-native-export`; log em
  `/tmp/mobile-drag-polish-native-export.log`.
- Uma tentativa adicional de exportar também web falhou na resolução do WASM de
  `expo-sqlite/web`. Essa plataforma não integra o escopo Android/iOS; não se
  alterou configuração ou dependência para contornar a falha.
- Resultado agregado de `pnpm check` registrado no review.
- A ferramenta de gesto do Simulator retornou `noWindowsAvailable` e não oferece
  hold configurável de 200 ms. O atraso contratual não foi reduzido para testar.
- `adb devices -l` não apresentou aparelho. Um runtime Android anunciado no
  Metro, sem acesso físico/ADB, não foi usado para simular aprovação de gestos.
- Não foram concluídos 20 ciclos físicos por modo/sistema, arraste real com 100
  imagens além da janela, comparação de frames perdidos, multitouch físico,
  rotação durante o gesto ou a investigação do terceiro abort antigo.

TASK-010 e TASK-015 permanecem abertas. Testes, export e callbacks nativos não
substituem essa matriz. Não há declaração de ausência de crashes ou saltos em
cenários físicos ainda não executados.
