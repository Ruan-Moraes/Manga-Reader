# Review — MOB-FEAT-005

- Spec revisada: `spec.md`
- Implementação/revisão: working-tree sha256:2a9c4a85c0b28420394a6cf36082e65787410c03624e1609fc95423e27d42a37
- Gate na entrada do planejamento: `open`
- Dependências verificadas: `MOB-FEAT-001` (`implemented`) e `MOB-FEAT-004` (`implemented`)
- Verdict: `verification-pending`

## Findings e resolução

1. **Resolvido — contrato textual/decimal de `chapterNumber`.** Modelo, mapper, retomada e PUT preservam `string`; envelopes e payloads com `"7.5"` estão cobertos e correspondem à Core.
2. **Resolvido — falha do GET privado.** A leitura pública continua, o erro e retry são localizados e separados do retry de PUT, e nenhuma escrita ocorre antes da hidratação privada bem-sucedida.
3. **Resolvido — troca de identidade.** A subtree keyed por autenticação + `identityEpoch` descarta o estado A sincronicamente; cleanup e query keys isolam B, e resposta tardia de A não altera a nova leitura.
4. **Resolvido — viewport vertical e rotação lógica.** Layouts reais por identidade substituem a aproximação por altura de viewport; restauração usa offset medido e `animated: false`, cobrindo alturas variáveis, gap e reflow.
5. **Resolvido — controles, RTL e reflow.** Navegação some quando os controles são ocultados, disposição física respeita RTL, toggle mantém alvo acessível e preferências usam painel rolável com fonte ampliada.
6. **Resolvido — progresso válido no envelope, mas incompatível com o capítulo atual.** `isReadingProgressValidForChapter` reconcilia número, total e página com as páginas realmente carregadas. O caso remoto 3/3 contra capítulo de duas páginas emite diagnóstico, volta à página 1 e mantém zero PUT até navegação explícita. Capítulo recente 404 também emite diagnóstico, não grava e oferece retorno localizado ao capítulo solicitado.

Nenhum finding de código conhecido permanece. A verificação física obrigatória de TASK-010 continua aberta.

## Critérios e evidências

| Critério | Implementado | Evidência verificada                                                                                                   | Resultado |
| -------- | ------------ | ---------------------------------------------------------------------------------------------------------------------- | --------- |
| AC-001   | sim          | Mapper/query, deduplicação/ordem e estado vazio                                                                        | pass      |
| AC-002   | sim          | Matriz 3 modos × 3 direções, DOUBLE ímpar/RTL e controles direcionais                                                  | pass      |
| AC-003   | sim          | Normalização, limites, store único de settings, restauração e reflow                                                   | pass      |
| AC-004   | sim          | LOW/MEDIUM/HIGH permanecem ocultas sem variantes distintas verificáveis                                                | pass      |
| AC-005   | sim          | Integração guest prova somente GET público e zero GET/PUT privado                                                      | pass      |
| AC-006   | sim          | Decimal, retomada, mismatch contextual, 404 recente e isolamento A → B                                                 | pass      |
| AC-007   | sim          | Payload 1-based, total real, auto-mark condicional e zero conclusão derivada de clamp inválido                         | pass      |
| AC-008   | sim          | Falhas/retries separados, pending monotônico, imagem isolada e respostas obsoletas ignoradas                           | pass      |
| AC-009   | sim          | Labels/roles/states, alvos mínimos, painel com reflow, ausência de transição essencial e restauração lógica por layout | pass      |

## AC-009 e matriz física

- A matriz física iOS/Android **não foi executada** nesta revisão; nenhum resultado manual é alegado.
- O comportamento normativo de AC-009 possui evidência automatizada proporcional: propriedades semânticas e estados acessíveis, alvos mínimos, fonte ampliada com painel rolável, transições do leitor sem animação essencial e preservação da página lógica após reflow/layout.
- `MOB-DEC-003` impede a conclusão enquanto a matriz normativa não for executada. A implementação permanece válida como dependência técnica no status `verification-pending`.
- Os itens manuais de memória, rede e preload registrados em `tasks.md` integram a mesma verificação física aberta; os riscos automatizáveis correspondentes já têm cobertura de janela de preload, retry e preservação de estado.
- O simulador iOS disponível não substituiria a matriz bilateral enquanto Android/TalkBack permanece indisponível. Executar a matriz antes de release continua recomendado, mas não há comportamento divergente conhecido que justifique `changes-requested`.

## Gates

| Comando                                                                     | Resultado                                                                                                                                                   |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 5 suítes focadas da terceira rodada, via Jest local                         | pass — 5 suítes, 15 testes, 0 snapshots                                                                                                                     |
| Suíte Jest completa, via binário local                                      | pass — 48 suítes, 192 testes, 0 snapshots                                                                                                                   |
| `node --test scripts/spec-coverage.test.mjs scripts/feature-gates.test.mjs` | pass — 15 testes                                                                                                                                            |
| `node scripts/validate-specs.mjs`                                           | pass — 19 artefatos, 324 arquivos classificados                                                                                                             |
| TypeScript / ESLint / Steiger, via binários locais                          | pass                                                                                                                                                        |
| Prettier                                                                    | pass após formatação deste review                                                                                                                           |
| `pnpm check`                                                                | o Executor registrou pass pós-correção; a revisão repetiu diretamente todos os subgates aplicáveis devido à reconciliação interativa do pnpm neste ambiente |

## Cobertura e drift

- Arquivos runtime descobertos: **0**.
- Referências desconhecidas ou evidências sem classificação: **0**.
- `mismatch`: **0**.
- `undocumented`: **0**.
- Evidência manual pendente: **1 checklist de release**, explicitamente não executado e não apresentado como prova automatizada.
- Supersession/baseline: a substituição parcial de `MOB-BASE-008/OBS-001` permanece consistente.

## Mudanças fora da spec

- Nenhuma. A composição em Profile reutiliza o contrato único de settings previsto pela spec.

## Conclusão

Todos os AC-001…009 possuem implementação automatizada rastreável, os contratos reais da Core estão preservados e a leitura guest não toca endpoints privados. Como a matriz física iOS/Android de TASK-010 não foi executada, o verdict é `verification-pending`. A promoção para `implemented` exige a execução real e o registro dessa matriz, sem substituir ou fabricar evidência.
