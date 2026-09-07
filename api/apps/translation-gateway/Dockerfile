FROM maven:3.9-eclipse-temurin-23-alpine AS build
WORKDIR /workspace
COPY pom.xml .
COPY libs/testing-support/pom.xml libs/testing-support/pom.xml
COPY apps/core/pom.xml apps/core/pom.xml
COPY apps/jobs/rating-aggregator/pom.xml apps/jobs/rating-aggregator/pom.xml
COPY apps/jobs/orphan-cleaner/pom.xml apps/jobs/orphan-cleaner/pom.xml
COPY apps/jobs/trending-aggregator/pom.xml apps/jobs/trending-aggregator/pom.xml
COPY apps/translation-gateway/pom.xml apps/translation-gateway/pom.xml
RUN mvn -pl apps/translation-gateway -am dependency:go-offline -B
COPY apps/translation-gateway/src apps/translation-gateway/src
COPY apps/translation-gateway/openapi apps/translation-gateway/openapi
RUN mvn -pl apps/translation-gateway -am package -DskipTests -B

FROM eclipse-temurin:23-jre-alpine
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=build /workspace/apps/translation-gateway/target/*.jar app.jar
RUN chown appuser:appgroup app.jar
USER appuser
EXPOSE 8084
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -qO- http://localhost:8084/actuator/health || exit 1
ENTRYPOINT ["java", "-jar", "app.jar"]
