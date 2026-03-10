# Plano de Testes — Domain: Comment

## Contexto

Módulo de comentários da plataforma. Contém a entidade `Comment` (MongoDB) que suporta comentários em títulos com hierarquia pai/filho (replies), reações (like/dislike) e flags de edição e destaque.

### Artefatos

| Classe | Tipo | Persistência |
|--------|------|-------------|
| `Comment` | Entity | MongoDB (`comments`) |

---

## Entradas

### Comment (Builder)

| Campo | Tipo | Obrigatório | Default | Restrições |
|-------|------|:-----------:|---------|------------|
| `id` | String | Não (auto) | MongoDB ObjectId | PK |
| `titleId` | String | Não | null | `@Indexed` |
| `parentCommentId` | String | Não | null | `@Indexed`, null = root comment |
| `userId` | String | Não | null | `@Indexed` |
| `userName` | String | Não | null | Desnormalizado do User |
| `userPhoto` | String | Não | null | Desnormalizado do User |
| `isHighlighted` | boolean | Não | `false` | `@Builder.Default` |
| `wasEdited` | boolean | Não | `false` | `@Builder.Default` |
| `textContent` | String | Não | null | Conteúdo textual |
| `imageContent` | String | Não | null | URL de imagem |
| `likeCount` | int | Não | `0` | `@Builder.Default` |
| `dislikeCount` | int | Não | `0` | `@Builder.Default` |
| `createdAt` | LocalDateTime | Não (auto) | `@CreatedDate` | — |

---

## Saídas

- Instância de `Comment` com defaults: isHighlighted=false, wasEdited=false, likeCount=0, dislikeCount=0
- `parentCommentId` null indica comentário raiz; preenchido indica reply

---

## Fluxos felizes

1. **Builder com campos mínimos** — cria Comment com todos os defaults aplicados (false, false, 0, 0)
2. **Comentário raiz** — `parentCommentId = null`, vinculado a um `titleId`
3. **Reply (resposta)** — `parentCommentId` preenchido com ID de outro Comment
4. **Comentário com texto e imagem** — ambos `textContent` e `imageContent` preenchidos
5. **Comentário apenas texto** — `imageContent = null`
6. **Comentário apenas imagem** — `textContent = null`
7. **Construtor vazio** — instância válida para Spring Data
8. **Defaults via builder** — likeCount=0, dislikeCount=0, isHighlighted=false, wasEdited=false
9. **Dados desnormalizados** — userName e userPhoto copiados do User no momento da criação

---

## Fluxos tristes

1. **Comment sem titleId** — aceito pelo MongoDB (sem not null), mas inválido semanticamente
2. **Comment sem userId** — idem; comentário sem dono
3. **Comment sem textContent e sem imageContent** — comentário vazio; sem validação na entidade
4. **likeCount ou dislikeCount negativo** — sem validação; aceita valores negativos
5. **parentCommentId referenciando ID inexistente** — sem integridade referencial no MongoDB
6. **wasEdited alterado manualmente para false após edição** — sem proteção na entidade

---

## Regras de negócio e validações

- **Hierarquia pai/filho**: `parentCommentId = null` → root; preenchido → reply
- **Dados desnormalizados**: userName e userPhoto são cópias imutáveis no momento da criação (atualizados pelo consumer de desnormalização RabbitMQ)
- **wasEdited**: deve ser setado para `true` quando o comentário é editado (lógica no use case, não na entidade)
- **Sem validação na entidade** — todas as regras são aplicadas na camada de aplicação
- **Indexes**: titleId, parentCommentId, userId — otimizam queries por título e por thread

---

## Dependências relevantes

- Spring Data MongoDB: `@Document`, `@Id`, `@Indexed`, `@CreatedDate`
- Lombok: `@Builder`, `@Builder.Default`, `@Getter`, `@Setter`, `@NoArgsConstructor`, `@AllArgsConstructor`

---

## Observações para implementação dos testes

- **Sem mocks necessários**: testes unitários puros
- **Foco principal**: verificar defaults do builder (false, false, 0, 0)
- **Foco secundário**: cenários de comment root vs reply (parentCommentId null vs preenchido)
- **Hipótese a validar**: se `@Builder.Default` nos primitivos (boolean, int) funciona corretamente — diferença entre `boolean` (false por JVM) e `Boolean` (null por default)
- **Lacuna**: sem validação de conteúdo — um Comment pode existir sem textContent e sem imageContent
- **Lacuna**: likeCount/dislikeCount podem ficar negativos sem proteção

---

## Status

- Mapeado: Sim
- Testes implementados: 0
- Pendências: Builder defaults, hierarquia parent/reply, cenários de dados desnormalizados
