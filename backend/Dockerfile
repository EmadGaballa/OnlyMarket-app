FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app

# 1. Copy pom.xml first
COPY pom.xml .

# 2. Pre-download ALL dependencies AND plugins into cache using a dummy build
RUN --mount=type=cache,target=/root/.m2 \
    mkdir -p src/main/java/com/example && \
    echo "package com.example; class Dummy { public static void main(String[] args) {} }" > src/main/java/com/example/Dummy.java && \
    mvn package -DskipTests -Dspring-boot.repackage.skip=true -B && \
    rm -rf src target

# 3. Copy real source code AFTER dependencies are cached
COPY src ./src

# 4. Build application (100% offline from cache)
RUN --mount=type=cache,target=/root/.m2 mvn package -DskipTests -B

# Runtime stage
# ... lower section of Dockerfile ...
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=build /app/target/*.jar app.jar
RUN mkdir -p /app/uploads && chown -R appuser:appgroup /app

# COMMENT OUT THIS LINE BELOW:
# USER appuser

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]