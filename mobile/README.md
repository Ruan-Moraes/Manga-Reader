# Toonlira Mobile — `mobile/`

Aplicativo React Native com Expo SDK 57 e Expo Router. O app inicia em um
launcher público; a plataforma autenticada permanece em construção e suas tabs
de conteúdo não são expostas.

Este README é a referência técnica do módulo. Os contratos comportamentais e o
workflow de desenvolvimento ficam em [`docs/specs/`](docs/specs/README.md), sob os
guardrails de [`AGENTS.md`](AGENTS.md).

O baseline brownfield possui paridade arquivo→spec verificada por
[`docs/specs/coverage.json`](docs/specs/coverage.json). Código existente é descrito por
`OBS-*`; mudanças futuras continuam exigindo Target Spec aprovada com `AC-*`.
Código executado com verificação real pendente usa `verification-pending` e não é
apresentado como concluído.

## Estado atual

Implementado:

- seletor público entre plataforma e tradução local-first;
- importação guest-first de uma ou várias imagens pelo seletor do sistema;
- revisão virtualizada do draft em Grade minimalista ou Lista, preview ampliado privado, adição/remoção, ordenação persistente por arraste na imagem, aviso de possível duplicata e confirmação local;
- seleção independente e persistente entre sete idiomas e 42 pares direcionais,
  com chinês simplificado e tradicional separados;
- validação local sequencial de JPEG, PNG e WebP estáticos pelos bytes reais, com galeria virtualizada, resumo do lote, correção localizada por página, limites defensivos, retry seletivo e revalidação física da otimização de persistência concluída;
- preparação local de projeto privado com páginas ordenadas, snapshot validado,
  SQLite v6, estados canônicos e restauração determinística validada em Android
  físico;
- fundação do processamento remoto com tentativas e consentimento versionado
  em SQLite, capabilities validadas e identidade anônima no SecureStore;
  integração volátil em verificação, desabilitada enquanto o gateway não for admitido;
- simulador de tradução estritamente de desenvolvimento, com resultados e
  regiões marcados permanentemente como demonstração e sem chamadas remotas;
- controles do leitor sobrepostos e compactos, toque/deslize configuráveis e navegação lateral opcional nos modos paginado/duplo; controles visíveis em repouso são uma opção acessível e ocultam durante a rolagem;
- configurações dentro do leitor em folha parcial expansível, com abas Leitura, Aparência e Gestos, seletores compactos e ajuda contextual; validação iOS parcial em `MOB-FEAT-054`, com Android e métricas nativas pendentes;
- leitor imersivo unificado para capítulos e resultados locais, com fluxo
  vertical em largura integral, modos paginado/duplo preservados, overlay
  demonstrativo sobre a imagem, comparação global e retomada offline;
- preview textual virtualizado de novels, disponível somente em desenvolvimento;
- SQLite v10 preserva resultados, regiões, progresso e metadados de tradução
  da v9 e adiciona o último estado de recibo volátil conhecido, com migrations
  aditivas, integridade por FK/hash, reconciliação de arquivos e backup
  automático Android desabilitado;
- migração SQLite v1/v2/v3→v4 preservando drafts, itens, ordem, idiomas e resultados por página;
- draft ativo durável com metadados em SQLite e arquivos no diretório privado do app;
- cancelamento, substituição atômica, recuperação do resultado pendente Android e erros localizados, sem tradução simulada;
- status autenticado da plataforma, sem expor tabs incompletas;
- rotas de login, cadastro e recuperação de senha com retorno interno seguro;
- leitor público de capítulos com modos vertical, paginado e duplo, preferências e progresso autenticado;
- tema claro/escuro com tokens e preferência do sistema;
- i18n em `pt-BR`, `en-US` e `es-ES`;
- preferências locais v3 com merge seletivo na autenticação e gestos do leitor exclusivos do dispositivo;
- stores Zustand de sessão (`entities/session`) e configurações;
- cliente Axios com access token, refresh single-flight e `Accept-Language`;
- armazenamento de tokens no Expo SecureStore;
- TanStack Query e componentes básicos reutilizáveis;
- testes automatizados para os riscos centrais de fundação, auth e navegação.

