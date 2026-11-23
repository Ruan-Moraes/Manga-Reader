# MOB-FEAT-020 — estado atual e continuidade

Data: 2026-11-03, America/Sao_Paulo.
Workspace: `/Users/ruanmoraes/Documents/Projetos/Manga-Reader`.
Natureza: handoff operacional; não é aprovação de execução cloud ou aceite da feature.

## Qual é a etapa agora?

**A implementação técnica e os testes locais estão prontos para continuar a
verificação. A próxima etapa é comprovar o fluxo no aplicativo iOS e executar
a candidata atual no ambiente AMD64 admitido. A 020 ainda não está concluída.**

Há dois impedimentos atuais:

1. O usuário dispõe **somente do simulador iOS deste Mac**. O Device Hub não
   responde ao controle de interface: erro `-10005: timeoutReached` em tentativas
   sucessivas. Não foi possível comprovar o fluxo nativo/offline no app.
2. A nova rodada privada AMD64 está preparada, mas **não foi autorizada**.
   A revisão automática rejeitou a criação antes da execução, porque a
   autorização confiável disponível limitava o trabalho à contenção local.
   O pedido genérico de continuar e este handoff não substituem essa aprovação.

A meta deste chat, “Faz ate feat-020 ficar completa.”, foi marcada `blocked`
após três turnos consecutivos com esses impedimentos. A spec permanece
`in-progress`, com gate `open`; a 021 está `verification-pending`, com gate
`open`. Bloqueio da meta e gate de implementação são estados distintos.

## Instrução para o novo chat

Continue a partir do código e das evidências existentes. Preserve o trabalho
não commitado e não recomece a arquitetura. Leia os contratos atuais antes de
editar. Não declare a feature concluída enquanto suas provas estiverem abertas.

Este documento não autoriza nova infraestrutura, permissões, providers pagos,
deploy, publicação, instalação de componentes do Xcode ou alteração dos dados
do aplicativo. Não crie um recibo de aprovação sem uma resposta humana explícita.
Se a ferramenta de metas for usada, respeite o estado bloqueado da meta anterior;
não tente retomá-la ou encerrá-la alterando arquivos locais.

## Decisão vigente de privacidade

O desenho anterior de armazenamento remoto foi substituído por solicitação
explícita do usuário e aprovação da arquitetura volátil em 2026-11-01:

- Original, raster, OCR, tradução, imagem final e manifesto são processados
  **somente em memória no servidor**, com IPC por pipes limitados.
- O resultado volta na mesma resposta autenticada; não há URL de objeto,
  aquisição posterior, fila de mídia ou ACK de exclusão de conteúdo.
- O aparelho valida os bytes, hashes, dimensões e vínculos, grava em seus
  arquivos privados e SQLite e só então confirma `READY` e abre o leitor.
- Recibos operacionais sem conteúdo e logs sanitizados continuam duráveis.
- Perda da resposta não autoriza retry pago automático. Nova execução exige
  ação explícita, nova tentativa/chave e aviso do possível novo custo.
- Os termos exigem direitos ou autorização do usuário sobre o material, sem
  prometer exoneração das obrigações legais do operador.

Fontes normativas:

- [Arquitetura volátil](volatile-processing-architecture.md).
- [DEC-008](../mobile/docs/decisions/MOB-DEC-008-volatile-processing.md).
- [Spec 020](../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/spec.md).
- [Spec 021](../mobile/docs/specs/features/MOB-FEAT-021-local-translation-result-reader/spec.md).

O handoff de 2026-10-30 e provas de GCS/URLs/ACK descrevem o desenho anterior.
Preserve seu histórico; não restabeleça seus requisitos de conteúdo remoto.

## O que foi implementado e conferido

O gateway usa sessão volátil, entrada/saída binárias limitadas, providers inline,
recibos sanitizados e renderização nativa isolada. O mobile consome a entrega
uma única vez, verifica imagem/manifesto e efetiva o resultado localmente.

Na 021 foram conferidos commit exclusivo de resultado/regiões/READY, resolução
de commit ambíguo, lease contra reconciliação concorrente de arquivos, cancelamento,
retomada local e navegação automática uma vez. Os parsers/downloads do contrato
antigo foram retirados do runtime; fixtures históricas de teste foram preservadas.

A candidata 5 apresentou uma falha real: com filha nativa suspensa por SIGSTOP,
o cliente chegou a 120 segundos sem retorno para um deadline nativo de 90 segundos.
A candidata 6 configura um worker daemon de plataforma para o pipe nativo,
mantendo capacidade única e a posse até término/cleanup. A nova prova real passou
timeout, falha de alocação e recuperação por página seguinte. A causa exata no
scheduler/JDK permanece hipótese; não houve dump para diagnosticá-la definitivamente.
Não converta a rodada negativa da c5 em sucesso retroativo.

