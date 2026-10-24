# Toonlira — Plano de Deploy

> Última atualização: 9 de março de 2026

---

## 1. Variáveis de Ambiente

### 1.1. Backend (Produção)

| Variável | Descrição | Exemplo | Obrigatória |
|----------|-----------|---------|:-----------:|
| `DATABASE_URL` | URL JDBC do PostgreSQL | `jdbc:postgresql://host:5432/toonlira` | ✅ |
| `DATABASE_USERNAME` | Usuário do PostgreSQL | `manga_user` | ✅ |
| `DATABASE_PASSWORD` | Senha do PostgreSQL | `***` | ✅ |
| `MONGODB_URI` | URI de conexão MongoDB | `mongodb+srv://user:pass@cluster/toonlira` | ✅ |
| `REDIS_HOST` | Host do Redis | `redis.example.com` | ✅ |
| `REDIS_PORT` | Porta do Redis | `6379` | ❌ (default: 6379) |
| `REDIS_PASSWORD` | Senha do Redis | `***` | ❌ (default: vazio) |
| `RABBITMQ_HOST` | Host do RabbitMQ | `rabbitmq.example.com` | ✅ |
| `RABBITMQ_PORT` | Porta do RabbitMQ | `5672` | ❌ (default: 5672) |
| `RABBITMQ_USERNAME` | Usuário do RabbitMQ | `manga` | ✅ |
| `RABBITMQ_PASSWORD` | Senha do RabbitMQ | `***` | ✅ |
| `MAIL_HOST` | Host SMTP | `smtp.gmail.com` | ✅ |
| `MAIL_PORT` | Porta SMTP | `587` | ❌ (default: 587) |
| `MAIL_USERNAME` | Usuário SMTP | `noreply@example.com` | ✅ |
| `MAIL_PASSWORD` | Senha SMTP | `***` | ✅ |
| `MAIL_FROM` | Endereço remetente | `noreply@toonlira.com` | ✅ |
| `JWT_SECRET` | Chave secreta JWT (mín. 256 bits) | `base64-encoded-secret` | ✅ |
| `CORS_ALLOWED_ORIGINS` | Domínio(s) permitido(s) | `https://toonlira.com` | ✅ |
| `APP_BASE_URL` | URL base da aplicação (para links em emails) | `https://toonlira.com` | ✅ |
| `SPRING_PROFILES_ACTIVE` | Perfil Spring ativo | `prod` | ✅ |

### 1.2. Frontend (Build Time)

| Variável | Descrição | Exemplo | Obrigatória |
|----------|-----------|---------|:-----------:|
| `VITE_API_BASE_URL` | URL base da API backend | `https://api.toonlira.com` | ✅ |
| `VITE_BASE_URL` | Base path da aplicação (se não for `/`) | `/` | ❌ |

---

## 2. Dependências de Infraestrutura

### 2.1. Serviços Necessários

| Serviço | Versão Mínima | Uso | Recursos Recomendados |
|---------|:------------:|-----|----------------------|
| **PostgreSQL** | 17 | Banco relacional (users, groups, events, forum, library, stores, tags) | 1 vCPU, 2GB RAM, 20GB SSD |
| **MongoDB** | 8.0 | Banco documental (titles, comments, ratings, news) | 1 vCPU, 2GB RAM, 20GB SSD |
| **Redis** | 7 | Cache (TTL 5 min, allkeys-lru) | 128MB~256MB RAM |
| **RabbitMQ** | 4 | Mensageria assíncrona | 512MB RAM |
| **SMTP** | — | Envio de emails (forgot password, notificações) | Serviço externo (Gmail, SendGrid, SES) |

### 2.2. Servidor de Aplicação

| Componente | Requisito |
|-----------|-----------|
| **Backend** | Java 23 JRE, 512MB~1GB RAM, porta 8080 |
| **Frontend** | Servidor de arquivos estáticos (Nginx, CDN) |
| **Reverse Proxy** | Nginx ou equivalente (roteamento, SSL termination) |

### 2.3. Opções de Cloud

| Provider | Serviço Backend | Banco de Dados | Cache/Messaging |
|----------|---------------|---------------|-----------------|
| **AWS** | ECS/Fargate ou EC2 | RDS (PostgreSQL) + DocumentDB (MongoDB) | ElastiCache (Redis) + Amazon MQ (RabbitMQ) |
| **GCP** | Cloud Run ou GCE | Cloud SQL + MongoDB Atlas | Memorystore (Redis) + Cloud Pub/Sub |
| **DigitalOcean** | App Platform ou Droplet | Managed PostgreSQL + MongoDB Atlas | Redis add-on + CloudAMQP |
| **Railway/Render** | Docker container | PostgreSQL add-on + MongoDB Atlas | Redis add-on + CloudAMQP |

---

## 3. Build

### 3.1. Backend