Em verificação ou ainda não implementado:

- validação completa do fluxo OCR→tradução→renderização→leitor com a nova resposta
  direta. A [DEC-008](docs/decisions/MOB-DEC-008-volatile-processing.md), aprovada
  em 2026-11-01, exige processamento de conteúdo em memória no servidor e
  armazenamento privado no aparelho. A 017 integra consentimento versionado,
  submissão binária, recibos sem conteúdo, interrupção local e ambiguidade sem
  reenvio automático. As revisões técnicas
  017–019 estão em verificação, com qualidade humana e admissão abertas. As
  etapas 020/021 têm gates abertos após essa revisão; a aquisição direta e o
  commit local da 021 estão tecnicamente prontos em verification-pending,
  com ciclo nativo/offline ainda sem prova. A 020 continua em execução, com
  provas locais da candidata6 e admissão AMD64 pendente. Evidências de aquisição
  pelo transporte anterior são históricas. O resultado só pode ser
  `READY` após validação e commit local. O simulador não libera esse fluxo;
- catálogo, detalhes de obras e biblioteca sincronizada com conta;
- fórum, perfil e outras tabs com dados;
- testes E2E;
- notificações, cache offline e build/release com EAS.

## Stack instalada

| Área                     | Tecnologia                              |
| ------------------------ | --------------------------------------- |
| Framework                | Expo 57, React Native 0.86 e React 19.2 |
| Navegação                | Expo Router 57                          |
| Linguagem                | TypeScript 6.0                          |
| Estado global            | Zustand 5                               |
| Server state             | TanStack Query 5                        |
| HTTP                     | Axios                                   |
| Formulários              | React Hook Form + Zod                   |
| Estilos                  | NativeWind 4 + Tailwind CSS 3           |
| i18n                     | i18next + react-i18next                 |
| Armazenamento sensível   | Expo SecureStore                        |
| Dados locais relacionais | Expo SQLite                             |
| Arquivos privados        | Expo FileSystem                         |
| Seleção de imagens       | Expo ImagePicker / picker do sistema    |
| Imagens e fontes         | Expo Image + Nunito Sans                |
| Ordenação por gesto      | Reanimated + Worklets + Gesture Handler |

Bibliotecas planejadas para fases futuras não são listadas como dependências
atuais.

## Estrutura

```text
mobile/
├── .agents/skills/        # papéis reutilizáveis do workflow SDD
├── src/
│   ├── app/              # cascas de rota do Expo Router
│   ├── application/      # app layer local: providers, gates e navegação
│   ├── pages/            # telas completas
│   ├── widgets/          # blocos compostos
│   ├── features/         # ações, inclusive autenticação e importação local
│   ├── entities/         # sessão, settings, capítulos e drafts de mídia local
│   └── shared/           # api, navegação técnica, tema, i18n e UI genérica
├── assets/
├── docs/                 # specs, decisões, planos, referências e legado
├── scripts/
│   ├── checks/           # executáveis dos gates de validação
│   ├── lib/              # validadores reutilizáveis pelos checks e testes
│   └── tests/            # testes Node dos validadores
├── app.json
└── package.json
```

O app segue as dependências do FSD:

```text
application -> pages -> widgets -> features -> entities -> shared
```

`src/application` representa a app layer lógica; `src/app` é reservado às
cascas de rota do Expo Router. Não são permitidos imports cruzados entre slices do mesmo nível; entities
usam `@x` somente para cross-reference tipada explícita.

## Instalação e execução

Requisitos recomendados para o SDK 57: Node.js 22.13 ou superior, Xcode 26.4 ou
superior para iOS e JDK 17 para Android. O projeto mira iOS 16.4+ e Android 7+
(API 24, compile/target SDK 36).

