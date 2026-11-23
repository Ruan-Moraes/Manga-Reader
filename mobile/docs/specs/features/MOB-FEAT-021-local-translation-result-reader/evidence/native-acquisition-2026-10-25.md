# Aquisição nativa e leitura offline — 2026-10-25

## Escopo e autorização

Revisão humana da 021 aprovada em 2026-10-25; dependências 019/026/027/051
em verificação admitidas pelo AGENTS.md corrente. Sem migration, nova VM ou
nova chamada paga de OCR/tradução. 020 permanece em andamento.

Uma página sintética própria em inglês, processada anteriormente com respostas
reais Vision/Translation e renderer real por replay, foi adquirida pelo código
mobile de produção em iPhone 18 Pro **simulado**, iOS 27.0, Hermes/Expo nativos.
Harness privado substituiu consulta/ACK e identidade por respostas controladas,
mas os dois downloads usaram HTTPS real do Cloud Storage, sem token de gateway.
Não equivale a um gateway público integrado ou a dispositivo físico.
O harness configurou GestureHandlerRootView e carregou a fonte oficial Ionicons
localmente para reproduzir os providers/recursos do app; entrada normal preservada.

## Resultado observado

| Verificação                | Resultado                                                         |
| -------------------------- | ----------------------------------------------------------------- |
| Manifesto HTTPS            | 200, application/json, 1.007 bytes                                |
| Imagem HTTPS               | 200, image/webp, 18.460 bytes, 900×600                            |
| Publicação local           | REMOTE, 1 região, SQLite v9, zero violações de FK                 |
| FK na conexão exclusiva    | 1, habilitada antes de BEGIN                                      |
| Primeiro claim de abertura | true                                                              |
| Reinícios locais           | zero downloads, claim false, mesmo SHA-256                        |
| Leitor                     | texto português legível, sem overlay DEMO                         |
| Original                   | inglês legível por Ver original; Ver resultado restaura português |
| Erros visuais finais       | nenhuma sobreposição de erro após configurar fontes do harness    |

Primeiro commit/claim observado às 11:16:20.703Z; reaberturas verificadas após
retirada remota, incluindo 11:31:58.537Z. A rede do computador permaneceu ativa
para Metro; o harness recusava gateway/download e o resultado veio do diretório
privado. Esta é prova offline dos dados, não um build release sem Metro.

SHA-256 WebP: `f1105ab88129704acfc3d8168a2120f30cd254f09c4ccee36d658108445a10b3`.
SHA-256 manifesto: `909ad504695001d1d6ee35bee8837e79bd4afb8fa8702eb98c898f9331813586`.
Texto: “Olá! Consigo ler esta página. Vamos começar nossa aventura.”

## Retirada e custo

As duas gerações temporárias foram removidas; zero objetos vivos próprios.
O bucket preexistente conserva soft delete de sete dias: purga física prevista
em 2026-11-01T11:19:36.199Z e 11:19:40.301Z, sem alterar a retenção.
As VMs da rodada anterior já estavam retiradas; nenhuma foi criada nesta etapa.
A reserva conservadora da rodada (compute/auxiliares, provider e artefatos)
foi US$ 3,25796, dentro de US$ 5; reserva total US$ 73,25796 dentro de US$ 100.
Estimativa/reserva não comprova faturamento efetivo nem constitui hard cap.
Identificadores, URLs, recibos e screenshots ficam exclusivamente na área privada
ignorada do Git; nenhum segredo entrou no código ou no app.

## Pendências explícitas

Usuário decidiu continuar sem Android em 2026-10-25. TASK-009/AC-008 continuam
com verificação física Android aberta. Acessibilidade física, build release sem
Metro e execução única cloud→providers→gateway→app não foram comprovados.
Os testes automatizados de parser, transação, polling, falhas, abertura única,
reader/overflow e arte-only trilíngue são evidência complementar, não substitutos
da matriz física. Ver [review histórico](pre-volatile-review-2026-11-01.md) e [tasks históricas](pre-volatile-tasks-2026-11-01.md).