```bash
# Build do JAR
cd api
./mvnw clean package -DskipTests

# Build da imagem Docker (multi-stage)
docker build -t toonlira-api:latest .

# Execução
docker run -d \
  --name toonlira-api \
  -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e DATABASE_URL=jdbc:postgresql://host:5432/toonlira \
  -e DATABASE_USERNAME=manga_user \
  -e DATABASE_PASSWORD=secret \
  -e MONGODB_URI=mongodb+srv://user:pass@cluster/toonlira \
  -e REDIS_HOST=redis.host \
  -e RABBITMQ_HOST=rabbitmq.host \
  -e RABBITMQ_USERNAME=manga \
  -e RABBITMQ_PASSWORD=secret \
  -e JWT_SECRET=your-256-bit-secret \
  -e CORS_ALLOWED_ORIGINS=https://toonlira.com \
  -e APP_BASE_URL=https://toonlira.com \
  -e MAIL_HOST=smtp.gmail.com \
  -e MAIL_USERNAME=noreply@toonlira.com \
  -e MAIL_PASSWORD=secret \
  -e MAIL_FROM=noreply@toonlira.com \
  toonlira-api:latest
```

**Dockerfile já existente** com:
- **Stage 1**: `maven:3.9-eclipse-temurin-23-alpine` (build)
- **Stage 2**: `eclipse-temurin:23-jre-alpine` (runtime)
- Usuário non-root (`appuser`)
- Healthcheck: `GET /actuator/health`

### 3.2. Frontend

```bash
# Instalar dependências (pnpm workspace)
cd web
pnpm install

# Build de produção
VITE_API_BASE_URL=https://api.toonlira.com pnpm --filter toonlira build

# Output: web/toonlira/dist/
# Servir com Nginx ou upload para CDN
```

**Nota**: O `base` do Vite é `/`, compatível com Firebase Hosting e domínio próprio.

### 3.3. Docker Compose (Produção)

O arquivo `docker-compose.prod.yml` já existe no backend e pode ser usado como base para o deploy com Docker Compose em um servidor:

```bash
# No servidor de produção
cd api
docker-compose -f docker-compose.prod.yml up -d
```

---

## 4. Arquitetura de Deploy

### 4.1. Topologia Recomendada

```
                    ┌─────────────┐
                    │   DNS/CDN   │
                    │ (CloudFlare)│
                    └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    │    Nginx    │
                    │ (SSL + Proxy)│
                    └──┬──────┬──┘
                       │      │
          ┌────────────┘      └────────────┐
          │                                │
   ┌──────┴──────┐                  ┌──────┴──────┐
   │  Frontend   │                  │   Backend   │
   │  (Estático) │                  │ (Java 23)   │
   │  /dist/     │                  │ :8080       │
   └─────────────┘                  └──────┬──────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                      │
             ┌──────┴──────┐       ┌──────┴──────┐       ┌──────┴──────┐
             │ PostgreSQL  │       │  MongoDB    │       │   Redis     │
             │ :5432       │       │  :27017     │       │   :6379     │
             └─────────────┘       └─────────────┘       └──────┬──────┘
                                                                │
                                                         ┌──────┴──────┐
                                                         │  RabbitMQ   │
                                                         │  :5672      │
                                                         └─────────────┘
```

### 4.2. Configuração Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name toonlira.com;

    ssl_certificate /etc/letsencrypt/live/toonlira.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/toonlira.com/privkey.pem;

    # Frontend (SPA)
    location / {
        root /var/www/toonlira/dist;
        try_files $uri $uri/ /index.html;

        # Cache de assets estáticos
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API (proxy)
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Swagger (proteger ou desabilitar em produção)
    location /swagger-ui/ {
        deny all;  # Bloquear em produção
    }

    # Actuator (restringir)
    location /actuator/ {
        allow 127.0.0.1;
        deny all;
    }
}

server {
    listen 80;
    server_name toonlira.com;
    return 301 https://$server_name$request_uri;
}
```

---

## 5. Pipeline CI/CD Sugerido

### 5.1. GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Build & Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  # ──── FRONTEND ────
  frontend-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - uses: pnpm/action-setup@v4
      - run: cd web && pnpm install --frozen-lockfile
      - run: cd web && pnpm --filter toonlira lint:fsd
      - run: cd web/toonlira && npx tsc -b
      - run: cd web/toonlira && npx vitest run --pool=forks

  frontend-build:
    needs: frontend-check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - uses: pnpm/action-setup@v4
      - run: cd web && pnpm install --frozen-lockfile
      - run: cd web && VITE_API_BASE_URL=${{ secrets.API_BASE_URL }} pnpm --filter toonlira build
      - uses: actions/upload-artifact@v4
        with:
          name: frontend-dist
          path: web/toonlira/dist

  # ──── BACKEND ────
  backend-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:17-alpine
        env:
          POSTGRES_DB: toonlira_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports: ['5432:5432']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { java-version: '23', distribution: 'temurin' }
      - run: cd api && ./mvnw test

  backend-build:
    needs: api-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          context: ./api
          push: ${{ github.event_name == 'push' }}
          tags: ghcr.io/${{ github.repository }}/api:latest

  # ──── DEPLOY ────
  deploy:
    if: github.event_name == 'push'
    needs: [frontend-build, api-build]
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to server
        run: |
          # SSH para servidor e executar deploy
          # Atualizar Docker image + copiar frontend dist
          echo "Deploy step - configurar conforme infraestrutura"
```

