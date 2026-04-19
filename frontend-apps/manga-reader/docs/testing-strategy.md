# Estratégia de Testes — Frontend

Guia de adoção incremental de testes para o frontend do Manga Reader, alinhado à arquitetura **Feature-Sliced Design**.

---

## Sumário

1. [Introdução e Objetivos](#1-introdução-e-objetivos)
2. [Stack de Testes](#2-stack-de-testes)
3. [Fase 0 — Configuração Inicial](#3-fase-0--configuração-inicial)
4. [Estrutura de Diretórios](#4-estrutura-de-diretórios)
5. [Etapas de Adoção](#5-etapas-de-adoção)
6. [Critérios de Priorização](#6-critérios-de-priorização)
7. [Boas Práticas](#7-boas-práticas)
8. [Padrões por Camada](#8-padrões-por-camada)
9. [Métricas e Evolução](#9-métricas-e-evolução)
10. [Checklist por Feature](#10-checklist-por-feature)

---

## 1. Introdução e Objetivos

### Por que testar?

- **Confiança em refatorações** — alterar código sem medo de quebrar funcionalidades existentes
- **Documentação viva** — testes descrevem o comportamento esperado de cada unidade
- **Prevenção de regressões** — bugs corrigidos não voltam
- **Feedback rápido** — erros detectados antes do deploy

### O que NÃO está no escopo inicial

| Fora do escopo                  | Motivo                                                           |
| ------------------------------- | ---------------------------------------------------------------- |
| Testes E2E (Cypress/Playwright) | Serão adicionados em fase futura, após cobertura unitária sólida |
| Visual regression testing       | Complexidade de setup não justifica o ganho neste momento        |
| Snapshot tests                  | Frágeis e de baixo valor — preferimos testes comportamentais     |

### Meta

Cobertura incremental por camada, começando pelas funções puras e subindo até componentes, priorizando features de alto impacto no negócio.

---

## 2. Stack de Testes

| Ferramenta                      | Propósito               | Por quê?                                                             |
| ------------------------------- | ----------------------- | -------------------------------------------------------------------- |
| **Vitest**                      | Test runner             | Nativo ao Vite, zero-config com nosso setup, API compatível com Jest |
| **@testing-library/react**      | Testes de componentes   | Queries acessíveis, foco no comportamento do usuário                 |
| **@testing-library/user-event** | Simulação de interações | Eventos realistas (click, type, keyboard)                            |
| **@testing-library/jest-dom**   | Matchers para DOM       | `toBeInTheDocument()`, `toHaveTextContent()`, etc.                   |
| **jsdom**                       | Ambiente DOM            | Leve e rápido para ambiente de teste                                 |
| **MSW (Mock Service Worker)**   | Mock de HTTP            | Intercepta no nível de rede — não acoplado ao Axios                  |
| **@vitest/coverage-v8**         | Cobertura de código     | Relatórios de coverage integrados ao Vitest                          |

---

## 3. Fase 0 — Configuração Inicial

### 3.1 Instalar dependências

```bash
npm install -D vitest @testing-library/react @testing-library/user-event \
  @testing-library/jest-dom @vitest/coverage-v8 jsdom msw
```

### 3.2 `vitest.config.ts`

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@feature': path.resolve(__dirname, './src/feature'),
            '@shared': path.resolve(__dirname, './src/shared'),
            '@app': path.resolve(__dirname, './src/app'),
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
        include: ['src/**/*.test.{ts,tsx}'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            include: ['src/**/*.{ts,tsx}'],
            exclude: [
                'src/test/**',
                'src/**/*.d.ts',
                'src/main.tsx',
                'src/vite-env.d.ts',
            ],
        },
    },
});
```

### 3.3 `src/test/setup.ts`

```ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll } from 'vitest';
import { server } from './mocks/server';

// Inicia o MSW antes de todos os testes
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));

// Reseta handlers entre testes para evitar vazamento de estado
afterEach(() => {
    cleanup();
    server.resetHandlers();
});

// Encerra o MSW após todos os testes
afterAll(() => server.close());
```

### 3.4 `src/test/mocks/server.ts`

```ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

### 3.5 `src/test/mocks/handlers/index.ts`

```ts
import { titleHandlers } from './titleHandlers';
// Importar handlers de outras features conforme criados
// import { commentHandlers } from './commentHandlers';

export const handlers = [
    ...titleHandlers,
    // ...commentHandlers,
];
```

### 3.6 `src/test/helpers/renderWithProviders.tsx`

```tsx
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { type ReactElement, type ReactNode } from 'react';

const createTestQueryClient = () =>
    new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                gcTime: 0,
            },
            mutations: {
                retry: false,
            },
        },
    });

interface ProvidersProps {
    children: ReactNode;
}

const AllProviders = ({ children }: ProvidersProps) => {
    const queryClient = createTestQueryClient();

    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>{children}</BrowserRouter>
        </QueryClientProvider>
    );
};

const renderWithProviders = (
    ui: ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllProviders, ...options });

export { renderWithProviders };
export { createTestQueryClient };
```

### 3.7 `src/test/factories/titleFactory.ts` (exemplo)

```ts
import type { Title } from '@feature/manga/type/title.types';

let titleCounter = 0;

export const buildTitle = (overrides: Partial<Title> = {}): Title => {
    titleCounter += 1;

    return {
        id: `title-${titleCounter}`,
        name: `Título de Teste ${titleCounter}`,
        author: 'Autor Teste',
        artist: 'Artista Teste',
        status: 'ONGOING',
        genres: ['Action', 'Adventure'],
        synopsis: 'Sinopse de teste para o título.',
        coverUrl: '/covers/default.jpg',
        rating: 4.5,
        chapters: 100,
        ...overrides,
    };
};

export const buildTitlePage = (
    titles: Title[] = [buildTitle(), buildTitle()],
    page = 0,
) => ({
    content: titles,
    page,
    size: 20,
    totalElements: titles.length,
    totalPages: 1,
    last: true,
});
```

### 3.8 Scripts no `package.json`

```json
{
    "scripts": {
        "test": "vitest run",
        "test:watch": "vitest",
        "test:coverage": "vitest run --coverage"
    }
}
```

---

## 4. Estrutura de Diretórios

Os testes ficam **co-localizados** com o código fonte, seguindo o FSD:

```
src/
├── test/                              # Infraestrutura de testes
│   ├── setup.ts                       # Setup global (MSW, cleanup)
│   ├── helpers/
│   │   └── renderWithProviders.tsx     # Custom render com providers
│   ├── mocks/
│   │   ├── server.ts                  # MSW server
│   │   └── handlers/                  # Handlers por feature
│   │       ├── index.ts
│   │       ├── titleHandlers.ts
│   │       └── commentHandlers.ts
│   └── factories/                     # Factory functions
│       ├── titleFactory.ts
│       ├── commentFactory.ts
│       └── userFactory.ts
│
├── shared/
│   ├── service/util/
│   │   ├── validateId.ts
│   │   └── validateId.test.ts         # ← Co-localizado
│   └── component/button/
│       ├── BaseButton.tsx
│       └── BaseButton.test.tsx         # ← Co-localizado
│
└── feature/
    └── manga/
        ├── service/
        │   ├── titleService.ts
        │   └── titleService.test.ts    # ← Co-localizado
        ├── hook/
        │   ├── useTitle.tsx
        │   ├── useTitle.test.tsx        # ← Co-localizado
        │   └── data/
        │       ├── useTitlesFetch.tsx
        │       └── useTitlesFetch.test.tsx
        └── component/
            ├── TitleCard.tsx
            └── TitleCard.test.tsx       # ← Co-localizado
```

**Convenção de nomes:** `<NomeDoArquivo>.test.ts(x)` — mesmo nome, sufixo `.test`.

---

## 5. Etapas de Adoção

### Fase 1 — Utilitários Shared (fundação)

|                     |                                                                                                     |
| ------------------- | --------------------------------------------------------------------------------------------------- |
| **Camada**          | `shared/service/util/`                                                                              |
| **O que testar**    | Funções puras: `validateId`, `formatDate`, `formatRelativeDate`, `checkValidId`, `apiErrorMessages` |
| **Dificuldade**     | Baixa — sem React, sem providers, sem mocks HTTP                                                    |
| **Volume estimado** | ~5 arquivos de teste, ~20 casos                                                                     |
| **Objetivo**        | Validar que o setup funciona e criar familiaridade com Vitest                                       |

```
shared/service/util/
├── validateId.ts          → validateId.test.ts
├── formatDate.ts          → formatDate.test.ts
├── formatRelativeDate.ts  → formatRelativeDate.test.ts
├── checkValidId.ts        → checkValidId.test.ts
└── apiErrorMessages.ts    → apiErrorMessages.test.ts
```

---

### Fase 2 — Services (camada de API)

|                     |                                                                 |
| ------------------- | --------------------------------------------------------------- |
| **Camada**          | `feature/*/service/`                                            |
| **O que testar**    | Chamadas HTTP corretas, parâmetros, tratamento de erro          |
| **Dificuldade**     | Média — requer MSW para interceptar chamadas                    |
| **Volume estimado** | 13 services, ~3-5 testes cada = ~50 casos                       |
| **Padrão**          | Mock via MSW no nível de rede (nunca mock do Axios diretamente) |

**Ordem de implementação:**

| Prioridade | Service              | Feature  |
| ---------- | -------------------- | -------- |
| 1          | `authService.ts`     | auth     |
| 2          | `titleService.ts`    | manga    |
| 3          | `commentService.ts`  | comment  |
| 4          | `ratingService.ts`   | rating   |
| 5          | `chapterService.ts`  | chapter  |
| 6          | `libraryService.ts`  | library  |
| 7          | `groupService.ts`    | group    |
| 8          | `userService.ts`     | user     |
| 9          | `forumService.ts`    | forum    |
| 10         | `newsService.ts`     | news     |
| 11         | `eventService.ts`    | event    |
| 12         | `storeService.ts`    | store    |
| 13         | `categoryService.ts` | category |

---

### Fase 3 — Hooks (data + facade)

|                     |                                                                               |
| ------------------- | ----------------------------------------------------------------------------- |
| **Camada**          | `feature/*/hook/` e `feature/*/hook/data/`                                    |
| **O que testar**    | Estados (loading, success, error), interface exposta, transformações de dados |
| **Dificuldade**     | Média-alta — requer `renderHook` + QueryClientProvider + MSW                  |
| **Volume estimado** | ~34 hooks                                                                     |

**Padrão de duas camadas:**

1. **Data hooks** (`hook/data/`) — wrappers de `useQuery`. Testar com MSW + `renderHook` + `waitFor`.
2. **Facade hooks** (`hook/`) — interface simplificada. Testar a interface exposta (propriedades retornadas).

**Prioridade:** hooks de features HIGH primeiro (auth → manga → comment → rating → chapter).

---

### Fase 4 — Componentes por Feature

|                  |                                                                 |
| ---------------- | --------------------------------------------------------------- |
| **O que testar** | Renderização, interações do usuário, estados condicionais       |
| **Dificuldade**  | Alta — requer providers, mock de hooks, simulação de interações |
| **Padrão**       | `renderWithProviders` + `userEvent` + MSW                       |

**Ordem de prioridade (impacto no negócio):**

| #   | Feature      | Components | Hooks | Criticidade         |
| --- | ------------ | ---------- | ----- | ------------------- |
| 1   | **auth**     | 0          | 3     | ALTA — segurança    |
| 2   | **manga**    | 13         | 5     | ALTA — domínio core |
| 3   | **comment**  | 17         | 9     | ALTA — core UX      |
| 4   | **rating**   | 9          | 2     | ALTA — core UX      |
| 5   | **chapter**  | 8          | 2     | ALTA — leitura      |
| 6   | **library**  | 5          | 2     | MÉDIA — engajamento |
| 7   | **group**    | 7          | 3     | MÉDIA — comunidade  |
| 8   | **user**     | 15         | 2     | MÉDIA — perfil      |
| 9   | **forum**    | 5          | 2     | MÉDIA — comunidade  |
| 10  | **news**     | 3          | 2     | BAIXA — informativo |
| 11  | **event**    | 2          | 2     | BAIXA — informativo |
| 12  | **store**    | 3          | 0     | BAIXA — informativo |
| 13  | **category** | 1          | 2     | BAIXA — auxiliar    |

---

### Fase 5 — Shared Components

|                  |                                                 |
| ---------------- | ----------------------------------------------- |
| **Camada**       | `shared/component/`                             |
| **O que testar** | Renderização, props, acessibilidade, interações |
| **Volume**       | 36 componentes                                  |

**Prioridade por frequência de uso:**

1. `BaseButton`, `DarkButton`, `RaisedButton` — botões usados em toda a aplicação
2. `BaseInput`, `InlineSearchInput`, `MainSearchInput` — inputs de formulário
3. `BaseModal`, `InfoModal`, `ImageLightbox` — modais
4. `SectionTitle`, `AppLink` — elementos de navegação
5. Demais componentes por demanda

---

## 6. Critérios de Priorização

Ao decidir **o que testar primeiro** dentro de cada fase, aplique estes critérios (em ordem de peso):

| Critério                  | Descrição                                              | Exemplo                                          |
| ------------------------- | ------------------------------------------------------ | ------------------------------------------------ |
| **Impacto no negócio**    | Features que afetam receita ou retenção                | auth, manga, chapter                             |
| **Dependentes**           | Código shared do qual outras features dependem         | `validateId`, `httpClient`, `BaseButton`         |
| **Complexidade**          | Hooks/componentes com lógica condicional significativa | `useComments` (9 hooks internos)                 |
| **Frequência de mudança** | Arquivos modificados frequentemente no git history     | `git log --format='%H' --follow <file> \| wc -l` |
| **Histórico de bugs**     | Áreas que já apresentaram bugs ou erros de TypeScript  | services com PageResponse                        |

---

## 7. Boas Práticas

### Princípios gerais

- **Testar comportamento, não implementação** — o teste deve descrever o que o usuário vê ou o que a função retorna, nunca como ela funciona internamente
- **Padrão AAA** — Arrange (preparar), Act (executar), Assert (verificar) — separados por linha em branco
- **Uma asserção por conceito** — cada `it`/`test` valida um único comportamento
- **Mock na fronteira** — usar MSW para HTTP, nunca `vi.mock('axios')` ou mock de hooks internos
- **Queries acessíveis** — priorizar: `getByRole` > `getByLabelText` > `getByText` > `getByTestId`
- **Nomes descritivos em português** — `"deve exibir mensagem de erro quando ID é inválido"`

### O que NÃO testar

- Estilos CSS ou classes do Tailwind
- Bibliotecas de terceiros (React Query, React Router, Axios)
- Detalhes de implementação (estado interno, chamadas de `setState`)
- Ordem exata de renderização quando irrelevante para o usuário

### Convenções de nomenclatura

```ts
describe('validateId', () => {
    it('deve lançar erro quando id é NaN', () => { ... });
    it('deve aceitar id numérico válido', () => { ... });
});

describe('TitleCard', () => {
    it('deve exibir o nome do título', () => { ... });
    it('deve navegar para a página do título ao clicar', () => { ... });
});
```

---

## 8. Padrões por Camada

### 8.1 Teste de Utilitário (função pura)

```ts
// src/shared/service/util/validateId.test.ts
import { describe, it, expect } from 'vitest';
import validateId from './validateId';

describe('validateId', () => {
    it('deve lançar erro quando id é NaN', () => {
        expect(() => validateId(NaN)).toThrow('ID inválido');
    });

    it('não deve lançar erro para id numérico válido', () => {
        expect(() => validateId(42)).not.toThrow();
    });
});
```

### 8.2 Teste de Service (com MSW)

```ts
// src/feature/manga/service/titleService.test.ts
import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { API_URLS } from '@shared/constant/API_URLS';
import { getTitles, getTitleById } from './titleService';
import { buildTitle, buildTitlePage } from '@/test/factories/titleFactory';

describe('titleService', () => {
    describe('getTitles', () => {
        it('deve retornar página de títulos com parâmetros padrão', async () => {
            const titulos = [buildTitle(), buildTitle()];
            const page = buildTitlePage(titulos);

            server.use(
                http.get(`*${API_URLS.TITLES}`, () =>
                    HttpResponse.json({
                        data: page,
                        success: true,
                    }),
                ),
            );

            const resultado = await getTitles();

            expect(resultado.content).toHaveLength(2);
            expect(resultado.content[0].name).toBe(titulos[0].name);
        });

        it('deve propagar erro quando a API falha', async () => {
            server.use(
                http.get(`*${API_URLS.TITLES}`, () =>
                    HttpResponse.json(null, { status: 500 }),
                ),
            );

            await expect(getTitles()).rejects.toThrow();
        });
    });

    describe('getTitleById', () => {
        it('deve retornar título pelo id', async () => {
            const titulo = buildTitle({ id: 'abc-123' });

            server.use(
                http.get(`*${API_URLS.TITLES}/abc-123`, () =>
                    HttpResponse.json({
                        data: titulo,
                        success: true,
                    }),
                ),
            );

            const resultado = await getTitleById('abc-123');

            expect(resultado.id).toBe('abc-123');
            expect(resultado.name).toBe(titulo.name);
        });
    });
});
```

### 8.3 Teste de Data Hook (useQuery + MSW)

```tsx
// src/feature/manga/hook/data/useTitlesFetch.test.tsx
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { createTestQueryClient } from '@/test/helpers/renderWithProviders';
import { API_URLS } from '@shared/constant/API_URLS';
import { QUERY_KEYS } from '@shared/constant/QUERY_KEYS';
import useTitlesFetch from './useTitlesFetch';
import { buildTitlePage } from '@/test/factories/titleFactory';

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={createTestQueryClient()}>
        {children}
    </QueryClientProvider>
);

describe('useTitlesFetch', () => {
    it('deve retornar dados quando a busca é bem-sucedida', async () => {
        const page = buildTitlePage();

        server.use(
            http.get(`*${API_URLS.TITLES}`, () =>
                HttpResponse.json({ data: page, success: true }),
            ),
        );

        const { result } = renderHook(() => useTitlesFetch(QUERY_KEYS.TITLES), {
            wrapper,
        });

        // Inicialmente em loading
        expect(result.current.isLoading).toBe(true);

        // Após resolução, contém dados
        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data?.content).toHaveLength(2);
    });

    it('deve retornar erro quando a API falha', async () => {
        server.use(
            http.get(`*${API_URLS.TITLES}`, () =>
                HttpResponse.json(null, { status: 500 }),
            ),
        );

        const { result } = renderHook(() => useTitlesFetch(QUERY_KEYS.TITLES), {
            wrapper,
        });

        await waitFor(() => {
            expect(result.current.isError).toBe(true);
        });
    });
});
```

### 8.4 Teste de Facade Hook

```tsx
// src/feature/manga/hook/useTitle.test.tsx
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { createTestQueryClient } from '@/test/helpers/renderWithProviders';
import { API_URLS } from '@shared/constant/API_URLS';
import useTitle from './useTitle';
import { buildTitle } from '@/test/factories/titleFactory';

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={createTestQueryClient()}>
        {children}
    </QueryClientProvider>
);

describe('useTitle', () => {
    it('deve expor title, isLoading e refetchTitle', async () => {
        const titulo = buildTitle({ id: 'title-1' });

        server.use(
            http.get(`*${API_URLS.TITLES}/title-1`, () =>
                HttpResponse.json({ data: titulo, success: true }),
            ),
        );

        const { result } = renderHook(() => useTitle('title-1'), { wrapper });

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.title).toEqual(titulo);
        expect(result.current.isError).toBe(false);
        expect(typeof result.current.refetchTitle).toBe('function');
    });
});
```

### 8.5 Teste de Componente

```tsx
// src/feature/manga/component/TitleCard.test.tsx
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/helpers/renderWithProviders';
import TitleCard from './TitleCard';
import { buildTitle } from '@/test/factories/titleFactory';

describe('TitleCard', () => {
    it('deve exibir o nome e autor do título', () => {
        const titulo = buildTitle({ name: 'One Piece', author: 'Oda' });

        renderWithProviders(<TitleCard title={titulo} />);

        expect(screen.getByText('One Piece')).toBeInTheDocument();
        expect(screen.getByText('Oda')).toBeInTheDocument();
    });

    it('deve exibir imagem de capa com alt text acessível', () => {
        const titulo = buildTitle({ name: 'Naruto' });

        renderWithProviders(<TitleCard title={titulo} />);

        const imagem = screen.getByRole('img');
        expect(imagem).toHaveAttribute('alt');
    });

    it('deve chamar callback ao clicar no card', async () => {
        const user = userEvent.setup();
        const titulo = buildTitle();

        renderWithProviders(<TitleCard title={titulo} />);

        const link = screen.getByRole('link');
        await user.click(link);

        // Verificar navegação ou callback conforme implementação
    });
});
```

---

## 9. Métricas e Evolução

### Metas de cobertura por fase

| Fase | Escopo                   | Meta                     |
| ---- | ------------------------ | ------------------------ |
| 0    | Setup funcional          | Vitest roda com 0 falhas |
| 1    | `shared/service/util/`   | 90%+ statements          |
| 2    | `feature/*/service/`     | 80%+ branches            |
| 3    | `feature/*/hook/` (HIGH) | 80%+ statements          |
| 4    | Componentes HIGH         | 70%+ statements          |
| 5    | Cobertura global         | 60%+ statements          |

### Integração contínua

```yaml
# Adicionar ao pipeline de CI
- name: Testes Frontend
  run: cd frontend && npm run test:coverage

- name: Coverage Gate
  run: |
      # PR não pode reduzir cobertura global
      # Configurar threshold no vitest.config.ts:
      # coverage.thresholds.lines: 60
```

### Evolução futura

Após atingir a Fase 5:

1. **Testes E2E** — Playwright para fluxos críticos (login → busca → leitura)
2. **Component testing no navegador** — Vitest Browser Mode ou Storybook
3. **Mutation testing** — Stryker para validar qualidade dos testes
4. **CI parallelizado** — sharding de testes para reduzir tempo de feedback

---

## 10. Checklist por Feature

Use este template ao testar cada feature. Uma feature é considerada **testada** quando todos os itens aplicáveis estão marcados:

```markdown
## Feature: [nome]

### Services

- [ ] Happy path de cada função exportada
- [ ] Tratamento de erro (API retorna 4xx/5xx)
- [ ] Parâmetros opcionais e valores padrão

### Data Hooks

- [ ] Estado loading inicial
- [ ] Estado de sucesso com dados corretos
- [ ] Estado de erro com mensagem apropriada

### Facade Hooks

- [ ] Interface exposta (propriedades e funções retornadas)
- [ ] Transformações de dados aplicadas corretamente

### Componentes

- [ ] Renderização com props obrigatórias
- [ ] Renderização com props opcionais / valores padrão
- [ ] Interações do usuário (click, input, submit)
- [ ] Estados condicionais (loading, empty, error)
- [ ] Acessibilidade (roles, labels, alt text)

### Qualidade

- [ ] Nenhum `test.skip` ou `test.todo` pendente
- [ ] Todos os testes passam: `npm run test`
- [ ] Coverage da feature dentro da meta da fase atual
```

---

## Referência Rápida

| Preciso testar...    | Ferramenta                      | Template                                    |
| -------------------- | ------------------------------- | ------------------------------------------- |
| Função pura          | Vitest puro                     | [8.1](#81-teste-de-utilitário-função-pura)  |
| Service (API call)   | Vitest + MSW                    | [8.2](#82-teste-de-service-com-msw)         |
| Data hook (useQuery) | renderHook + MSW                | [8.3](#83-teste-de-data-hook-usequery--msw) |
| Facade hook          | renderHook + MSW                | [8.4](#84-teste-de-facade-hook)             |
| Componente React     | renderWithProviders + userEvent | [8.5](#85-teste-de-componente)              |
