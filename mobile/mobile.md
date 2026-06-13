# Manga Reader — Mobile App Planning

## Stack

| Camada        | Tecnologia                                   |
| ------------- | -------------------------------------------- |
| Framework     | React Native + Expo SDK (latest)             |
| Linguagem     | TypeScript                                   |
| Navegação     | Expo Router (file-based, deep links nativos) |
| Estado global | Zustand                                      |
| Server state  | TanStack Query v5                            |
| HTTP          | Axios + interceptors (auth, refresh token)   |
| Forms         | React Hook Form + Zod                        |
| UI            | NativeWind (Tailwind para RN)                |
| Auth storage  | Expo SecureStore (JWT)                       |
| Imagens       | Expo Image (cache nativo)                    |
| Leitor        | FlashList horizontal + pré-fetch de páginas  |
| Notificações  | Expo Notifications                           |
| OTA updates   | Expo Updates                                 |

---

## Funcionalidades (mapeadas ao backend)

| Módulo backend | Telas/fluxos mobile                                           |
| -------------- | ------------------------------------------------------------- |
| Auth           | Login, Registro, Recuperação de senha, Refresh token          |
| User/Profile   | Perfil próprio, edição, histórico de leitura, content locales |
| Category/Label | Browse por categoria, filtros, tags                           |
| Manga/Chapter  | Listagem, detalhe, leitor de capítulos                        |
| Library        | Biblioteca pessoal, progresso por título                      |
| Rating         | Avaliação inline (estrelas)                                   |
| Comment        | Comentários por capítulo                                      |
| Forum/Group    | Feed, tópicos, posts, grupos                                  |
| News/Event     | Feed de notícias, eventos                                     |
| Subscription   | Tela de planos, gestão de assinatura                          |
| Store          | Loja de itens, carrinho                                       |
| Stats          | Dashboard: capítulos lidos, tempo, streak                     |

---

## Estrutura de pastas

```
mobile/
├── app/                          # Expo Router — rotas (file-based)
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/
│   │   ├── index.tsx             # Home/Discover
│   │   ├── library.tsx           # Biblioteca pessoal
│   │   ├── forum.tsx             # Fórum
│   │   └── profile.tsx           # Perfil
│   ├── manga/
│   │   ├── [id].tsx              # Detalhe do mangá
│   │   └── [id]/
│   │       └── chapter/[chapterId].tsx   # Leitor
│   ├── store/index.tsx
│   ├── subscription/index.tsx
│   └── _layout.tsx
├── src/
│   ├── components/               # UI atoms/molecules reutilizáveis
│   ├── features/                 # Lógica por domínio
│   │   ├── auth/
│   │   ├── manga/
│   │   ├── library/
│   │   ├── forum/
│   │   ├── store/
│   │   └── profile/
│   ├── hooks/                    # Custom hooks cross-feature
│   ├── services/                 # API clients (axios instances)
│   ├── stores/                   # Zustand stores
│   ├── types/                    # TypeScript types/interfaces
│   └── utils/
├── assets/
├── app.json
├── package.json
└── tsconfig.json
```

---

## Integração com o Backend

- **Base URL**: configurável via `.env`
    - Dev: `http://localhost:8080`
    - Prod: `https://api.mangareader.com`
- **Auth**: Bearer JWT armazenado no `Expo SecureStore`
- **Interceptor Axios**:
    - Injeta `Authorization: Bearer <token>` em todo request
    - Interceptor de response: em 401, tenta refresh token; em falha, redireciona para login
- **I18n**: respeitar header `Accept-Language` nas requests (alinha com backend `AcceptHeaderLocaleResolver`)
- **Paginação**: backend retorna `ApiResponse<PageResponse<T>>` — acesso via `response.data.data.content`
- **TanStack Query**: cache de mangás, capítulos, perfil; `staleTime` de 5min para listagens, 1min para conteúdo dinâmico

---

## Fases de implementação

### Fase 1 — Fundação (Alta prioridade)

- Setup Expo + Expo Router + TypeScript
- Configuração NativeWind + tema
- Serviço Axios + interceptors auth
- TanStack Query setup
- Fluxo completo de auth (login, registro, refresh token, logout)
- Tab navigation base (Home, Library, Forum, Profile)

### Fase 2 — Core de leitura (Alta prioridade)

- Listagem e busca de mangás com filtros por categoria/tag
- Tela de detalhe do mangá (capa, sinopse, capítulos, rating)
- Leitor de capítulos (FlashList horizontal, pré-fetch, modo tela cheia)
- Adicionar/remover da biblioteca pessoal

### Fase 3 — Engajamento (Média prioridade)

- Histórico de leitura + progresso por capítulo
- Sistema de avaliação (estrelas)
- Comentários por capítulo
- Perfil com stats de leitura (dashboard)

### Fase 4 — Comunidade (Média prioridade)

- Feed de fórum + tópicos
- Criação e resposta de posts
- Grupos de leitura
- Feed de notícias e eventos

### Fase 5 — Monetização (Baixa prioridade)

- Tela de planos de assinatura
- Loja de itens
- Carrinho e checkout (integração com gateway já no backend)

### Fase 6 — Polimento (Baixa prioridade)

- Notificações push (novos capítulos, respostas no fórum)
- Cache offline de capítulos já lidos (Expo FileSystem)
- Deep links: `mangareader://manga/[id]`, `mangareader://chapter/[id]`
- OTA updates via Expo Updates
- Testes E2E com Maestro

---

## Considerações técnicas

### Leitor de capítulos

- `FlashList` horizontal (melhor performance que `FlatList` para listas longas)
- Pré-fetch das próximas 3 páginas via TanStack Query `prefetchQuery`
- Modo tela cheia com ocultação de UI (tap para toggle)
- Suporte a scroll vertical (manhwas/manhuas) configurável por título
- Cache de imagens via Expo Image

### Performance

- Lazy loading de rotas via Expo Router (code splitting automático)
- Zustand com slices isolados por feature (evitar re-renders desnecessários)
- TanStack Query com `select` para derivar subsets de dados sem re-render

### Segurança

- JWT no `Expo SecureStore` (não AsyncStorage — dados criptografados pelo SO)
- Validação de inputs com Zod antes de enviar para a API
- Sem dados sensíveis em logs em produção

### I18n

- Suporte a pt-BR, en-US, es-ES (alinhado ao backend)
- Biblioteca: `i18next` + `react-i18next`
- Datas e números: `Intl` API nativa

### Testes

- Unit/integration: React Native Testing Library + Vitest (ou Jest)
- E2E: Maestro
- Mock de API: MSW v2

---

## Pontos de atenção antes de iniciar

- [ ] Definir SDK Expo mínimo (recomendado: SDK 51+)
- [ ] Confirmar gateway de pagamento para Fase 5 (já integrado no backend?)
- [ ] Verificar se backend tem endpoint de WebSocket/SSE para notificações em tempo real
- [ ] Definir política de deep links com o time (esquema `mangareader://` ou universal links)
- [ ] Confirmar ambientes: dev local, staging, prod
