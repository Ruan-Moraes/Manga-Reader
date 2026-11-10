# MOB-FEAT-020 — plano de continuidade e handoff

Data: 2026-10-30, America/Sao_Paulo.
Natureza: **plano para outro agente; não é evidência de implementação nem aceite**.
Workspace: `/Users/ruanmoraes/Documents/Projetos/Manga-Reader`.

## Instrução para o agente destinatário

Continue a MOB-FEAT-020 neste workspace, preservando as alterações existentes.
Leia este documento e as fontes indicadas antes de editar código. Faça a análise
de viabilidade, reproduza divergências e implemente somente correções justificadas
pelos requisitos aprovados. Progrida nos trabalhos independentes possíveis.
Conclua a feature somente se todos os critérios forem comprovados. Se a garantia
exigida continuar inviável, entregue o bloqueio demonstrado e o trabalho válido
concluído, mantendo a feature aberta.

Este handoff **não autoriza alterar requisitos, publicar a feature, habilitar
uploads/providers ou ampliar permissões**. O pedido é continuar a implementação
sob o contrato existente. Uma proposta de arquitetura não equivale à sua aprovação
operacional nem à comprovação de que atende ao prazo.

## 1. Estado confirmado e decisões que devem ser preservadas

| Item | Estado da última validação |
| --- | --- |
| MOB-FEAT-020 | `in-progress`, `implementation_gate: open`, 7/8 tasks concluídas |
| TASK-006 / AC-005 | Aberta: retenção absoluta e I/O não cooperativo |
| TASK-008 / AC-006 | Concluída no ambiente Compute expressamente admitido |
| Review | `changes-requested` |
| MOB-FEAT-021 | `implemented`; preservar implementação e requisitos |
| Recursos cloud da rodada | Todos retirados; ausência novamente confirmada em 2026-10-30T17:24:55Z |
| Custo acumulado | Estimativa conservadora de US$ 4,98; sem confirmação por fatura |

Decisões humanas já recebidas:

- **“Admitir somente nesse ambiente verificado”**: orçamento do worker de
  2 CPUs/8 GiB exclusivamente no Compute privado verificado, host
  `e2-highmem-2` de 16 GiB, swap zero, PIDs 64, AS pai/filha 3 GiB e scratch
  512 MiB. Isso não admite Cloud Run, baseline de 1 GiB ou outro ambiente.
- **“Manter requisito atual e bloqueio no GCS”**: preserva a exigência de
  exclusão confirmada em até uma hora, inclusive em falha do storage. A proposta
  de autorização expirada com exclusão posterior foi recusada. Não reaplicá-la.

A meta do chat anterior foi marcada `blocked` após a repetição do mesmo bloqueio.
Isso não significa feature concluída, não muda o gate SDD e não autoriza novas
execuções sem hipótese capaz de resolver a pendência. Se houver mecanismo de
metas no novo chat, respeite seu ciclo de vida; não marque a meta anterior como
concluída e não tente retomá-la por alteração de arquivos locais.

## 2. Leituras e fontes de verdade

Leia o `AGENTS.md` aplicável e os guias normativos antes de trabalhar na área:

- [Arquitetura](architecture.md), [testes](testing.md),
  [clean code](clean-code.md) e [política de documentação](documentation-policy.md).
- [README mobile](../mobile/README.md), instruções locais e skills SDD aplicáveis
  antes de editar o pacote de specs. Confira as regras atuais de status e review.
- [Spec 020](../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/spec.md),
  [tasks](../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/tasks.md),
  [review](../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/review.md)
  e [drift](../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/drift-audit.md).
- Specs 017/018/019 e seus disclosures: confira no registry os caminhos atuais;
  o limite de retenção também atravessa essas features. Preserve a 021.
- [Bloqueio e decisão humana](../api/apps/translation-gateway/docs/retention-deadline-feasibility-2026-10-30.md).
- [Evidência consolidada atual](../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/deadline-restart-android-2026-10-30.md).
- [Validação cloud anterior e hora real](../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/cloud-priority-validation-2026-10-30.md).
- [Recuperação de snapshots](../api/apps/translation-gateway/docs/rendering-snapshot-recovery.md),
  [supervisão de render](../api/apps/translation-gateway/docs/rendering-call-deadline.md),
  [retenção original](../api/apps/translation-gateway/docs/original-retention.md),
  [fila durável](../api/apps/translation-gateway/docs/lifecycle-retention.md)
  e [ACK](../api/apps/translation-gateway/docs/result-acknowledgement.md).

