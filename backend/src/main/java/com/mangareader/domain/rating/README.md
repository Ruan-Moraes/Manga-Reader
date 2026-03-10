# Plano de Testes — Domain: Rating

## Contexto

Módulo de avaliações de títulos. Contém a entidade `MangaRating` (MongoDB) com suporte a avaliação por estrelas, comentário opcional e ratings por categoria. Possui compound index unique em titleId + userId para garantir uma avaliação por usuário por título.

### Artefatos

| Classe | Tipo | Persistência |
|--------|------|-------------|
| `MangaRating` | Entity | MongoDB (`ratings`) |

---

## Entradas

### MangaRating (Builder)

| Campo | Tipo | Obrigatório | Default | Restrições |
|-------|------|:-----------:|---------|------------|
| `id` | String | Não (auto) | MongoDB ObjectId | PK |
| `titleId` | String | Não | null | `@Indexed`, compound index |
| `userId` | String | Não | null | `@Indexed`, compound index |
| `userName` | String | Não | null | Desnormalizado do User |
| `stars` | double | Não | `0.0` | primitivo |
| `comment` | String | Não | null | Comentário textual opcional |
| `categoryRatings` | Map\<String, Double\> | Não | `new HashMap<>()` | `@Builder.Default` |
| `createdAt` | LocalDateTime | Não (auto) | `@CreatedDate` | — |

**Compound Index**: `{'titleId': 1, 'userId': 1}` (unique) — garante uma avaliação por usuário por título.

---

## Saídas

- Instância de `MangaRating` com categoryRatings=HashMap vazio por default
- `stars` como double primitivo (default JVM = 0.0)

---

## Fluxos felizes

1. **Builder com titleId, userId, stars** — cria rating válido com comment=null, categoryRatings={}
2. **Builder com categoryRatings populado** — ex: `{"art": 4.5, "story": 3.0, "characters": 5.0}`
3. **Builder com comment** — avaliação com nota e comentário textual
4. **Construtor vazio** — instância válida para Spring Data
5. **Stars como valor fracionário** — double permite 4.5, 3.7, etc.
6. **CategoryRatings com múltiplas categorias** — map flexível sem schema fixo

---

## Fluxos tristes

1. **Stars negativo** — sem validação; `stars = -1.0` é aceito pela entidade
2. **Stars acima de 5.0** — sem validação de range na entidade
3. **Rating sem titleId** — aceito pelo MongoDB; inválido semanticamente
4. **Rating sem userId** — idem
5. **titleId + userId duplicado** — compound index unique → `DuplicateKeyException` no MongoDB
6. **categoryRatings com chave vazia** — sem validação; aceita "" como chave
7. **categoryRatings com valor negativo** — sem validação no valor

---

## Regras de negócio e validações

- **Uma avaliação por usuário por título**: compound index unique (titleId + userId)
- **Upsert semântico**: a lógica de "create if new, update if exists" fica no use case, não na entidade
- **Dados desnormalizados**: userName copiado do User (atualizado via consumer RabbitMQ)
- **Sem validação de range** para stars — qualquer double é aceito
- **categoryRatings** é flexível — Map<String, Double> sem schema fixo

---

## Dependências relevantes

- Spring Data MongoDB: `@Document`, `@Id`, `@Indexed`, `@CreatedDate`
- Spring Data MongoDB: `@CompoundIndex` (para unique titleId + userId)
- Lombok: `@Builder`, `@Builder.Default`, `@Getter`, `@Setter`

---

## Observações para implementação dos testes

- **Sem mocks necessários**: testes unitários puros
- **Foco principal**: compound index (unicidade titleId+userId) — requer teste de integração
- **Foco secundário**: defaults do builder (categoryRatings=HashMap vazio, stars=0.0)
- **Hipótese a validar**: se o compound index está configurado via anotação na classe ou via migration — verificar se `@CompoundIndex` existe ou se é criado no seed/config
- **Hipótese a validar**: se `stars` deveria ter range validation (0.0 a 5.0)
- **Lacuna**: sem validação de range para stars e categoryRatings values

---

## Status

- Mapeado: Sim
- Testes implementados: 0
- Pendências: Builder defaults, compound index (integração), validação de range (hipótese)
