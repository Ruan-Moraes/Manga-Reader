# ─────────────────────────────────────────────────────────────────
# Stage 1: Build
# ─────────────────────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-23-alpine AS build

WORKDIR /app

# Cache de dependências (só re-baixa se pom.xml mudar)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Build do projeto
COPY src ./src
RUN mvn package -DskipTests -B

# ─────────────────────────────────────────────────────────────────
# Stage 2: Run
# ─────────────────────────────────────────────────────────────────
FROM eclipse-temurin:23-jre-alpine

WORKDIR /app

# Criar usuário não-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=build /app/target/*.jar app.jar

RUN chown appuser:appgroup app.jar
USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
    CMD wget -qO- http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
