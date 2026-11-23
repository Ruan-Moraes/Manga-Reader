# ==============================================================================
# Translation Gateway — imagem de produção
# Contexto de build: api/  (docker build -f apps/translation-gateway/Dockerfile .)
# Imagens alinhadas com core e jobs (Java 23, Alpine).
# ==============================================================================

# ---- Build -------------------------------------------------------------------
FROM maven:3.9-eclipse-temurin-23-alpine AS build

WORKDIR /workspace

# POMs primeiro: cacheia o download de dependências
COPY pom.xml .
COPY libs/testing-support/pom.xml                         libs/testing-support/pom.xml
COPY apps/core/pom.xml                                    apps/core/pom.xml
COPY apps/jobs/rating-aggregator/pom.xml                  apps/jobs/rating-aggregator/pom.xml
COPY apps/jobs/orphan-cleaner/pom.xml                     apps/jobs/orphan-cleaner/pom.xml
COPY apps/jobs/trending-aggregator/pom.xml                apps/jobs/trending-aggregator/pom.xml
COPY apps/translation-gateway/pom.xml                     apps/translation-gateway/pom.xml
RUN mvn -f apps/translation-gateway/pom.xml dependency:go-offline -B

# Código-fonte
COPY apps/translation-gateway/src     apps/translation-gateway/src
COPY apps/translation-gateway/openapi apps/translation-gateway/openapi
RUN mvn -f apps/translation-gateway/pom.xml package -DskipTests -B

# ---- Detector de balões/texto (layout ONNX) -----------------------------------
# Revisão e SHA-256 fixados (iguais a ComicDetectorModel.REVISION/SHA256); o build falha se o hash divergir.
# Apache-2.0: https://huggingface.co/ogkalu/comic-text-and-bubble-detector — usado só com GATEWAY_LAYOUT_MODE≠disabled.
FROM alpine:3.20 AS layout-model
ARG LAYOUT_MODEL_REVISION=16e8a622f91fabc6b5b65c96d32d1183f8843546
ARG LAYOUT_MODEL_SHA256=065744e91c0594ad8663aa8b870ce3fb27222942eded5a3cc388ce23421bd195
RUN apk add --no-cache curl \
    && curl -fsSL -o /detector.onnx \
       "https://huggingface.co/ogkalu/comic-text-and-bubble-detector/resolve/${LAYOUT_MODEL_REVISION}/detector.onnx" \
    && echo "${LAYOUT_MODEL_SHA256}  /detector.onnx" | sha256sum -c -

# ---- Runtime -----------------------------------------------------------------
FROM eclipse-temurin:23-jre-alpine

WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=build /workspace/apps/translation-gateway/target/*.jar app.jar
RUN chown appuser:appgroup app.jar
# Somente leitura; o worker lê com GATEWAY_LAYOUT_MODEL_PATH (Terraform aponta para cá).
COPY --from=layout-model /detector.onnx /app/models/comic-detector-16e8a622/detector.onnx

USER appuser

EXPOSE 8084

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
    CMD wget -qO- http://localhost:8084/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
