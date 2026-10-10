# 后端服务通用镜像：按 JAR_NAME 构建参数选择 jar
FROM eclipse-temurin:17-jre

ARG JAR_NAME
WORKDIR /app
COPY ${JAR_NAME} app.jar

ENV TZ=Asia/Shanghai
# JAVA_OPTS 由 compose 注入（堆大小等）；prod 配置已打进 jar（application-prod.yml）
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -Dspring.profiles.active=prod -jar app.jar"]
