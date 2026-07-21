# Manga Reader Mobile — `mobile/`

Aplicativo React Native com Expo SDK 54 e Expo Router. A fundação e o fluxo de
autenticação existem; as tabs de conteúdo ainda são placeholders.

## Estado atual

Implementado:

- rotas de login, cadastro e recuperação de senha;
- shell das tabs Home, Biblioteca, Fórum e Perfil;
- tema claro/escuro com tokens e preferência do sistema;
- i18n em `pt-BR`, `en-US` e `es-ES`;
- stores Zustand de sessão e configurações;
- cliente Axios com access token, refresh single-flight e `Accept-Language`;
- armazenamento de tokens no Expo SecureStore;
- TanStack Query e componentes básicos reutilizáveis.

Ainda não implementado:

- catálogo e detalhes de obras;
- leitor de capítulos e biblioteca real;
- fórum, perfil e outras tabs com dados;
- testes automatizados;
- notificações, cache offline e build/release com EAS.

## Stack instalada

| Área                   | Tecnologia                            |
| ---------------------- | ------------------------------------- |
| Framework              | Expo 54, React Native 0.81 e React 19 |
| Navegação              | Expo Router 6                         |
| Linguagem              | TypeScript 5.9                        |
| Estado global          | Zustand 5                             |
| Server state           | TanStack Query 5                      |
| HTTP                   | Axios                                 |
| Formulários            | React Hook Form + Zod                 |
| Estilos                | NativeWind 4 + Tailwind CSS 3         |
| i18n                   | i18next + react-i18next               |
| Armazenamento sensível | Expo SecureStore                      |
| Imagens e fontes       | Expo Image + Nunito Sans              |

Bibliotecas planejadas para fases futuras não são listadas como dependências
atuais.

## Estrutura

```text
mobile/
├── app/                  # arquivos de rota do Expo Router; cascas finas
│   ├── (auth)/
│   ├── (tabs)/
│   ├── _layout.tsx
│   └── modal.tsx
├── src/
│   ├── application/      # providers, gates e navegação
│   ├── pages/            # telas completas
│   ├── features/         # interações, atualmente auth
│   └── shared/           # api, tema, i18n, stores, modelos e UI
├── assets/
├── docs/
├── app.json
└── package.json
```

O app segue as dependências do FSD:

```text
pages -> widgets -> features -> entities -> shared
```

Camadas ainda vazias devem ser criadas apenas quando houver responsabilidade
real. Não são permitidos imports cruzados entre slices do mesmo nível.

## Instalação e execução

```bash
cd mobile
pnpm install
pnpm dev
```

Outros alvos:

```bash
pnpm android
pnpm ios       # requer macOS/Xcode
pnpm web
```

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

## Autenticação

- access e refresh tokens são armazenados no SecureStore;
- requests autenticadas recebem `Authorization: Bearer`;
- uma resposta `401` inicia no máximo um refresh e enfileira requests
  concorrentes;
- falha no refresh limpa os tokens e notifica o gate de autenticação;
- o mobile envia o refresh token no body, comportamento aceito pela API.

As telas usam como referência visual os protótipos estáticos em
[`docs/auth-design-reference/README.md`](docs/auth-design-reference/README.md).
Esses arquivos não são dependências de runtime.

## Tema

`src/shared/theme` contém os tokens e o `ThemeProvider`. O tema segue
`useColorScheme()` quando não há override e persiste a escolha no
`settingsStore`.

Componentes reutilizáveis devem consumir os tokens. As classes NativeWind
baseadas em cores `mr-*` ainda não alternam automaticamente com o tema; até que
o dark mode do Tailwind seja integrado ao provider, prefira `useTheme()` para
cores que precisam reagir ao toggle.

## Internacionalização

O mobile possui atualmente dois namespaces:

- `common`;
- `auth`.

Ambos existem nos três idiomas. Novos namespaces devem ser adicionados somente
com a feature correspondente e replicados em todos os locales. Nenhum texto
visível novo deve ser hardcoded.

O idioma é persistido no `settingsStore`, e o cliente envia o valor atual no
header `Accept-Language`.

## Qualidade

Scripts disponíveis:

```bash
pnpm typecheck
pnpm lint
pnpm lint:fsd
pnpm format:check
pnpm check          # executa os quatro comandos anteriores
```

O projeto ainda não possui runner ou script de testes. Adicionar testes faz
parte da evolução antes das telas de dados.

## Roadmap

1. **Core de leitura:** catálogo, busca, detalhe, leitor e biblioteca.
2. **Engajamento:** histórico, avaliações, comentários e perfil.
3. **Comunidade:** fórum, grupos, notícias e eventos.
4. **Monetização:** assinaturas, loja e carrinho.
5. **Polimento:** notificações, cache offline, deep links e testes E2E.

O roadmap expressa intenção de produto, não dependências ou funcionalidades já
entregues.

## Checklist para mudanças

1. `pnpm check` sem erros.
2. Texto visível via i18n nos três idiomas.
3. Cores reativas via tokens de tema.
4. UI reutilizável em `shared/ui`.
5. Boundaries FSD respeitados.
6. Estado implementado e roadmap mantidos separados neste README.

## Links relacionados

- [README principal](../README.md)
- [Workspace web](../web/README.md)
- [Layout FSD](../docs/source-layout.md)
- [Guia de i18n](../docs/i18n-guide.md)
