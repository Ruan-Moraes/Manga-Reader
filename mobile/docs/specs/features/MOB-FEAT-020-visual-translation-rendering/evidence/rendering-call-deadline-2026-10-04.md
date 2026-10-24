# Prazo e posse da chamada de render — 2026-10-04

Parcela de TASK-002/007/008 e AC-006. 020 in-progress/open; review
changes-requested; 021 approved/blocked. Não ativa uploads/renderer/cloud,
usa credenciais, imagens reais, rede Google ou provider pago.

## Finding, plano e correção

[Plano antes do código](../../../../../../api/apps/translation-gateway/docs/rendering-call-deadline.md).
IsolatedRenderAdapter executava launcher/IPC/validação/transferência no chamador:
launcher ignorando interrupt ficou preso por mais de dois segundos com prazo de
250 ms. O teste de regressão falhou com TimeoutException no Future externo,
antes do fix; a filha criada após liberar o latch foi encerrada no finally.
Não confundir esse timeout de teste com o erro sanitizado que deveria voltar.

RenderCallSupervisor move a operação inteira para thread virtual possuída e usa
o mesmo nanoTime original. Uma capacidade, sem fila ou thread por recusa. Não
herda InheritableThreadLocals. Espera do chamador limitada; sucesso transfere
Output apenas após confirmação anterior ao prazo. Resultado tardio nunca é
devolvido: o proprietário remove seu arquivo. Cancelamento preserva o interrupt
do chamador. Exceções/representações não contêm arquivo, request ou erro bruto.

