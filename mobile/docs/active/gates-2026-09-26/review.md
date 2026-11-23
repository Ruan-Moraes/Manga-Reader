# Gates web e pnpm — 2026-09-26

Registro de infraestrutura e testes; não altera contratos comportamentais ou
aprova qualidade de OCR. A MOB-FEAT-018 permanece `in-progress`.

## Causa e correção

- Web: reproduzidas quatro falhas em `Footer.test.tsx` e `HelpCenter.test.tsx`.
  Os testes ainda buscavam “Reader”, usavam “Toonlira” de forma ambígua entre
  marca/copyright ou esperavam “A Toonlira é gratuita?” em vez da pergunta atual.
  As correções usam nome acessível, copyright completo com ano corrente e
  abertura/fechamento do accordion via `aria-expanded` e visibilidade. O conteúdo
  recolhido permanece montado com `hidden`; não se exige desmontagem.
- A skill FSD manteve a ordem `shared/ui` → `pages/help`, sem mover arquivos ou
  alterar componentes, marca, traduções, layout ou APIs públicas.
- Mobile: pnpm 11.10.0 comparava `enableGlobalVirtualStore` implícito com o valor
  `false` salvo na instalação. A divergência disparava instalação antes dos scripts.
  Configuração explícita local agora mantém `false` e `verifyDepsBeforeRun: error`;
  `packageManager` foi fixado na versão já instalada, sem atualizar dependências.
- O novo arquivo de configuração foi classificado como infraestrutura e incluído
  no checksum SDD. O teste de regressão falhou antes da alteração e passou após;
  reviews/drift continuam excluídos para evitar autorreferência.

## Bloqueio da instalação local — histórico antes da recuperação

Depois de criar o workspace limitado ao mobile, `pnpm run typecheck` retorna
`ERR_PNPM_VERIFY_DEPS_BEFORE_RUN`: `workspacePackagePatterns` mudou. Isso confirma
que o script falha explicitamente, sem iniciar instalação automática.

A tentativa autorizada `pnpm install --frozen-lockfile --offline` foi abortada com
`ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`: o gerenciador pretendia recriar os
módulos. A operação foi interrompida conforme o plano, sem `--force`, TTY para
confirmar remoção, mudança de `CI`, edição manual de metadados gerados ou liberação
de scripts. A recuperação precisa de aprovação separada e preservação recuperável
da instalação atual; não declarar o gate agregado verde com checks diretos.

## Evidências de execução

- Ambiente: macOS, Node 22.23.1 e pnpm 11.10.0.
- Web antes: 4 falhas e 22 passes nos dois arquivos focalizados.
- Integridade SDD: novo teste de configuração pnpm passou de vermelho para verde;
  os testes existentes de exclusão autorreferente permaneceram aprovados.
- Hash inicial do lockfile mobile (SHA-256): `a52e7d97008d813b1b32114032932d43ae9c30808eec33bdd76a4ac4b4f1059e`.

## Resultado antes da recuperação autorizada

| Gate                                                         | Resultado                                                                                   |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| Web focalizado: `vitest run --pool=forks` nos dois arquivos  | 26 testes aprovados                                                                         |
| Web completo: `vitest run --pool=forks`                      | 187 arquivos, 1.211 testes aprovados                                                        |
| Web: `tsc -b`                                                | aprovado                                                                                    |
| Web: `CHOKIDAR_USEPOLLING=1 pnpm --filter toonlira lint:fsd` | aprovado                                                                                    |
| Maven global: `./mvnw test`                                  | sete módulos aprovados; gateway com 98 testes, zero falhas/erros                            |
| Mobile: `pnpm check`, duas tentativas                        | ambas bloqueadas antes dos scripts por `workspacePackagePatterns`; sem instalação implícita |
| SDD via Node: testes dos três validadores                    | 24 testes aprovados                                                                         |
| SDD: `validate-specs.mjs` e `check-doc-links.mjs`            | aprovados após renovação de checksums                                                       |
| Prettier dos arquivos alterados e `git diff --check`         | aprovados, sem formatação automática global                                                 |

