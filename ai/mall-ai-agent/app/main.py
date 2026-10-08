"""FastAPI 入口

启动：uvicorn app.main:app --reload --port 8500
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.registry.nacos_registry import registry

from app.api.routes import router


logging.basicConfig(level=logging.INFO)

CORS_ALLOW_ORIGINS = [
    "http://localhost:8090",
    "http://localhost:8091",
    "http://localhost:5173",
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    registry.register()
    yield
    registry.deregister()


app = FastAPI(
    title="mall-ai-agent",
    description="mall 商城智能助手 Agent 服务（LangGraph + LangChain）",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