Há entradas históricas que dizem que TASK-008 ou 021 estavam abertas/bloqueadas.
Preserve essas fotografias; use o estado mais recente, datado e fundamentado.
Arquivos `.local` ajudam a reproduzir, mas podem não acompanhar uma cópia do repo.
Se faltarem, registre a ausência; não invente resultados nem copie credenciais.

## 3. Problemas restantes e limites já conhecidos

### 3.1 Retenção remota absoluta

O contrato preservado exige ausência confirmada de todas as gerações autorizadas
via API até o deadline aplicável, limitado a uma hora. Original, saídas e
manifestos têm ciclos de vida próprios; confira suas âncoras nas specs e no código.
Replay, restart e retentativa não renovam os deadlines. O original deve continuar
disponível até render/terminal dentro desse limite.

Na observação real de 3.600 segundos, seis gerações ainda estavam presentes no
deadline; a ausência foi confirmada **966 ms depois**. A prova chamou o adapter
diretamente e não comprovou o scheduler de produção. A manutenção declarada a
cada cinco minutos também não demonstra exclusão até um instante absoluto.

O problema inclui uma recusa de delete que atravesse o deadline. Mudar o cron,
antecipar tentativas ou reduzir timeouts não demonstra que a exclusão terá sucesso
nesse cenário. Verifique as garantias atuais nas fontes primárias:

- [Consistência do GCS](https://docs.cloud.google.com/storage/docs/consistency).
- [Falhas e retentativas](https://docs.cloud.google.com/storage/docs/retry-strategy).
- [Lifecycle assíncrono](https://docs.cloud.google.com/storage/docs/lifecycle).

Expiração de URL, bloqueio de leitura ou descarte de chave criptográfica não
comprovam, por si, a ausência das gerações exigida neste aceite. Não redefina o
critério para usar esses mecanismos como equivalentes à exclusão.

### 3.2 I/O que ignora cancelamento

Já foi corrigido o caso em que o stream ignora interrupção, mas responde a
`close()`. O timer acompanha original/manifestos e render/uploads até o mesmo
deadline; o fechamento concorrente mantém posse até terminar.

Permanece o caso em que uma operação ignora tanto interrupção quanto fechamento.
Uma thread Java ainda pode reter posse/capacidade. A recuperação após reinício
real já foi implementada e testada, mas não demonstra término da operação ativa.
Resolver esse ponto local não resolve o delete recusado pelo storage remoto.

## 4. Etapas de execução

### Etapa A — preparação e viabilidade, peso 20%

1. Registre branch/HEAD, `git status`, arquivos alterados/não rastreados e hashes
   dos arquivos relevantes, sem ler/copiar segredos. Preserve o workspace sujo;
   não faça reset, limpeza global, formatação em massa ou commits automáticos.
2. Revalide o estado das tasks, decisões, evidências e recursos registrados.
   Não trate a confirmação histórica de retirada como consulta atual à cloud.
3. Revise o guard de temporários, o harness e as condições de execução antes de
   build. Identifique quais classes/artefatos correspondem ao código atual.
4. Escreva uma matriz de viabilidade para retenção: operação normal, storage
   indisponível/recusando delete através do deadline, perda de rede, processo
   encerrado, SQL indisponível, scheduler atrasado, reinício e gerações antigas.
   Para cada cenário, registre mecanismo, garantia documentada, limite de tempo,
   dependências e contraexemplo. Não restrinja o modelo de falhas aprovado.
5. Avalie alternativas de arquitetura apenas com garantias verificáveis.
   Trocar de storage ou antecipar a limpeza são hipóteses a demonstrar; não são
   soluções previamente aceitas. Não escolha fornecedor por suposição.
6. Entregue uma decisão técnica curta: solução viável sob o contrato, ou bloqueio
   demonstrado. Separe garantia documentada, inferência e observação experimental.

**Saída A:** inventário inicial, matriz e decisão técnica com fontes primárias.
Uma execução bem-sucedida isolada não prova comportamento durante indisponibilidade.
Sem uma hipótese nova que cubra o contraexemplo, não repita a rodada GCS nem
provisione recursos. Ainda pode avançar na correção local independente abaixo,
desde que justifique seu benefício e registre que não fecha a retenção remota.

### Etapa B — implementação e provas, peso 60%

#### B1. Reproduzir e conter I/O não cooperativo

1. Revise `OriginalReadDeadline`, `ProcessRenderingTaskUseCase`,
   `MediaSnapshotDirectory`, `RenderCallSupervisor` e os contratos de storage.
   Localize com `rg --files`; não suponha que os caminhos deste handoff continuam
   iguais. Leia os testes existentes antes de acrescentar outro mecanismo.
2. Crie regressão red para operação que ignora interrupt/close e para término
   concorrente. Use sincronização determinística e timeout de segurança no teste.
   Faça o processo de teste possuir e recolher seus filhos, inclusive após falha.
3. Avalie mover a operação bloqueável para um processo encerrável já integrado
   ao supervisor existente. Documente antes de codar: fronteira, IPC, identidade
   dos filhos, prazo único, término/recolhimento, posse de arquivos, capacidade,
   recuperação e orçamento. Evite criar supervisores concorrentes ou filas novas.
4. Preserve: admissão antes do decode, uma página pesada por instância, zero
   transferência de resultado tardio, nenhum retry de provider e nenhuma
   liberação de capacidade antes de morte/cleanup confirmados. Se o kernel ou
   filesystem impedir a confirmação, mantenha admissão fechada e registre o
   limite; não prometa que um sinal garante término pontual em qualquer falha.
5. Faça red/green com processo real: bloqueio, timeout, cancelamento, término,
   ausência de filhos/resíduos e página válida seguinte. Cubra corrida de entrega,
   stream tardio, cleanup recusado, reinício e vizinho preservado.
6. Meça novamente os cenários afetados se a arquitetura adicionar processo,
   memória, IPC ou scratch. O novo total deve caber no ambiente já admitido;
   os números históricos não aprovam automaticamente um desenho novo.

#### B2. Implementar retenção somente se A demonstrar viabilidade

1. Faça o desenho revisável antes de editar adapters/jobs: deadline imutável,
   geração exata, upload parcial/tardio, rollback, commit perdido, concorrência,
   exclusão de todas as gerações e recuperação independente do SQL quando exigida.
2. Reutilize as filas duráveis existentes. ACK `202` exige exclusão confirmada
   antes da resposta; repetição não cria nova intenção. Não transforme falha de
   delete em sucesso nem renove autorização ou dispare OCR/tradução outra vez.
3. Preserve original até render/terminal e limite absoluto. Não obtenha teste
   verde apagando antecipadamente uma entrada ainda necessária ao job.
4. Antes de repository/JPA/JDBC/schema/migration, leia os guias de ORM/modelagem
   e use a skill `database-design`. Não há migration nova prescrita neste plano.
5. Reproduza cada divergência antes da correção. Teste recusas/indisponibilidade
   que atravessem o deadline; resultados tardios devem continuar falhando no aceite.

#### B3. Prova integrada após mudança justificável

Use renderer/PostgreSQL reais, providers falsos e storage real no ambiente
autorizado. Reaproveite provas anteriores que continuem válidas para o novo código.
Reconstrua o JAR atual e registre os hashes antes de criar a imagem/harness.

- `READY`, sem sessão rejeitado, outro proprietário rejeitado, consulta autenticada
  e downloads HTTPS íntegros; conferir hash, bytes, MIME, dimensões e vínculo
  job/manifesto/imagem.
- Gerações antigas autorizadas mais objeto vizinho: primeiro ACK `202` somente
  após ausência de todas as gerações; segundo ACK com uma intenção durável;
  URLs antes emitidas deixam de baixar e vizinho permanece.
- Delete recusado, I/O bloqueado, restart real com cleanup pendente, retomada da
  fila e ausência de resíduos antes de nova inspeção. Não registrar URL assinada
  ou token.
- Observação de uma hora real sem ACK: registrar criação, deadline imutável,
  gerações e confirmação de ausência. Exercitar o scheduler de produção, não
  apenas invocar diretamente o adapter. Registre resolução/erro dos relógios e
  intervalo de observação; não conclua uma exclusão antes do deadline por uma
  primeira consulta realizada somente depois dele.
- Reexecutar falhas de memória/disco/timeout atingidas pela mudança, medindo
  cgroup agregado, JVM, filhos, memória nativa, scratch, pressão e OOM do host.
  Página válida seguinte deve comprovar recuperação da capacidade.

**Saída B:** código, red/green, pacote atual, resultados reproduzíveis e limitações.
Uma prova positiva não substitui a garantia ausente no cenário de falha remota.

### Etapa C — gates, revisão e retirada, peso 20%

1. Execute os gates abaixo após as mudanças e os testes reais afetados. Separe
   falha de produto, baseline e restrição do sandbox; não enfraqueça asserções.
2. Atualize tasks/review/drift/cobertura e evidência datada, com comandos, ambiente,
   hashes, medições, custos e limites. Preserve documentos históricos e a 021.
   Recalcule checksums somente pelo workflow SDD vigente, quando necessário.
3. Faça handoff para a revisão exigida pelo projeto; implementação não é autoaceite.
4. Retire somente os recursos registrados da nova rodada e confira por consultas
   posteriores: todas as gerações GCS, bucket, imagens/registry, VM/discos,
   identidade e rede. Compare IAM com o baseline. Execute retirada também após
   erro/cancelamento; parada da VM não encerra cobrança de outros recursos.
5. Entregue matriz final por AC, estado de cada task, gates, limites e inventário
   final. Se o requisito continuar sem prova, TASK-006 fica aberta, review mantém
   ressalvas e a 020 permanece `in-progress`; não marque `implemented`.

## 5. Gates e comandos

Execute Maven pela raiz `api/`, usando o reactor para `testing-support`:

```bash
./mvnw test
./mvnw -pl apps/translation-gateway -am test -Dtest=OriginalReadDeadlineTest,ProcessRenderingTaskUseCaseTest,MediaInspectionServiceTest,MediaInspectionRestartTest -Dsurefire.failIfNoSpecifiedTests=false
```

Acrescente as regressões novas ao comando focado e rode os opt-ins de processo,
Boot/native/Linux afetados com o harness atual. Opt-in ignorado não é prova.
Descubra os comandos Node do gateway em seu README/POM/scripts e execute a suíte
correspondente; não suponha que exista um `package.json` na raiz do módulo.

Em `web/toonlira/`:

```bash
npx tsc -b
CHOKIDAR_USEPOLLING=1 pnpm lint:fsd
```

Em `mobile/`:

```bash
pnpm check
```

Execute também `git diff --check` e verificação de links/formato dos documentos
alterados. Não rode `format`/`--fix` no repo inteiro. Não use `tsc --noEmit` vazio
como substituto de `tsc -b`. Reexecute enumeração de processos com o acesso
adequado se o sandbox impedir a prova, preservando suas asserções.

## 6. Restrições operacionais e custo

- Sem chamadas pagas OCR/tradução, mídia real, publicação ou habilitação de
  defaults. Não criar recursos apenas para repetir uma hipótese já refutada.
- Teto cloud acumulado previamente autorizado: **US$ 20**, com parada preventiva
  de novos compromissos em **US$ 15** e reserva de **US$ 5**. US$ 4,98 é estimativa
  anterior, não orçamento reiniciado nem fatura. Atualize preços oficiais,
  compromissos, bytes/operações/transferência e eventual faturamento observado.
- Use SDK e Python compatível já existentes; não instale componentes, não mude
  ADC e não copie credenciais. Limitação de permissão vira bloqueio registrado.
- Se uma nova rodada Compute for justificada e couber no escopo autorizado:
  identificador exclusivo `mob020`, inventário durável de intenções/operações/IDs,
  `e2-highmem-2` em `southamerica-east1-a`, boot 20 GiB, VPC/subnet dedicadas,
  Private Google Access, sem IP público/ingresso, sem SSH/IAP/NAT/SQL/Cloud Run.
  Vida máxima de quatro horas e sem reinício automático.
- Bucket Standard regional privado com UBLA/PAP, versionamento, soft delete
  desabilitado e sem retenção/hold impeditivos; identidade sem chave restrita ao
  bucket/registry/assinador dedicados. Nenhuma role administrativa no projeto.
- Registry privado somente com artefatos necessários fixados por digest.
  Confirme operação ambígua antes de repetir criação. Não reutilize nomes de
  recursos antigos como se ainda existissem. Startup/serial devem ser sanitizados.
- Mudança de infraestrutura fora desse envelope precisa de proposta concreta e
  autorização correspondente antes de provisionar; este plano não a concede.

## 7. Evidências reaproveitáveis e artefatos locais

A última validação registrou Maven global, regressões focadas, Node gateway,
web e `pnpm check` verdes. Não confunda esses resultados com verificação de
novas alterações. Foram reaproveitados o aceite visual das sete fixtures e o
profiling Android. Não reabra TASK-008 sem mudança que invalide sua evidência.

JAR da última rodada: SHA-256
`7f86d55990d1ed0bc24696eed08e5f5a05af975e2ffd52cc7a9645b4048bf350`.
É referência histórica: reconstrua e confira a versão corrente após editar código.

Se presentes no mesmo workspace, consulte sem copiar segredos:

| Caminho local | Uso |
| --- | --- |
| `.local/mob020-completion-20261030/completion-audit.json` | Síntese da rodada anterior |
| `.local/mob020-completion-20261030/workspace-preservation-audit-final.json` | Preservação do workspace |
| `.local/mob020-completion-20261030/human-retention-decision.json` | Decisão literal de manter requisito |
| `.local/mob020-completion-20261030/human-memory-admission.json` | Admissão restrita do Compute |
| `.local/mob020-completion-20261030/blocked-revalidation-20261030T172455Z.json` | Última ausência consultada e IAM preservado |
| `.local/mob020-current-gcs-20261030/resources.json` | Inventário da rodada já retirada |
| `.local/mob020-current-gcs-20261030/cost-final.json` | Custo acumulado conservador |
| `.local/mob020-completion-20261030/` | Logs dos gates, hashes e medição Android |

Não sobrescreva recibos imutáveis nem arquivos citados por hash. Novas consultas
devem gerar recibos com identificador/data próprios.

## 8. Entrega esperada e condição de conclusão

Entregue um relatório com: diagnóstico, decisão de viabilidade, correções feitas,
matriz AC/teste/evidência, gates executados, custo acumulado, retirada e pendências.
Em cada atualização, informe etapa, progresso dessa etapa e progresso total,
ponderando preparação/execução/fechamento em **20%/60%/20%**. Não converta 7/8
tasks em porcentagem automática de conclusão nem conte critério bloqueado como
validado. Estime esforço de código separadamente de tempo real de observação e
dependências externas; não prometa prazo de conclusão sem viabilidade demonstrada.

Checklist final:

- [ ] Garantia de retenção atende ao requisito original, inclusive falhas exigidas.
- [ ] I/O não cooperativo tem contenção, posse, recuperação e limites comprovados.
- [ ] ACK, gerações, integridade, proprietários e vizinho continuam corretos.
- [ ] Prova de uma hora real e scheduler sustentam o aceite, com limites explícitos.
- [ ] Novo código cabe no orçamento admitido e não invalida as provas reutilizadas.
- [ ] Gates e revisão requeridos concluídos sem enfraquecer testes ou requisitos.
- [ ] Evidências, cobertura, tasks e drift refletem o resultado; 021 preservada.
- [ ] Recursos temporários retirados e ausência conferida; custos registrados.

Se qualquer item necessário permanecer sem comprovação, liste exatamente qual,
o contraexemplo e a condição externa para avançar. **O resultado correto pode
continuar sendo bloqueio; o plano não autoriza declarar uma garantia inexistente.**