`pnpm config get` confirmou `verifyDepsBeforeRun=error` e
`enableGlobalVirtualStore=false`; `pnpm list --depth -1 --json` listou somente o
pacote mobile. O lockfile manteve o SHA-256 inicial após a tentativa de instalação
e as duas tentativas do gate. Dependências e scripts existentes foram preservados.
Os checksums renovados refletem a configuração e governança atuais, sem alterar
os verdicts históricos nem renovar evidência funcional/física das outras features.

Verdict anterior: web aprovado; configuração fail-closed implementada;
aceite agregado mobile **bloqueado por recuperação da instalação local**.
Nenhuma imagem foi obtida, nenhum OCR real executado e nenhum deploy ou recurso
cloud criado. A recuperação pendente não foi contornada com edição de metadados
ou execução de scripts apresentados como se fossem `pnpm check` verde.

## Recuperação autorizada — 2026-09-26

O usuário autorizou reconstruir somente `mobile/node_modules`, mantendo a
instalação anterior como backup e o lockfile congelado. A instalação antiga foi
movida, sem exclusão, para `/private/tmp/toonlira-mobile-recovery.NyU9SQ/node_modules`.
Esse backup é temporário, sujeito à limpeza do sistema, e não integra o Git.

A primeira tentativa offline no sandbox encontrou um cache diferente
(`.pnpm-store/v11` na raiz do checkout) e reportou pacote ausente. A instalação
original apontava para o cache do usuário. Com acesso autorizado a esse cache,
`pnpm install --frozen-lockfile --offline --store-dir /Users/ruan/Library/pnpm/store`
concluiu em 4,2s: 976 pacotes adicionados, 975 reutilizados e zero downloads.
O caminho específico foi usado apenas nessa execução, não na configuração do projeto.
Nenhuma política de scripts foi flexibilizada nem houve resolução de novas versões.

O pnpm regenerou seus metadados, agora incluindo somente o pacote mobile e
`workspacePackagePatterns: []`. O lockfile manteve o hash inicial; não houve
edição manual dos metadados. `pnpm check` passou a executar a cadeia normal,
sem instalação implícita. Resultados das duas execuções completas são registrados
no fechamento abaixo.

## Fechamento após recuperação

- `pnpm check` completo executado duas vezes, ambas com exit code 0, sem overrides
  de configuração ou instalação automática entre os scripts.
- Em cada execução: 23 testes de performance, 24 testes SDD, validação de specs e
  links, type-check, ESLint, seis testes FSD, Steiger, validação FSD e Prettier
  aprovados; Jest com **109 suítes e 674 testes aprovados**.
- Avisos preexistentes de `act(...)` em testes de `LocalMediaReviewPanel` e ícones
  não causaram falhas e não foram corrigidos neste escopo.
- O lockfile preservou o SHA-256 inicial após instalação e ambas as execuções.
  Os metadados gerados também permaneceram idênticos entre essas três medições:
  `.pnpm-workspace-state-v1.json` com SHA-256
  `c5ac7a485b6866ea0de6b36bb08bda2ce8b366ff65ac3af8b435b22a1c875dda` e
  `.modules.yaml` com SHA-256
  `341cfeeace0cb2991a75e63e194d58b31747fab48902220ce705b83f53317ef3`.
- A instalação anterior continua disponível no backup temporário indicado acima.

Verdict atualizado: **gates web e mobile deste incremento aprovados**. Os resultados
web e Maven são os registrados na execução anterior; esta recuperação alterou
somente a instalação local e este registro, sem mudanças em código ou dependências.
Este review permanece excluído do checksum SDD para evitar autorreferência.
A MOB-FEAT-018 continua `in-progress`, com avaliação OCR real e validação
operacional pendentes; nenhum upload, provider ou recurso cloud foi habilitado.