```bash
cd mobile
pnpm install --frozen-lockfile
pnpm dev
```

O módulo fixa `pnpm@11.10.0` em `packageManager`. O workspace local contém
somente o pacote mobile; `web/` mantém seu workspace independente.
[`pnpm-workspace.yaml`](pnpm-workspace.yaml) mantém o virtual store local e
`verifyDepsBeforeRun: error`: executar `pnpm check` ou outro script não instala
nem remove dependências implicitamente. Uma instalação desatualizada deve
produzir erro explícito, sem desabilitar a verificação para liberar o gate.

Instalação e validação são ações separadas. Para reconciliar metadados usando
somente o cache existente, executar explicitamente `pnpm install --frozen-lockfile
--offline`. Se faltar pacote ou o gerenciador solicitar recriação de
`node_modules`, interromper e avaliar a recuperação antes de prosseguir; não
usar `--force`, apagar módulos ou liberar scripts indiscriminadamente. Nenhuma
atualização do lockfile é necessária para estes checks.

Diagnóstico e limitações da estabilização estão no
[registro de gates de 2026-09-26](docs/active/gates-2026-09-26/review.md).

Outros alvos:

```bash
pnpm android
pnpm ios       # requer macOS/Xcode
pnpm web
```

O workflow CNG mantém `ios/` e `android/` gerados somente no dispositivo local,
fora do Git, da cobertura SDD, do ESLint e do Prettier. Esses arquivos não devem
ser apagados para executar os gates. Código próprio permanece em `src/`, com
classificação individual obrigatória no manifesto de cobertura.

## Configuração da API

O cliente usa:

```text
EXPO_PUBLIC_API_URL=http://localhost:8080
```

Se a variável não existir, o fallback é `http://localhost:8080`. Em dispositivo
físico, `localhost` aponta para o próprio aparelho; use um host da rede local ou
outro endereço acessível pelo dispositivo.

O cliente acrescenta `/api`, portanto a variável deve conter apenas a origem,
sem `/api` no final.

O gateway de tradução usa uma origem independente
(`EXPO_PUBLIC_TRANSLATION_GATEWAY_URL`) sem `/api` da Core. Apenas origens HTTPS
sem path, credenciais, query ou fragment são aceitas; ausência ou configuração
inválida fecha o upload e nunca ativa fallback direto para provider. Consulte o
[plano arquitetural aprovado](../docs/translation-gateway-plan.md).

## Autenticação

- access e refresh tokens são armazenados no SecureStore;
- requests autenticadas recebem `Authorization: Bearer`;
- uma resposta `401` inicia no máximo um refresh e enfileira requests
  concorrentes;
- falha no refresh limpa os tokens e notifica o gate de autenticação;
- o mobile envia o refresh token no body, comportamento aceito pela API.

As telas de autenticação seguem os contratos e evidências registrados no
[registry SDD](docs/specs/registry.md); protótipos externos não são dependências
de runtime deste repositório.

## Tema

`src/shared/theme` contém os tokens e o `ThemeProvider`. O tema segue
`useColorScheme()` quando não há override e persiste a escolha no
`settingsStore`.

Componentes reutilizáveis devem consumir os tokens. As classes NativeWind
baseadas em cores `ui-*` ainda não alternam automaticamente com o tema; até que
o dark mode do Tailwind seja integrado ao provider, prefira `useTheme()` para
cores que precisam reagir ao toggle.

## Internacionalização

O mobile possui atualmente sete namespaces:

- `common`;
- `auth`;
- `launcher`;
- `reader`;
- `settingsNavigation`;
- `remoteProcessing`.
- `localTranslation`.

Todos existem nos três idiomas. Novos namespaces devem ser adicionados somente
com a feature correspondente e replicados em todos os locales. Nenhum texto
visível novo deve ser hardcoded.

O idioma é persistido no `settingsStore`, e o cliente envia o valor atual no
header `Accept-Language`.

