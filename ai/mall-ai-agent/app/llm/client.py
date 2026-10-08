"""LLM 客户端构建"""
from langchain_openai import ChatOpenAI

from app.config import settings


def create_llm() -> ChatOpenAI:
    """创建 LLM 客户端（OpenAI 兼容协议，支持 DeepSeek/Qwen/GLM 等）"""
    return ChatOpenAI(
        api_key=settings.llm_api_key,
        base_url=settings.llm_base_url,
        model=settings.llm_model,
        temperature=0.7,
    )