Specs, tasks, review, drift e coverage foram atualizados por um agente dedicado
e reconferidos pelo integrador. Não foi encontrada nova divergência de intenção
nas fronteiras examinadas; isso não equivale a uma auditoria universal de I/O/APM.

## Evidências atuais, medidas em 2026-11-03

| Verificação | Resultado e limite |
| --- | --- |
| Backend: `cd api && ./mvnw test` | Exit 0; 2863 testes reportados, 116 skips, zero falhas/erros; 470 XMLs novos. |
| Mobile: `cd mobile && pnpm check` | Exit 0; 128 suites/1016 testes; specs, typecheck, lint, FSD e format passaram. |
| Specs mobile | 67 artefatos normativos; 991 arquivos classificados, 373 de comportamento e 279 de evidência; links válidos. |
| Web: TypeScript e FSD | Passaram; FSD usou `CHOKIDAR_USEPOLLING=1` após EMFILE do watcher. Sem alteração das regras. |
| Pipeline local c6 | HTTP autenticado com 12 OCR/11 traduções simuladas, restart real e matriz nativa de oito cenários/22 renders. |
| Visual c6 | Nove casos; 8699904 pixels conferidos fora das regiões, vazio íntegro e overflow de 4860 caracteres preservado. WebPs idênticos aos da c5 inspecionada. |
| Conteúdo no servidor de teste | Zero arquivos de conteúdo; originais no tmpfs do cliente, enviados ao servidor por HTTP/stdin. Sem mount de imagens no servidor. |
| Recursos locais | Limpeza da rodada `mob020-local-v6-1103-2` confirmada por listas vazias de containers, volumes e redes com esse label. |

Essas execuções são **locais ARM64**, com mídia sintética e providers simulados.
Não comprovam AMD64/COS125, qualidade humana dos providers, execução nativa no
aplicativo ou configuração de proxy/APM em operação pública.

Referências legíveis no repositório:

- [Audit corrente da 020](../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/volatile-candidate-6-completion-audit-2026-11-03.md).
- [Provas e identidade da candidata 6](../api/apps/translation-gateway/docs/volatile-runtime-candidate-6-verification-2026-11-03.md).
- [Review da 020](../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/review.md).
- [Tasks da 021](../mobile/docs/specs/features/MOB-FEAT-021-local-translation-result-reader/tasks.md).

Recibos locais sob `.local/mob020-volatile-20261101/`:

- `root-tests-20261103-7/receipt.json` e relatórios completos.
- `mobile-final-verification-20261103/receipt.json` e logs dos gates.
- `candidate-6-local-verification-20261103/receipt.json`.
- `pipeline-local-20261103-2/output/` e `visual-client-candidate-6-20261103-1/`.
- `goal-blocked-audit-20261103.json`: histórico do bloqueio; o estado efetivo
  da meta é o da ferramenta, que retornou `blocked`.

Checksum mobile registrado:
`8611539a30bd3adc42397066bfa5b2df562185a0d0d5c81b2c382b580091eb13`.
O rebase de checksums alterou somente headers de reviews/audits, com recibo
próprio, preservando seus corpos e verdicts históricos. Revalidar após mudanças.
Arquivos `.local` e `/private/tmp` podem não acompanhar outra cópia do repositório;
se faltarem, registrar a ausência, sem inventar resultados.

## Próximos passos, na ordem das dependências

### 1. Destravar e executar a prova iOS — TASK-005

O simulador enumerado é iPhone 18 Pro, iOS 27.0, UDID
`3681DED3-EDC6-49CB-BD41-F018A590120A`. Há app instalado e processo observado,
mas isso não comprova que o código atual foi executado. Preserve seus dados.

A interface disponível é Device Hub, bundle `com.apple.dt.Devices`, em
`/Applications/Xcode.app/Contents/Applications/DeviceHub.app`.
As tentativas CUA por bundle e caminho terminaram em timeout. Quando a interface
voltar a responder, verificar a candidata atual com fixtures sintéticas:

- recebimento completo, validação e commit privado antes de READY;
- foreground/background, interrupção e restart sem sucesso tardio;
- abertura automática uma vez e retomada sem loop;
- leitura de resultado, original e overflow sem internet/gateway após commit;
- arte-only, mensagens nos três idiomas e acessibilidade prevista pela spec.

**Disponibilidade de simulador não dispensou o requisito de matriz física de
acessibilidade.** Não registrar Jest ou um teste Node como prova nativa/física.
Se a prova física não estiver disponível, manter sua pendência explícita.

Cuidados específicos do ambiente:

- O wrapper `xcrun simctl` pode chamar `xcodebuild -runFirstLaunch` para atualizar
  componentes. Não invocá-lo inadvertidamente nesta condição.
- A enumeração anterior usou somente o binário já instalado em
  `/Library/Developer/PrivateFrameworks/CoreSimulator.framework/Versions/A/Resources/bin/simctl`.
  A versão instalada observada era 1174.9.2; o wrapper esperava 1174.21.
