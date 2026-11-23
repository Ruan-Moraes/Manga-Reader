# META — MOB-FEAT-020: validação técnica prioritária

## Objetivo

Continuar a MOB-FEAT-020 com foco nas verificações de maior valor para fechar entrega privada, ACK, retenção, limpeza e limites do worker. Crie uma meta para acompanhar o trabalho até concluir o escopo ou identificar um bloqueio concreto.

Em cada atualização, informe a etapa atual, o progresso da etapa e o progresso total. A contagem de tasks é uma referência, não uma medida exata do esforço restante.

## Início — diagnóstico e preparação

1. Leia a spec, tasks, review e evidências atuais da 020. Confira o workspace e preserve as alterações e arquivos existentes.
2. Identifique o que já está comprovado e o que falta para os critérios de aceite. Reaproveite a aprovação visual das sete fixtures, os testes locais e o profiling já realizado no emulador Android.
3. Prepare a validação cloud mínima no projeto `toonlira-rm`, região `southamerica-east1`, conferindo preços, faturamento, quotas, permissões e compatibilidade de arquitetura antes de criar recursos.

O usuário autorizou a criação do ambiente cloud temporário para esta validação, com limite total de **US$ 20**. Use recursos privados e dados sintéticos. Não execute chamadas pagas a providers de OCR ou tradução, não publique a feature e não altere recursos cloud preexistentes.

## Meio — execução e correções

1. Crie apenas a infraestrutura temporária necessária: VM privada candidata, bucket de teste privado, identidade com permissões restritas e registry privado se necessário. Identifique os recursos criados para removê-los com segurança.
2. Execute uma página sintética com renderer real e providers falsos, usando GCS real. Confirme `READY`, consulta autenticada, download HTTPS da imagem e do manifesto, integridade e vínculo entre os arquivos.
3. Envie ACK duas vezes. Verifique a intenção idempotente e a exclusão das gerações autorizadas antes do `202`. Use um bucket novo de teste com soft delete desabilitado, sem modificar buckets existentes.
4. Confira os limites efetivos e o pico agregado de memória na VM. Reaproveite a injeção existente para demonstrar falha controlada de memória ou disco, limpeza e processamento de uma página seguinte.
5. Investigue as lacunas que possam impedir o aceite: retenção absoluta, I/O bloqueado e recuperação da limpeza após falha ou reinício. Corrija apenas problemas reproduzidos e acrescente regressões direcionadas.
6. Reaproveite os testes existentes de cancelamento, expiração, rollback e demais caminhos. Evite benchmarks amplos, matrizes novas e infraestrutura que não ajudem a resolver uma pendência concreta.

A validação na VM comprova apenas o ambiente testado. Não repita o diagnóstico Cloud Run anterior sem uma hipótese nova, nem apresente um teste com prazo reduzido como prova de exclusão pontual em uma hora.

## Fim — aceite e limpeza

- Execute os gates exigidos pelo repositório e registre falhas preexistentes sem enfraquecer as verificações.
- Atualize tasks, review, drift, cobertura e evidências com comandos, ambiente, resultados, custos observados e limitações.
- Remova e confira a remoção dos recursos temporários criados, inclusive após falha ou cancelamento. Libere espaço apenas com artefatos temporários que não serão mais necessários; preserve evidências e arquivos do usuário.
- Marque a 020 como concluída **somente se todos os critérios da spec estiverem atendidos**. Caso contrário, mantenha o status adequado e apresente pendências concretas com estimativa restante.

Se quota, IAM, política ou custo impedir a execução, registre o bloqueio e continue o trabalho independente. Alertas de orçamento não são um limite automático de cobrança: acompanhe o gasto e interrompa antes que a previsão ameace o teto.

## Estado conhecido na transferência

- A 020 está `in-progress`, com 6 de 8 tasks concluídas; TASK-006 e TASK-008 seguem abertas. A 021 está implementada.
- A execução anterior foi interrompida durante a preparação. Não foi relatada criação de recursos cloud; reconfirme isso antes de executar qualquer operação.
- A consulta cloud de leitura confirmou projeto ativo, faturamento habilitado, quota para `e2-highmem-2` x86 e APIs principais habilitadas. A opção ARM consultada não constava nas zonas de São Paulo. Revalide esses dados e os preços antes de criar recursos.
- Há codec x86 preservado em `.local/worker-isolation/recovery-2026-10-24/codec/`; confira hashes e compatibilidade. O JAR da imagem histórica não inclui as alterações atuais.
- Há alterações locais em andamento no guard de temporários e no harness GCS de teste. Confira o diff e a integridade dos arquivos antes de compilar ou continuar; não os descarte. A execução interrompida não comprova o fluxo GCS real.
- Na última execução, `tsc -b` web e `lint:fsd` web passaram; `pnpm check` mobile passou com 121 suítes e 953 testes; testes Node do gateway passaram com 153 aprovados e um skip. O primeiro lint FSD falhou por limite de arquivos abertos, e passou ao ser repetido com `CHOKIDAR_USEPOLLING=1`. Esses resultados devem ser reavaliados após novas alterações quando aplicável.
- O teste focal do guard passou, mas três testes do adapter falharam no sandbox por bloqueio à enumeração de processos. Reexecute com acesso adequado antes de concluir sobre eles.
