# Plano de Testes — Infrastructure / Messaging

> Event publishers (RabbitMQ/Noop) + Event consumers (Rating recalc, User denormalization). 4 classes + config.

---

## Interface: EventPublisherPort

```java
void publish(String routingKey, Object event);
```

---

## 1. RabbitEventPublisher (Profile: `!test`)

### Contexto
Publica eventos de domínio no RabbitMQ exchange `manga.events` com routing key.

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `RabbitTemplate` | Spring AMQP | Template para publicação |

### Cenários
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Publicação com sucesso | `rabbitTemplate.convertAndSend("manga.events", routingKey, event)` |
| 2 | RabbitMQ indisponível | `AmqpException` — não é tratada (propaga para o caller) |

### Routing Keys Usados
| Key | Evento | Publicado por |
|-----|--------|---------------|
| `rating.submitted` | `RatingEvent` | SubmitRatingUseCase |
| `rating.updated` | `RatingEvent` | UpdateRatingUseCase |
| `rating.deleted` | `RatingEvent` | DeleteRatingUseCase |
| `user.profile.updated` | `UserProfileUpdatedEvent` | UpdateUserProfileUseCase |

### Observações para Testes
- **Teste unitário**: mock `RabbitTemplate`, verificar `convertAndSend` com parâmetros corretos
- **Teste de integração**: requer RabbitMQ rodando (TestContainers)
- **[HIPÓTESE]** Se RabbitMQ estiver fora, a exceção propaga e o use case falha — sem retry ou fallback

---

## 2. NoopEventPublisher (Profile: `test`)

### Contexto
Implementação no-op para testes. Apenas loga em nível DEBUG.

### Observações
- Ativado automaticamente em profile `test`
- Garante que testes unitários e de integração não precisam de RabbitMQ
- Log: `"[NOOP] Evento publicado: {} → {}"`

---

## 3. RatingEventConsumer (Profile: `!test`)

### Contexto
Consome eventos de rating para invalidar o cache de média.

### Queue
```
RabbitMQConfig.QUEUE_RATING_RECALCULATE
```

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `CacheManager` | Spring Cache | Acesso ao cache `RATING_AVERAGE` |

### Cenários
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Evento recebido | Evicta entry do cache `RATING_AVERAGE` para o `titleId` do evento |
| 2 | Cache não existe | Operação silenciosa (null check) |
| 3 | Entry não existe no cache | Operação silenciosa |

### Regras de Negócio
- Busca cache `RATING_AVERAGE` via `cacheManager.getCache(CacheNames.RATING_AVERAGE)`
- Evicta entry específica: `cache.evict(event.titleId())`
- Log: `"Recalculando média de rating para título: {}"`
- **Dupla invalidação**: o use case já faz `@CacheEvict`, e o consumer também evicta via mensageria
  - **[HIPÓTESE]** A dupla invalidação é redundante para instância única, mas necessária em cluster (múltiplas instâncias)

### Observações para Testes
- **Teste unitário**: mock `CacheManager`, verificar que `evict` é chamado com titleId correto
- Testar cenário de `getCache()` retornando null → sem NullPointerException

---

## 4. UserDenormalizationConsumer (Profile: `!test`)

### Contexto
Consome eventos de atualização de perfil para propagar nome/foto nos documentos MongoDB denormalizados.

### Queue
```
RabbitMQConfig.QUEUE_USER_DENORMALIZE
```

### Dependências
| Dependência | Tipo | Descrição |
|---|---|---|
| `MongoTemplate` | Spring Data MongoDB | Updates bulk |

### Cenários
| # | Cenário | Comportamento Esperado |
|---|---------|----------------------|
| 1 | Nome e foto atualizados | Atualiza `userName` e `userPhoto` nos comments + `userName` nos ratings onde `userId` = event.userId |
| 2 | Apenas nome atualizado | Atualiza `userName` nos comments e ratings (userPhoto pode ser null) |
| 3 | Nenhum documento afetado | Operação silenciosa — update com criteria que não match |

### Regras de Negócio
- **Comments**: `Query.query(Criteria.where("userId").is(event.userId()))` → Update `userName` e `userPhoto`
- **Ratings**: `Query.query(Criteria.where("userId").is(event.userId()))` → Update `userName`
- Usa `MongoTemplate.updateMulti()` — atualiza **todos** os documentos do user
- Não verifica se `newName`/`newPhotoUrl` são null — seta o valor diretamente
- **[HIPÓTESE]** Se `newPhotoUrl` for null (user removeu a foto), o campo será setado para null nos comments

### Observações para Testes
- **Teste de integração com MongoDB**: inserir comments + ratings, publicar evento, verificar que foram atualizados
- Verificar que `updateMulti` é chamado para comments E ratings (duas operações separadas)
- Testar com userId que não existe em nenhum documento → nenhum erro
- Testar que o campo `userPhoto` nos ratings **não** é atualizado (ratings não têm userPhoto)

---

## RabbitMQ Configuration

### Exchange
```
manga.events (topic)
```

### Queues e Bindings
| Queue | Binding Key | Consumer |
|-------|-------------|----------|
| `rating.recalculate` | `rating.*` | RatingEventConsumer |
| `user.denormalize` | `user.profile.updated` | UserDenormalizationConsumer |

### Observações
- `rating.*` binding captura `rating.submitted`, `rating.updated`, `rating.deleted`
- `user.profile.updated` é binding exato (não wildcard)
- Serialização: JSON via Spring AMQP MessageConverter

---

## Matriz de Cobertura

| Classe | Tipo de Teste | Cenários | Prioridade |
|--------|--------------|----------|------------|
| RabbitEventPublisher | Unitário (mock RabbitTemplate) | 2 | Média |
| NoopEventPublisher | Não precisa | — | — |
| RatingEventConsumer | Unitário (mock CacheManager) | 3 | Média |
| UserDenormalizationConsumer | Integração (MongoDB) | 3 | **Alta** |

## Status: 🔲 Não Implementado
