"""HTTP 接口定义：POST /chat（角色感知智能客服）"""
import uuid
from typing import Annotated

from fastapi import APIRouter, Header
from langchain_core.messages import AIMessage, HumanMessage
from pydantic import BaseModel, Field
from typing_extensions import Literal

from app.agent.graph import build_graph

router = APIRouter()

# 会话记忆：key=f"{role}:{session_id}"，value 为 LangChain 消息列表
SESSION_MAX_ROUNDS = 10
_session_store: dict[str, list] = {}


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="用户输入")
    session_id: str | None = Field(None, description="会话 ID，缺省时由服务端生成")
    role: Literal["admin", "merchant", "customer"] = Field("customer", description="助手角色")


class PageLink(BaseModel):
    label: str = Field(..., description="跳转按钮文案")
    to: str = Field(..., description="前端页面路由")


class ChatResponse(BaseModel):
    reply: str = Field(..., description="markdown 文本回复")
    links: list[PageLink] = Field(default_factory=list, description="页面跳转链接")


@router.get("/health", summary="健康检查")
def health():
    return {"status": "ok"}


def _load_history(key: str) -> list:
    """读取会话历史，只保留最近 SESSION_MAX_ROUNDS 轮（每轮用户+助手共 2 条）"""
    history = _session_store.get(key, [])
    max_messages = SESSION_MAX_ROUNDS * 2
    if len(history) > max_messages:
        history = history[-max_messages:]
        _session_store[key] = history
    return list(history)


@router.post("/chat", response_model=ChatResponse, summary="角色感知对话接口")
async def chat(
    req: ChatRequest,
    authorization: Annotated[str | None, Header()] = None,
):
    """
    - role 决定助手职责（admin 后台工作助手 / merchant 店铺经营助手 / customer 在线客服）
    - 请求头 Authorization 会透传给网关工具（admin/merchant 及会员订单查询需要）
    - 响应中的 links 渲染为页面跳转按钮
    """
    session_id = req.session_id or uuid.uuid4().hex
    key = f"{req.role}:{session_id}"

    graph, link_sink = build_graph(req.role, authorization)
    history = _load_history(key)
    user_message = HumanMessage(content=req.message)

    result = await graph.ainvoke({"messages": history + [user_message]})

    reply_message = result["messages"][-1]
    reply = reply_message.content if isinstance(reply_message, AIMessage) else str(reply_message)

    # 更新会话记忆（超出轮数在下次读取时裁剪）
    _session_store[key] = history + [user_message, AIMessage(content=reply)]

    return ChatResponse(
        reply=reply,
        links=[PageLink(**link) for link in link_sink],
    )
