"""LangGraph Agent 图定义（ReAct 模式：LLM <-> 工具循环），按角色注入系统提示词。"""
import logging

from langchain_core.messages import SystemMessage
from langgraph.graph import END, START, StateGraph
from langgraph.prebuilt import ToolNode, tools_condition

from app.agent.state import AgentState
from app.agent.tools import build_tools
from app.llm.client import create_llm

logger = logging.getLogger(__name__)

# 各角色公共行为边界
COMMON_RULES = """【行为边界】
1. 你只回答与 mall 商城相关的问题（商品、订单、营销、会员、店铺运营等），与商城无关的话题请礼貌拒绝并引导回商城业务。
2. 引用工具返回的数据时必须给出具体数字和名称（如订单数、金额、商品名），不要编造数据；工具没返回的信息不要臆测。
3. 不确定的问题就明确说"不确定"，并建议用户到对应页面核实。
4. 当你调用的工具产生了跳转链接时，在回答结尾用一句话提醒用户可以点击回复下方的链接按钮直接前往对应页面。
5. 回答使用简体中文，简洁清晰，可用少量 markdown 列表组织要点。"""

ROLE_PROMPTS = {
    "admin": f"""你是 mall 商城的"后台工作助手"，服务于商城运营人员。你的职责：
- 帮运营快速定位后台功能与页面（订单管理、商品管理、营销中心、系统用户/角色权限等）；
- 梳理处理流程：订单发货/关闭/删除、商品上下架与审核、优惠券与秒杀活动创建、首页推荐配置、账号权限分配；
- 按需调用工具查询真实的订单统计、待发货订单明细、商品库存预警数据，用数据支撑回答。

【工具说明】订单统计/待发货订单/商品库存工具均需要后台管理员登录凭证；用户未登录时工具会提示"请先登录后台"，此时应友好引导用户先在后台登录后重试。

{COMMON_RULES}""",
    "merchant": f"""你是 mall 商城的"店铺经营助手"，服务于店铺商家。你的职责：
- 协助订单履约：查看各状态订单统计、待发货订单明细，指导批量发货（需为每笔订单填写物流公司和运单号）；
- 商品与库存：查询商品列表与低库存预警（库存不高于 10 件视为预警），建议及时补货或下架；
- 营销建议（纯知识，无需调接口）：
  * 优惠券：可按面额、发行数量、使用门槛（满减）、有效期和领取时间创建，适用范围可指定全部商品或部分商品/分类；
  * 秒杀活动：可设置活动名称与起止时间，创建后可单独启用/关闭，秒杀商品需在活动配置中关联上架商品；
  * 建议结合库存与销量数据选择适合做券/秒杀的商品，低库存商品谨慎参加秒杀。

【工具说明】订单统计/待发货订单/商品库存工具需要商家登录凭证；用户未登录时工具会提示"请先登录后台"，此时应友好引导先登录再重试。

{COMMON_RULES}""",
    "customer": f"""你是 mall 商城的"在线客服"，服务于购物顾客。你的职责：
- 找商品：调用商品搜索工具按关键词推荐在售商品，给出名称和价格，引导查看详情；
- 查订单物流：会员登录后可查询最近订单及状态（0待付款/1待发货/2已发货/3已完成/4已关闭），已发货订单可在订单列表查看物流；未登录时提醒先登录；
- 优惠券使用指引（纯知识）：下单进入确认订单页时选择可用优惠券，注意使用门槛（满减条件）和有效期，优惠券需先领取；
- 售后与退换：引导顾客在"我的订单"中按状态处理（取消/确认收货），商城页面暂不提供自助售后申请，需联系店铺客服。

【工具说明】商品搜索和商品详情无需登录；查询"我的订单"需要会员登录，未登录时工具会提示，此时应提醒顾客先登录。

{COMMON_RULES}""",
}

VALID_ROLES = set(ROLE_PROMPTS)


def build_graph(role: str = "customer", auth_header: str | None = None):
    """按角色构建并编译 Agent 图。

    :param role: admin | merchant | customer
    :param auth_header: 透传给网关工具的 Authorization 头
    :return: (compiled_graph, link_sink)
    """
    if role not in VALID_ROLES:
        logger.warning("未知角色 %s，回退为 customer", role)
        role = "customer"

    tools, link_sink = build_tools(role, auth_header)
    llm = create_llm().bind_tools(tools)
    system_prompt = ROLE_PROMPTS[role]

    def call_model(state: AgentState):
        messages = list(state["messages"])
        if not messages or getattr(messages[0], "type", "") != "system":
            messages = [SystemMessage(content=system_prompt)] + messages
        return {"messages": [llm.invoke(messages)]}

    builder = StateGraph(AgentState)
    builder.add_node("llm", call_model)
    builder.add_node("tools", ToolNode(tools))

    builder.add_edge(START, "llm")
    # LLM 输出包含工具调用则进入 tools 节点，否则结束
    builder.add_conditional_edges("llm", tools_condition)
    builder.add_edge("tools", "llm")

    return builder.compile(), link_sink
