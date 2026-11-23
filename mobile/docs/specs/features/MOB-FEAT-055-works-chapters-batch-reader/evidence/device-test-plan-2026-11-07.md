# MOB-FEAT-055 — roteiro de teste no aparelho

Data: 2026-11-07. Build: APK `release` gerado localmente a partir do workspace
(`mobile/android`, `NODE_PATH=<mobile>/node_modules/.pnpm/node_modules ./gradlew assembleRelease --no-daemon`, JDK 21; sem `NODE_PATH` o bundling do Gradle falha com `Cannot find module '@babel/plugin-transform-react-jsx'`). Sem gateway configurado
(`EXPO_PUBLIC_TRANSLATION_GATEWAY_URL` vazio), nenhuma chamada paga é possível: os
fluxos de tradução param em "processamento indisponível", sem custo.

## Instalação

1. Ativar depuração USB no aparelho e conectar ao Mac.
2. `adb install -r mobile/android/app/build/outputs/apk/release/app-release.apk`
   (`adb` em `~/Library/Android/sdk/platform-tools`).

## Roteiro (marque cada item)

| #   | Critério               | Passos                                                                                                                                | Esperado                                                              |
| --- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 1   | Obras (AC-002)         | Tradução local → Biblioteca → nome → Criar obra                                                                                       | Obra aparece com capa padrão (logo)                                   |
| 2   | Capa                   | "Escolher capa" → imagem; "Usar capa padrão"                                                                                          | Capa troca e volta ao padrão                                          |
| 3   | Editar/excluir obra    | Editar nome; Excluir obra                                                                                                             | Confirmação descreve remoção de capítulos/originais/resultados        |
| 4   | Capítulo (AC-003)      | Obra → Capítulos → nome do novo capítulo → "Preparar páginas…" → importar 3+ imagens → ordenar → idiomas → validar → preparar projeto | Capítulo aparece vinculado na obra, páginas na ordem                  |
| 5   | Capítulos múltiplos    | Repetir (4) com outro nome; renomear e excluir um capítulo                                                                            | Irmãos intactos; ordem coerente                                       |
| 6   | Lote (AC-004/005)      | Após preparar: lista de páginas com seleção; desmarcar uma; "Traduzir N páginas"                                                      | Diálogo de consentimento; sem gateway: aviso de indisponibilidade     |
| 7   | Voltar (AC-008)        | Em cada etapa tocar no botão quadrado de voltar                                                                                       | Volta à etapa anterior sem perder imagens                             |
| 8   | Home                   | Tocar Home em qualquer etapa/biblioteca; durante processamento                                                                        | Vai à raiz; durante processamento pede confirmação                    |
| 9   | Leitor + erro (AC-006) | Abrir capítulo cuja página não tem tradução                                                                                           | Original exibido; ícone discreto no canto superior direito            |
| 10  | Retry                  | Tocar no ícone → consentimento → confirmar                                                                                            | Só essa página é tentada; falha mantém original e avisa               |
| 11  | Zoom (AC-007)          | Pinça em página original e traduzida; arrastar; botão "Restaurar tamanho original"                                                    | Zoom até 4×, pan limitado às bordas, reset volta a 1×                 |
| 12  | Zoom × navegação       | Com zoom, tentar rolar/trocar página                                                                                                  | Conteúdo inerte até restaurar; trocar de página restaura              |
| 13  | Interrupção (AC-009)   | Enviar app para segundo plano durante lote; fechar e reabrir                                                                          | Sem reenvio automático; páginas incertas marcadas "resultado incerto" |
| 14  | Offline                | Modo avião; abrir capítulo já salvo                                                                                                   | Abre offline                                                          |
| 15  | Regressão              | Configurações, leitor de capítulos, importação simples                                                                                | Sem mudanças                                                          |

## Resultado no simulador iOS (iPhone 18 Pro, 2026-11-07)

Não substitui aparelho físico. Verificado: criar obra (capa padrão); fluxo de capítulo
(importar 3 imagens → organizar → idiomas → validar → preparar); aviso de falha de
vínculo com `workId` inválido; painel de lote com 3 páginas selecionáveis e "Traduzir"
desabilitado sem gateway; leitor com pinça, pan e restauração de escala.
Achado e corrigido: com obra de destino, a tela mostrava o projeto antigo como preparado.
Vínculo bem-sucedido verificado depois da correção: o capítulo "Capitulo Real" criado pela
obra apareceu listado como "Abrir Capitulo Real" e o projeto preparado não mostrou aviso
de falha. Não verificado: lote com falhas, marcador de retry no leitor (o leitor só abre
com pelo menos 1 página pronta), acessibilidade nativa e desempenho.

## Gateway real (autorizado pelo Ruan: 1 página), simulador iOS, 2026-11-07

URL do gateway via `EXPO_PUBLIC_TRANSLATION_GATEWAY_URL` (`mobile/.env.local`, ignorado pelo
git); `GET /v2/capabilities` respondeu `enabled: true`. Projeto de 1 página (imagem do mascote,
sem texto): consentimento exibido, "Traduzir 1 página" enviou a página uma única vez, estado
"processando" → "salva", progresso "1 de 1" e "1 de 1 páginas prontas". O leitor abriu a página
com o aviso "Nenhum texto foi identificado nesta página" (esperado: a imagem não tem texto).
Não verificado: tradução de texto real, falha/retry reais e lote com várias páginas.