Interrupt é sinalizado uma única vez por thread privada, também sem herança de
contexto. O caminho pode fechar canal, conforme
[contrato Java 23](<https://docs.oracle.com/en/java/javase/23/docs/api/java.base/java/lang/Thread.html#interrupt()>).
O teste de sinalização bloqueada é sintético; não comprova uma latência específica
do sistema operacional. Capacidade só é devolvida após operação, cleanup e
sinalização confirmados. Falha de cleanup ou terminação desconhecida mantém
capacidade indisponível; não admite outro render nem retry automático.

Nenhum contrato público, RenderPort, manifesto, estado persistido, migration,
configuração/default ou bean de produção mudou. O worker `local` existente não
foi substituído silenciosamente. Fontes/input/output são os mesmos.

## Red/green e cobertura

Comando focalizado a partir de api:

```bash
./mvnw -o -q -pl apps/translation-gateway -am test \
  -Dtest=RenderCallSupervisorTest,IsolatedRenderCallDeadlineTest,IsolatedRenderAdapterTest \
  -Dsurefire.failIfNoSpecifiedTests=false
```

Exit 0: 19 testes, zero failures/errors/skipped. Doze casos de supervisor,
um de launcher tardio com filha real, seis cenários originais do adapter.
Treze casos novos. São testes de posse/deadline, não qualidade de pintura.
Fixture de Output do supervisor tem bytes arbitrários para testar propriedade,
sem alegação de codec/WebP válido. Filho real usa fixtures locais sintéticas.

Após o primeiro fix, duas asserções antigas falharam por verificar cleanup no
mesmo instante do retorno. O chamador agora retorna sem esperar cleanup
potencialmente preso. As asserções foram preservadas com espera eventual
explícita de staging vazio, capacidade disponível e filha morta, até cinco
segundos; nenhum cenário ou verificação de original/sentinel foi removido.
O caso de sinalização bloqueada ficou red antes do seam e passou depois da
separação desse caminho; caller retorna enquanto capacidade permanece ocupada.

Cobertura: sucesso/transferência única, deadline/cancelamento, saída tardia,
cleanup bloqueado/falho, erro sanitizado, falha conhecida de terminação,
interrupção anterior, argumentos/prazos inválidos, ausência de contexto herdado,
launcher atrasado, preservação do original e recusa enquanto a posse está ativa.

## Integridade e gates

Checksum técnico: 287 arquivos src/scripts/openapi, pom e Terraform, ordenados
por caminho relativo; SHA-256 de caminho + NUL + bytes + NUL:
`5e19567a79acbb16613f76dce46cdece9e6f99bd02ab66fe8b826a0fc1b65830`.
É fotografia técnica Java separada do checksum SDD mobile; hashes históricos
de OCR/tradução/render/Linux não foram substituídos por este resultado.

`./mvnw -o -q -pl apps/translation-gateway -am package -DskipTests`: exit 0,
antes dos testes do artefato atual. JAR desta parcela:
`8587cfeac7c4807287da15b2df9b758d0f78e85d8e33996b5666996fee49c28a`.
O teste Boot/Linux exige classes/recursos atuais em BOOT-INF, não apenas nome
ou existência do JAR. O hash não é promessa de build byte a byte reproduzível.

Node `node --test scripts/*.test.mjs`: exit 0, 85 pass/um opt-in de fonte ignorado.
Web `pnpm exec tsc -b`: exit 0.

Maven global offline/Docker: `./mvnw -o -q test`, com os pins/macOS e flags
native/archive/Linux da [evidência anterior](rendering-linux-2026-10-04.md).
Exit 0, início `2026-10-04T19:16:29.295Z`. XMLs frescos confirmaram 960 testes
em 79 classes no gateway, zero failures/errors/skipped. Contagem antes da suíte
leve; quatro harnesses manuais históricos excluídos por data, não usados como
evidência de nova chamada. RenderingPersistence 83, worker 17, schema 49,
dispatch três. A cadeia PostgreSQL 17 V1–V7 e testes native/Boot/Linux foram
reexecutados com o pacote atual, sem Maven sobreposto. Inspeção escopada final
não encontrou containers toonlira-render-linux restantes.

Suíte leve `./mvnw -o -q -pl apps/translation-gateway -am test
-Dtest.excludedGroups=testcontainers`: exit 0, com permissão para gRPC falso e
supervisão local. Não há instalação, codec opt-in ou provider inicializado no
modo comum. Logs gRPC de stream já fechado permanecem explícitos, sem falha
do gate ou texto real. Fixtures não provam SLA, memória máxima ou qualidade.

`pnpm check` integral: exit 0, 116 suítes/892 testes, 30 performance/24 SDD/seis
FSD, typecheck/lint/formato/links. Warnings anteriores de act/ícones Expo não
foram suprimidos; não inferir performance do aparelho por esses testes. SDD
classificou 1.497 arquivos, 362 behavior e 209 evidence, com 67 artefatos
normativos. Nenhum lockfile/dependência/script foi atualizado ou reinstalado.

Formatação somente em documentos/mapa alterados; git diff --check aprovado.
Novos fontes/testes também conferidos com diff no-index, sem whitespace errors.
Headers SDD correntes rebaseados mecanicamente após estabilizar a evidência,
sem substituir conclusões/verdicts históricos. Checks SDD/links/formato finais
validam este registro estabilizado; não são confundidos com hashes de código Java.

## Limites e decisão

Esse fix limita a espera do chamador, não preempta I/O nem garante execução
terminada no instante do timeout. Uma operação presa mantém capacidade ocupada
até terminar ou restart. Morte de descendants observados não é contenção atômica
de fork/exit. Kernel, orçamento nativo/disco, distribuição/licenças, integração
supervisionada, profiling no limite, retenção integral e revisão visual continuam
pendentes. Não classificar essas lacunas funcionais como simples benchmark.

TASK-002/006/007/008 abertas, 020 in-progress/open e 021 blocked conservadas.
Skills executor/reviewer/drift mantêm vínculo e verdict parcial; performance
mobile não aplicável: apenas governança, sem mudança runtime ou métrica Android.
Nenhum validador, teste, gate ou dependência foi excluído/reinstalado para aprovar.
