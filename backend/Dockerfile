# syntax=docker/dockerfile:1
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app

COPY pom.xml .

RUN mkdir -p src/main/java/com/example && \
    echo "package com.example; class Dummy { public static void main(String[] args) {} }" > src/main/java/com/example/Dummy.java && \
    mvn package -DskipTests -Dspring-boot.repackage.skip=true -B && \
    rm -rf src target

COPY src ./src

RUN mvn package -DskipTests -B

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=build /app/target/*.jar app.jar
RUN mkdir -p /app/uploads && chown -R appuser:appgroup /app

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]