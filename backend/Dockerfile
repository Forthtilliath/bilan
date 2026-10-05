# --- Build : dependances en cache separe des sources pour des rebuilds rapides
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src ./src
RUN mvn -B -q package -DskipTests

# --- Runtime : JRE seul, utilisateur non root
FROM eclipse-temurin:25-jre-alpine
WORKDIR /app
RUN addgroup -S bilan && adduser -S bilan -G bilan
COPY --from=build /app/target/*.jar app.jar
USER bilan
EXPOSE 8082
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