## Qualidade

Scripts disponíveis:

```bash
pnpm specs:check
pnpm test
pnpm test:ci
pnpm typecheck
pnpm lint
pnpm lint:fsd
pnpm format:check
pnpm check          # specs + typecheck + lint + FSD + format + testes
```

O runner usa Jest com `jest-expo` e React Native Testing Library. Não há meta
percentual arbitrária: cada critério de aceite relevante deve indicar seu teste
ou outra evidência adequada na Target Spec.

## Spec-Driven Development

Antes de alterar comportamento:

1. consultar [`docs/specs/registry.md`](docs/specs/registry.md);
2. confirmar a cobertura do arquivo em [`docs/specs/coverage.json`](docs/specs/coverage.json) e aplicar Reverse Spec se a área ainda não estiver documentada;
3. criar uma Target Spec `draft` em `docs/specs/features/`;
4. obter aprovação humana antes de tasks ou código;
5. implementar, testar, revisar e auditar drift seguindo `AGENTS.md`.

Baselines descrevem apenas como o código funciona hoje. Eles não transformam
login obrigatório, dependência da Core ou placeholders em requisitos futuros.

## Roadmap

1. **Entrada local:** revisão, ordenação, idiomas independentes e validação da mídia.
2. **Prova ponta a ponta:** consentimento remoto, gateway separado, OCR,
   tradução, renderização e reader local. O contrato vigente 017–021 é volátil:
   nenhum conteúdo persistido no servidor, entrega na mesma sessão e validação/
   commit no aparelho antes da leitura. 017–019 e 021 estão em verification-pending;
   020 está in-progress e os gates de 020/021 estão abertos. As revisões e o
   [registry](docs/specs/registry.md) identificam
   as provas atuais e as pendências, sem herdar aceites do transporte anterior.
3. **Continuidade:** processamento incremental e retry; biblioteca e retomada
   offline locais estão implementadas com verificação física pendente.
4. **Qualidade e proteção:** edição, benchmark, identidade anônima, quotas e controle de abuso.
5. **Produção:** privacidade, observabilidade, E2E, hardware físico e release Google Play.

O roadmap expressa direção não normativa, não dependências ou funcionalidades
entregues. Cada item só se torna implementável por meio de uma Target Spec
aprovada.

## Checklist para mudanças

1. `pnpm check` sem erros.
2. Target Spec aprovada e tasks rastreáveis para qualquer mudança comportamental.
3. Texto visível via i18n nos três idiomas.
4. Cores reativas via tokens de tema.
5. UI reutilizável em `shared/ui`.
6. Boundaries FSD respeitados.

## Links relacionados

- [README principal](../README.md)
- [Guardrails SDD](AGENTS.md)
- [Índice da documentação mobile](docs/README.md)
- [Workflow e contratos SDD](docs/specs/README.md)
- [Registry de specs](docs/specs/registry.md)
- [Workspace web](../web/README.md)
- [Layout FSD](../docs/source-layout.md)
- [Guia de i18n](../docs/i18n-guide.md)

## Arquivo de performance

Relatórios, evidências e ferramentas foram movidos por solicitação do proprietário
para a pasta externa `../perfomance_app/` (a partir da raiz do monorepo).
As correções funcionais existentes, incluindo C06, foram preservadas.

## Preview textual de desenvolvimento

O leitor de novel permanece exclusivo de desenvolvimento, com capítulo sintético longo.
“Texto e aparência” personaliza fonte, tamanho, entrelinha, margens e fundo apenas no
leitor textual. Preferências locais usam envelope v4 e não são enviadas à API; a posição
fica somente na sessão. Mudanças de layout preservam parágrafo e fração relativa, não
a mesma linha. Ver [MOB-FEAT-053](docs/specs/features/MOB-FEAT-053-novel-reading/spec.md)
e suas [evidências e pendências](docs/specs/features/MOB-FEAT-053-novel-reading/evidence/validation.md).