- `xcodebuild -checkFirstLaunchStatus` retornou 69 sem diagnóstico textual;
  isso não identifica sozinho a causa. Não executar instalação, aceite de
  licença, reset, limpeza de dados ou mudança global de confiança como atalho.
- Ações de interface devem usar CUA; não contornar sua indisponibilidade com
  AppleScript ou automação de UI por CLI. Não enfraquecer TLS/origin do app.

### 2. Obter autorização e executar a prova AMD64 — TASK-006

Leia a [proposta concreta da rodada privada](../api/apps/translation-gateway/docs/volatile-private-verification-proposal-2026-11-03.md).
Foi solicitada autorização para reserva adicional de até **US$ 2**, duração
máxima de quatro horas, VM privada, registry dedicado e identidade sem chave
com leitura somente nesse registry. Até este handoff, não houve resposta
explícita aprovando essa nova rodada.

A revisão automática rejeitou `cloud_round.py prepare` **antes de iniciar o
processo**. Não houve criação, upload, concessão de permissões ou retry.
Não contornar a rejeição com outra ferramenta, comando menor ou execução indireta.

O pacote preparado fica em
`.local/mob020-volatile-20261101/compute-repro-20261102-1/`.
Seu `execution-package.json` tem SHA-256
`6a60443c436a32b4e3ae4b897e4221ff1caf6045fec0106917381affd200219f`.
Ele fixa a candidata **6**, apesar do nome histórico da rodada conter `v5`.

O arquivo `authorized-round-plan.json` é uma fotografia antiga: seu nome e
seus artefatos c5 **não autorizam nem identificam a execução atual**. Os scripts
exigem aprovação humana nova vinculada ao hash do pacote. Não fabricar
`current-round-human-approval.json`; ele está ausente.

Somente após aprovação explícita, seguir a proposta: atualizar inventário,
IAM, preços e orçamento; conferir os artefatos; preparar/publicar/criar;
coletar evidência limitada; validar todos os cenários; remover recursos próprios
e comprovar ausência final. Não executar `startup-review-DO-NOT-EXECUTE.sh`:
é uma cópia para revisão com digests fictícios.

Envelope obrigatório: Linux x86_64, COS125/Docker27.5.1/cgroup2, host
`e2-highmem-2` de 16 GiB, worker 2 CPUs/8 GiB, AS pai/filha 3 GiB, PIDs64,
swap0, scratch512 MiB, sem IP público/ingresso/SSH/IAP/NAT/Cloud SQL/Cloud Run.
Sem providers pagos, mídia de usuário, novas chaves, papéis no projeto ou ADC alterado.

Último inventário somente de leitura: **2026-11-03 06:47:26 -03:00**,
zero recursos `mob020` nas oito categorias, IAM do projeto sem alteração.
Recibo `inventory-20261103T094715Z/summary.json`. Esse dado é uma fotografia;
revalidar antes de criar. Histórico estimado US$4,972073643410706, sem fatura;
limite global US$20, parada de novos compromissos em US$15 e reserva de retirada
US$5. A reserva adicional de US$2 está apenas proposta.

### 3. Auditar conclusão — TASK-007

Após as provas obrigatórias, conferir cada AC contra os artefatos atuais,
atualizar tasks/review/drift/coverage e executar os gates apropriados.
Marcar `implemented`/concluir a meta somente se não houver requisito aberto.
Não transferir aceites antigos para a arquitetura nova nem usar a existência
de uma imagem AMD64 como evidência de execução nesse alvo.

## Regras de continuidade

- Ler `AGENTS.md`, guias relevantes de `docs/` e `mobile/README.md`.
- Mobile usa SDD: mudança de intenção exige aprovação antes do código;
  `verification-pending` não significa concluído. Não criar tasks em gate bloqueado.
- Preservar dirty work, registros históricos e evidências negativas. Sem reset,
  clean, exclusão ampla, commit ou reformatação do repositório para “limpar” o estado.
- Não rodar Maven concorrente sobre os mesmos targets nem recompilar classes
  enquanto uma prova nativa estiver usando seus mounts. Guardar logs e IDs.
- Repetir testes quando houver mudança, falha, evidência ausente ou dúvida
  relevante; evitar novas rodadas caras somente para repetir o estado conhecido.
- Não publicar, habilitar gates públicos ou enviar mídia real para obter verde.

## Texto para iniciar o próximo chat

> Continue a MOB-FEAT-020 no workspace atual. Leia primeiro
> `docs/mob-feat-020-handoff-2026-11-03.md` e confira o estado real dos arquivos.
> A arquitetura volátil c6 e os testes locais estão implementados; faltam as
> provas nativas/offline e AMD64 e a auditoria final. Preserve as alterações e
> evidências. Não suponha autorização cloud nem dispense requisitos físicos.
> Avance no que estiver autorizado e mantenha a feature aberta até comprovação.
