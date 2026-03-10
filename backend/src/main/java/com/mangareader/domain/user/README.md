# Plano de Testes — Domain: User

## Contexto

Módulo de usuário da plataforma. Contém a entidade principal `User` (PostgreSQL), a entidade auxiliar `UserSocialLink` e o enum `UserRole`. O `User` é referenciado por praticamente todos os outros módulos (auth, library, group, forum, comment, rating).

### Artefatos

| Classe | Tipo | Persistência |
|--------|------|-------------|
| `User` | Entity | PostgreSQL (`users`) |
| `UserSocialLink` | Entity | PostgreSQL (`user_social_links`) |
| `UserRole` | Enum (VO) | — |

---

## Entradas

### User (Builder)

| Campo | Tipo | Obrigatório | Default | Restrições |
|-------|------|:-----------:|---------|------------|
| `id` | UUID | Não (auto) | `@GeneratedValue(UUID)` | PK |
| `name` | String | Sim | — | max 100, not null |
| `email` | String | Sim | — | max 255, not null, unique |
| `passwordHash` | String | Sim | — | not null |
| `bio` | String | Não | null | max 500 |
| `photoUrl` | String | Não | null | — |
| `role` | UserRole | Não | `UserRole.MEMBER` | `@Builder.Default` |
| `socialLinks` | List\<UserSocialLink\> | Não | `new ArrayList<>()` | `@Builder.Default`, orphanRemoval=true |
| `createdAt` | LocalDateTime | Não (auto) | `@CreationTimestamp` | updatable=false |
| `updatedAt` | LocalDateTime | Não (auto) | `@UpdateTimestamp` | — |

### UserSocialLink (Builder)

| Campo | Tipo | Obrigatório | Restrições |
|-------|------|:-----------:|------------|
| `id` | UUID | Não (auto) | PK |
| `user` | User | Sim | FK, not null, LAZY |
| `platform` | String | Sim | max 50, not null |
| `url` | String | Sim | max 500, not null |

### UserRole (Enum)

Valores: `ADMIN`, `MODERATOR`, `MEMBER`

---

## Saídas

- Instância de `User` com campos preenchidos e defaults aplicados
- Lista de `UserSocialLink` vinculada via `@OneToMany`
- Timestamps gerenciados automaticamente pelo Hibernate

---

## Fluxos felizes

1. **Builder com todos os campos obrigatórios** — cria User com name, email, passwordHash; role=MEMBER e socialLinks=[] por default
2. **Builder com sobrescrita de role** — `User.builder().role(UserRole.ADMIN).build()` resulta em role=ADMIN
3. **Builder com socialLinks** — passa lista de UserSocialLink; associação bidirecional funciona
4. **Construtor vazio (NoArgsConstructor)** — cria instância com todos os campos null/default (necessário para JPA)
5. **AllArgsConstructor** — cria instância com todos os campos explícitos
6. **Getter/Setter** — todos os campos acessíveis via Lombok
7. **CreationTimestamp** — `createdAt` preenchido automaticamente na persistência
8. **UpdateTimestamp** — `updatedAt` atualizado automaticamente em updates

### UserSocialLink

9. **Builder com user, platform, url** — cria link válido
10. **Associação bidirecional** — link adicionado à lista do User reflete no banco

### UserRole

11. **Todos os valores do enum** — ADMIN, MODERATOR, MEMBER existem e são válidos
12. **Armazenamento como STRING** — `@Enumerated(EnumType.STRING)` garante persistência legível

---

## Fluxos tristes

1. **Builder sem name** — `name` é `null`; violação de `@Column(nullable=false)` no persist → `ConstraintViolationException`
2. **Builder sem email** — idem; violação de not null
3. **Builder sem passwordHash** — idem
4. **Email duplicado** — `@Column(unique=true)` → `DataIntegrityViolationException` no persist
5. **Name excedendo 100 chars** — `@Column(length=100)` → truncamento ou exceção dependendo do DB
6. **Email excedendo 255 chars** — idem para 255
7. **Bio excedendo 500 chars** — idem para 500
8. **UserSocialLink sem user** — FK not null → `ConstraintViolationException`
9. **UserSocialLink sem platform** — not null → exceção
10. **UserSocialLink sem url** — not null → exceção
11. **OrphanRemoval** — remover link da lista `socialLinks` deve deletar o registro no banco

---

## Regras de negócio e validações

- Role padrão é `MEMBER` — só pode ser alterado explicitamente
- `socialLinks` usa `orphanRemoval=true` — remover da lista exclui do banco
- `createdAt` é imutável após criação (`updatable=false`)
- `email` tem constraint unique no banco
- Sem validação Bean Validation (`@NotBlank`, `@Email`, etc.) na entidade — validação fica nas camadas superiores

---

## Dependências relevantes

- Lombok: `@Builder`, `@Getter`, `@Setter`, `@NoArgsConstructor`, `@AllArgsConstructor`
- Hibernate: `@CreationTimestamp`, `@UpdateTimestamp`
- JPA: `@Entity`, `@Table`, `@Column`, `@OneToMany`, `@ManyToOne`

---

## Observações para implementação dos testes

- **Testes existentes**: 4 testes unitários em `UserTest.java` cobrindo defaults do builder, sobrescrita de role, socialLinks e construtor vazio
- **Prioridade**: expandir para cobrir UserSocialLink (builder, FK, orphanRemoval) e UserRole
- **Sem mocks necessários**: testes de domínio são puramente unitários, sem contexto Spring
- **OrphanRemoval**: requer teste de integração (JPA) para validar comportamento real
- **Hipótese a validar**: o comportamento de cascade e orphanRemoval com a lista `socialLinks` — verificar se `user.getSocialLinks().remove(link)` de fato deleta o registro
- **Hipótese a validar**: se o Lombok `@Builder.Default` funciona corretamente com JPA (construtor vazio vs builder)

---

## Status

- Mapeado: Sim
- Testes implementados: 4 (User builder defaults, role override, socialLinks, no-args constructor)
- Pendências: UserSocialLink (builder, FK), UserRole (enum values), orphanRemoval (integração)