### 5.2. Secrets Necessários no CI

| Secret | Descrição |
|--------|-----------|
| `API_BASE_URL` | URL pública da API para build do frontend |
| `DEPLOY_HOST` | Host do servidor de produção |
| `DEPLOY_KEY` | Chave SSH para deploy |
| `DATABASE_URL` | (se tests usam banco real) |

---

## 6. Health Checks e Monitoramento

### 6.1. Endpoints de Saúde

| Endpoint | Descrição | Acesso |
|---------|-----------|--------|
| `GET /actuator/health` | Status geral da aplicação | Público |
| `GET /actuator/info` | Informações da build | Restrito |
| `GET /actuator/metrics` | Métricas de performance | Restrito |

### 6.2. Checks Recomendados

```bash
# Backend
curl -f http://localhost:8080/actuator/health || exit 1

# PostgreSQL
pg_isready -h localhost -p 5432 -U manga_user

# MongoDB
mongosh --eval "db.adminCommand('ping')" mongodb://localhost:27017

# Redis
redis-cli -h localhost ping

# RabbitMQ
rabbitmq-diagnostics check_running
```

### 6.3. Métricas a Monitorar

| Métrica | Alerta |
|---------|--------|
| Response time p95 | > 2 segundos |
| Error rate (5xx) | > 1% |
| CPU usage | > 85% |
| Memory usage | > 90% |
| Disk usage | > 80% |
| DB connection pool | > 80% utilização |
| Cache hit rate | < 50% |

---

## 6.1. Pré-deploy: Flyway dry-run

Antes de qualquer release que adicione migration, valide contra um clone do banco de produção:

```bash
./scripts/flyway-dryrun.sh "$STAGING_JDBC_URL" "$STAGING_USER" "$STAGING_PWD"
```

O script roda `flyway:info` (lista pendentes vs aplicadas) + `flyway:validate` (checksum + cronologia). Detecta:

- **Colisões de versão** — duas migrations com mesmo `Vn__`. Foi o caso real da Phase B i18n: `V14__i18n_drop_legacy_columns.sql` colidiu com `V14__create_domain_labels.sql` preexistente. Renomear a nova para próxima versão livre antes do merge.
- **Checksum drift** — migration aplicada em prod foi editada localmente. Reverter ou criar migration corretiva.
- **Migrations faltando** — algum `Vn` aplicado em prod não está mais no classpath. Indica deletion/rebase incorreto.

Se `flyway:validate` falhar, **NÃO** prosseguir com `flyway:migrate` em prod.

---

## 7. Checklist de Segurança para Produção

- [ ] JWT secret com mínimo 256 bits, gerado aleatoriamente
- [ ] JWT secret diferente entre ambientes (dev ≠ staging ≠ prod)
- [ ] `CORS_ALLOWED_ORIGINS` estritamente definido (sem wildcard `*`)
- [ ] HTTPS obrigatório (redirect HTTP → HTTPS)
- [ ] Swagger/OpenAPI desabilitado ou protegido em produção
- [ ] Actuator restrito a IPs internos (exceto `/health`)
- [ ] Senhas de banco e serviços em secrets manager (não em código)
- [ ] Rate limiting ativo para endpoints públicos
- [ ] Headers de segurança configurados no Nginx:
  - `Strict-Transport-Security` (HSTS)
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Content-Security-Policy`
- [ ] Logs sem informações sensíveis (tokens, senhas)
- [ ] Backup automatizado de PostgreSQL e MongoDB
- [ ] Plano de disaster recovery documentado

---

## 8. Riscos do Deploy

| Risco | Probabilidade | Impacto | Mitigação |
|-------|:------------:|:-------:|-----------|
| Integração frontend-backend incompleta | Alta | Alto | Completar integração antes do deploy |
| Ausência de testes | Alta | Alto | Mínimo: testes E2E para fluxos de auth e CRUD |
| Referências cross-database órfãs | Média | Médio | Implementar validação na aplicação + job de limpeza |
| Escalabilidade do banco | Baixa | Alto | Monitorar métricas, escalar verticalmente quando necessário |
| Downtime durante deploy | Média | Médio | Implementar blue/green deployment ou rolling update |
| Secret leak | Baixa | Crítico | Usar secrets manager, nunca commitar em código |
