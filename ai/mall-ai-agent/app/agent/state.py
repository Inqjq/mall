"""Agent 状态定义"""
from typing import Annotated

from langgraph.graph.message import add_messages
from typing_extensions import TypedDict


class AgentState(TypedDict):
    """LangGraph 全局状态，messages 通过 add_messages 自动追加合并"""

    messages: Annotated[list, add_messages]
