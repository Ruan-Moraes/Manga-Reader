# Registro de riscos do produto Mobile

> Documento informativo. Prioridade representa risco ao produto/release, não
> status de implementação. Cada risco deve ser revisitado na spec e no milestone
> indicados.

## Escala

- **P0:** pode inviabilizar valor central, segurança, custo ou publicação.
- **P1:** pode comprometer uma primeira versão robusta.
- **P2:** evolução após validação.
- **P3:** risco futuro ou estratégico.

`CONTROL_PLANNED` significa que desenho/limites foram aprovados, mas a mitigação
ainda não possui implementação e evidência; não equivale a `MITIGATED`.

## Registro

| ID      | Pri | Risco                                              | Prob. | Impacto | Milestone/gate        | Mitigação e evidência esperada                                                                                          | Estado          |
| ------- | --- | -------------------------------------------------- | ----- | ------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------- |
| RSK-001 | P0  | OCR insuficiente para idioma ou sistema de escrita | Alta  | Crítico | M3 acceptance         | Benchmark autorizado por idioma/escrita, incluindo japonês vertical, regiões múltiplas e erro por página.               | OPEN            |
| RSK-002 | P0  | Ordem de balões/regiões incorreta                  | Alta  | Alto    | MOB-FEAT-018/019      | IDs e coordenadas estáveis, algoritmo testável, avaliação humana e casos manga RTL.                                     | OPEN            |
| RSK-003 | P0  | Tradução literal/inconsistente em algum par        | Alta  | Crítico | M3/M6                 | Benchmark por par de naturalidade, contexto, nomes próprios e feedback; comparar custo/qualidade.                       | OPEN            |
| RSK-004 | P0  | Texto renderizado ilegível ou arte destruída       | Alta  | Crítico | MOB-FEAT-020          | Original preservado, fallback textual, checks de corte/contraste e revisão visual autorizada.                           | OPEN            |
| RSK-005 | P0  | First page lenta elimina o diferencial             | Média | Crítico | M3→M4                 | Medir `translation_started → first_page_ready/read`; priorizar primeira página e definir SLO só após baseline.          | OPEN            |
| RSK-006 | P0  | Pipeline processa tudo antes do reader             | Média | Crítico | MOB-FEAT-022          | AC explícito: primeira `READY` libera leitura; teste com páginas `READY/PROCESSING/QUEUED`.                             | OPEN            |
| RSK-007 | P0  | Falha/retry perde ou reprocessa páginas concluídas | Média | Crítico | MOB-FEAT-024          | Máquina de estado, attempts idempotentes, testes de falha parcial e preservação de resultado/consumo.                   | OPEN            |
| RSK-008 | P0  | Biblioteca/progresso corrompidos ou apagados       | Média | Crítico | M5/M8 go-no-go        | Banco versionado, escrita atômica, migrations/recovery/upgrade e testes de encerramento forçado.                        | OPEN            |
| RSK-009 | P0  | URI escolhida é revogada antes da retomada         | Alta  | Alto    | MOB-FEAT-012          | Copiar seleção confirmada para diretório privado, tratar falha por item e provar revogação.                             | OPEN            |
| RSK-010 | P0  | Memória explode com imagens grandes                | Alta  | Crítico | M2–M5/release         | Limites seguros, decode dimensionado, janela de preload, não manter capítulo inteiro e testar hardware modesto.         | OPEN            |
| RSK-011 | P0  | Custo cresce sem limite por abuso/retry            | Alta  | Crítico | Antes de beta pública | Alpha aprovado: 20 páginas/instalação/dia, 100 global/dia, idempotência e kill switch; Play Integrity segue gate beta.  | CONTROL_PLANNED |
| RSK-012 | P0  | Secret de provider é extraído do APK               | Média | Crítico | MOB-FEAT-017/release  | Todo provider privado atrás de serviço; artifact/secret audit obrigatório.                                              | OPEN            |
| RSK-013 | P0  | Provider retém/treina com mídia privada            | Média | Crítico | Deploy/policy         | Google Cloud escolhido; validar termos vigentes, Vision online, regiões, deleção/TTL e disclosure antes do upload real. | CONTROL_PLANNED |
| RSK-014 | P0  | Logs/analytics vazam imagem ou diálogo             | Média | Crítico | M3/M8                 | Event registry com allowlist, payloads sem conteúdo e testes/inspeção de crash logs.                                    | OPEN            |
| RSK-015 | P0  | Copy promete 100% offline/local incorretamente     | Alta  | Alto    | MOB-FEAT-012/017      | Renomear fluxo e explicar envio remoto antes do primeiro processamento.                                                 | OPEN            |
| RSK-016 | P0  | Copyright/UGC impede publicação                    | Média | Crítico | M8 go-no-go           | Uso privado, usuário fornece mídia, sem scraping/share público, termos e assets/fixtures autorizados.                   | OPEN            |
| RSK-017 | P0  | Data Safety/política divergem do build             | Média | Crítico | M8 go-no-go           | Inventário de SDK/provider por release e revisão sempre que coleta/compartilhamento mudar.                              | OPEN            |
| RSK-018 | P0  | Build usa package/ambiente temporário              | Média | Crítico | Android Build spec    | Package definitivo, environment validation, AAB assinado e sem demo/secrets.                                            | OPEN            |
| RSK-019 | P0  | Crash/ANR no fluxo principal                       | Média | Crítico | M8 go-no-go           | Testes físicos, vitals, trabalho pesado fora da UI e zero crash reproduzível conhecido.                                 | OPEN            |
| RSK-020 | P0  | Backend quebra versões instaladas                  | Média | Alto    | Release Gate          | Contrato versionado/backward compatible e plano de contenção; `/api` segue dependência externa.                         | OPEN            |
| RSK-021 | P1  | Rede instável deixa estado ambíguo                 | Alta  | Alto    | MOB-FEAT-017/024/026  | Timeout, retry idempotente, persistência de estado, mensagens acionáveis e retomada.                                    | OPEN            |
| RSK-022 | P1  | Provider indisponível/lock-in                      | Média | Alto    | M3/M8                 | Vision/Translation atrás de portas, erros por etapa, kill switch e contrato mobile sem payload nativo do provider.      | CONTROL_PLANNED |
| RSK-023 | P1  | Processamento em background é interrompido         | Alta  | Médio   | M4/M5                 | Não prometer execução ilimitada; persistir job, reconciliar ao retorno e respeitar Android/bateria.                     | OPEN            |
| RSK-024 | P1  | Página vazia/sem texto vira falha                  | Média | Médio   | MOB-FEAT-015/018      | Estado válido sem regiões; teste de arte-only e continuação do lote.                                                    | OPEN            |
| RSK-025 | P1  | Duplicatas gastam processamento                    | Média | Médio   | MOB-FEAT-013/024      | Aviso não destrutivo, hash quando seguro e cache/idempotência.                                                          | OPEN            |
| RSK-026 | P1  | Leitor publicado contamina domínio local           | Média | Alto    | MOB-FEAT-021          | Entity própria e reuso apenas de shared/primitivas; lint FSD e testes de contratos separados.                           | OPEN            |
| RSK-027 | P1  | Auth expirada bloqueia biblioteca local            | Média | Alto    | M5/M7                 | Sessão privada e dados locais com ciclos separados; testes logout/expiração/offline.                                    | OPEN            |
| RSK-028 | P1  | Backup expõe ou duplica mídia privada              | Média | Alto    | MOB-FEAT-026/027      | Default conservador de exclusão até política explícita; testar restore quando habilitado.                               | OPEN            |
| RSK-029 | P1  | Falta de testadores atrasa Play                    | Média | Alto    | M8 schedule           | Confirmar tipo/data da conta cedo e recrutar público real antes do closed test.                                         | OPEN            |
| RSK-030 | P1  | Mudança de política/target Play                    | Média | Alto    | Cada release          | Revalidar fontes oficiais antes de release; não congelar requisito temporal.                                            | MONITORED       |
| RSK-031 | P1  | Monetização precoce destrói ativação               | Média | Alto    | M7/M9                 | Entregar experiência real gratuita e decidir preço somente após custo/retenção.                                         | OPEN            |
| RSK-032 | P2  | Import manual causa abandono versus URL            | Média | Médio   | Após alpha            | Medir abandono/pedidos; promover URL import somente com evidência e revisão legal.                                      | DEFERRED        |
| RSK-033 | P1  | Matriz de idiomas cria pares sem qualidade medida  | Alta  | Alto    | M3/M6/M10             | Sete idiomas/42 pares; capabilities publica suporte real e fixtures incluem ambas as variantes chinesas.                | OPEN            |
| RSK-034 | P2  | Plataforma/fórum desviam esforço                   | Alta  | Médio   | Planejamento contínuo | Manter escondidos e sem Target Specs P0/P1 enquanto tradutor não validar retenção.                                      | MONITORED       |

## Gates de risco por milestone

| Transição         | Riscos que precisam de controle demonstrável                         |
| ----------------- | -------------------------------------------------------------------- |
| M2 → M3           | RSK-009, RSK-010, RSK-015 e validação de entrada privada.            |
| M3 → M4           | RSK-001..005, RSK-012..014, gateway implantado e políticas públicas. |
| M4 → M5           | RSK-006/007/021/023 e estados incrementais confiáveis.               |
| M5 → beta externa | RSK-008/011/017/019/020/027/028.                                     |
| Beta → produção   | Todos P0, RSK-029/030, Data Safety, closed testing e go/no-go.       |
| M7 → M9           | Custo, falha, consumo, retenção e willingness-to-pay com baseline.   |

## Rotina de atualização

- A Target Spec referencia os riscos que afeta e define evidência proporcional.
- Reviewer registra risco novo ou mitigação não comprovada como finding.
- Drift Auditor verifica se controles declarados continuam presentes.
- Risco só muda para `MITIGATED` com evidência reproduzível; documentação ou
  intenção isolada não bastam.
- Antes de cada release, revalidar riscos P0/P1 e fontes temporais da Play.
