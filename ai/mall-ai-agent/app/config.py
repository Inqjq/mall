"""全局配置：从环境变量 / .env 文件加载"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # ===== Nacos =====
    nacos_server: str = "119.29.167.133:8848"
    nacos_namespace: str = ""
    nacos_group: str = "DEFAULT_GROUP"

    # ===== 服务自身 =====
    app_name: str = "mall-ai-agent"
    app_host: str = "0.0.0.0"
    app_port: int = 8500

    # ===== LLM（阿里百炼）=====
    llm_api_key: str = ""
    llm_base_url: str = "https://dashscope.aliyuncs.com/compatible-mode/v1"
    llm_model: str = "qwen-plus"

    # ===== mall 网关 =====
    mall_gateway_base_url: str = "http://localhost:8201"


settings = Settings()
