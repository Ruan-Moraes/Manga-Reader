# Clean Code Guidelines

Convenções de código e estilo (backend + frontend). Ler ao escrever código novo:
naming, imports, Tailwind, mobile-first, i18n. Referenciado por `CLAUDE.md`.

### Constantes sobre Magic Numbers
- Substituir valores hard-coded por constantes nomeadas com nomes descritivos
- Manter constantes no topo do arquivo ou em arquivo dedicado

### Nomes Significativos
- Variáveis, funções e classes devem revelar seu propósito
- Evitar abreviações, exceto as universalmente compreendidas

### Comentários Inteligentes
- Não comentar **o quê** o código faz — tornar o código autoexplicativo
- Comentar **por quê** algo é feito de determinada forma
- Documentar APIs, algoritmos complexos e side effects não óbvios

### Responsabilidade Única
- Cada função faz exatamente uma coisa, pequena e focada
- Se precisa de comentário para explicar o que faz, deve ser dividida

### DRY (Don't Repeat Yourself)
- Extrair código repetido em funções reutilizáveis
- Manter single sources of truth

### Imports
- **Sempre dar preferência a `import`** em vez de nome totalmente qualificado
  inline. Proibido referenciar tipos via FQN no corpo do código (ex.:
  `org.springframework.dao.DataAccessException e`, `new com.x.Foo()`,
  `java.util.UUID id`) — declarar o `import` no topo.
- Preferir **`import static`** para helpers/constantes usados de forma idiomática
  e repetida: asserts (`assertThat`), Mockito (`when`, `verify`, `any`),
  matchers MockMvc (`get`, `status`, `jsonPath`), `Aggregation.*` quando melhora
  legibilidade.
- Exceção única: conflito de nome entre dois tipos no mesmo arquivo — aí
  qualificar o menos usado.

### Encapsulamento
- Esconder detalhes de implementação, expor interfaces claras
- Mover condicionais aninhados para funções bem nomeadas

### Qualidade Contínua
- Refatorar continuamente; corrigir tech debt cedo
- Deixar o código mais limpo do que encontrou

### Mobile-First
- CSS: estilos base para mobile, media-queries para telas maiores (sm → md → lg)
- Tailwind: escrever classes base sem prefixo, adicionar `sm:`, `md:`, `lg:` para breakpoints maiores
- Admin sidebar: colapsável em mobile (`<md`), hamburger no header, overlay com backdrop
- Tabelas: `overflow-x-auto` + colunas opcionais com `hiddenOnMobile: true` (escondidas em `<sm`)
- Grids: `grid-cols-1` base, expandir com `sm:grid-cols-2`, `md:grid-cols-3`, `lg:grid-cols-4`
- Textos longos (nomes, labels): usar `hidden sm:inline` para versões completas em mobile
- Breakpoints customizados: `mobile-sm` (320px), `mobile-md` (375px), `mobile-lg` (425px)

### Styling — Tailwind por Padrão
- Estilizar com **classes Tailwind** (tokens `mr-*` definidos em `src/styles/index.css`,
  ex.: `bg-mr-secondary`, `text-mr-accent`, `border-mr-separator`, `rounded-mr-xs`,
  `font-mr-bold`). `style={{}}` inline é **proibido para valores estáticos**.
- Inline (`style={{}}`) permitido **apenas** para valores dinâmicos calculados em
  runtime (ex.: posição/altura derivada de medição, cor vinda de dado). A mesma regra
  vale para web e mobile.
- Cores, spacing e radii: usar tokens do tema (`--mr-*` / `@theme` em `index.css`),
  **não** hex solto. Se faltar um token, criar um novo em vez de inline.
- `cn` (`@shared/lib/cn`) é só `clsx` (sem tailwind-merge): **não** sobreponha duas
  utilitárias para a mesma propriedade (ex.: `h-10` + `h-full`) esperando override;
  use uma variante de classe dedicada.
- Variáveis dinâmicas que viram classe condicional: passar a classe inteira no
  ramo (`checked ? 'left-[22px] bg-mr-primary' : 'left-0.5 bg-mr-gray-300'`), nunca
  interpolar valor dentro do nome da classe.

### Internationalization (i18n) — Obrigatório em Novas Telas
- **Toda tela nova** deve implementar suporte a i18n (português, inglês, espanhol, mínimo)
- **Nenhum texto hardcoded** em componentes — usar chaves de tradução
- **Padrão**: `i18n('chave.traducao')` ou `t('chave.traducao')` dependendo da biblioteca
- **Estrutura de arquivos**: `locales/{lang}.json` com namespaces por feature
- **Validação**: Verificar se todas as chaves estão presentes em todos os idiomas suportados
- **Exceções permitidas**: Labels de API, nomes próprios, códigos técnicos (mas com fallback i18n)
- **Datas, números, moedas**: Usar formatadores localizados (Intl API ou biblioteca i18n)
