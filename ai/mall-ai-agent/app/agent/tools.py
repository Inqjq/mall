"""角色感知的 Agent 工具集（工厂模式）。

build_tools(role, auth_header) 按角色构建工具列表和 link_sink：
link_sink 是一个 list，工具被调用时自动 append 页面跳转链接
（{label, to}），随响应返回给前端渲染成跳转按钮。
"""
import json
import logging
from typing import Any

from langchain_core.tools import tool

from app.agent.mall_client import SUCCESS_CODE, MallClient

logger = logging.getLogger(__name__)

ORDER_STATUS_NAMES = {
    0: "待付款",
    1: "待发货",
    2: "已发货",
    3: "已完成",
    4: "已关闭",
}
LOW_STOCK_THRESHOLD = 10


def _dump(data: Any) -> str:
    """工具结果统一序列化为 JSON 字符串"""
    return json.dumps(data, ensure_ascii=False, default=str)


def build_tools(role: str, auth_header: str | None) -> tuple[list, list]:
    """按角色构建工具集。

    :param role: admin | merchant | customer
    :param auth_header: 前端透传的 Authorization 头（如 "Bearer xxx"），
        admin/merchant 的网关接口需要它；customer 的订单接口需要会员 token。
    :return: (tools, link_sink)
    """
    link_sink: list[dict[str, str]] = []
    client = MallClient()

    def add_link(label: str, to: str) -> None:
        link_sink.append({"label": label, "to": to})

    def _no_login_hint() -> str:
        return "请先登录后台后再查询运营数据（当前请求未携带登录凭证 Authorization）。"

    async def _admin_get(path: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
        return await client.get_json(path, params=params, auth_header=auth_header)

    # ========== customer 工具 ==========

    if role == "customer":

        @tool
        async def search_products(keyword: str) -> str:
            """按关键词搜索商城在售商品，返回商品名称、价格、销量等列表。适合帮顾客找商品、比价。"""
            products = await client.search_products(keyword, page_size=5)
            if not products:
                return _dump({"message": f"没有搜索到与“{keyword}”相关的商品", "products": []})
            add_link(f"查看“{keyword}”的搜索结果", "/search")
            return _dump({"total": len(products), "products": products})

        @tool
        async def get_product_detail(product_id: int) -> str:
            """根据商品 ID 查询商品详情（名称、价格、库存、销量、品牌、优惠券数量等）。"""
            detail = await client.get_product_detail(product_id)
            if detail.get("error"):
                return _dump({"message": f"商品 {product_id} 查询失败：{detail['error']}"})
            add_link(f"打开商品：{detail.get('name') or product_id}", f"/product/{product_id}")
            return _dump(detail)

        @tool
        async def get_my_orders() -> str:
            """查询当前登录会员最近的订单列表（最近 3 条，含状态和金额）。需要会员登录。"""
            if not auth_header:
                add_link("去登录", "/login")
                return _dump({
                    "message": "查询订单需要先登录会员账号。请点击“去登录”完成登录后再试。",
                    "needLogin": True,
                })
            result = await _admin_get(
                "/mall-portal/order/list",
                params={"status": -1, "pageNum": 1, "pageSize": 3},
            )
            if result.get("code") == 401:
                add_link("去登录", "/login")
                return _dump({"message": "登录状态已失效，请重新登录后再查询订单。", "needLogin": True})
            if result.get("code") != SUCCESS_CODE:
                return _dump({"message": f"订单查询失败：{result.get('message')}"})
            data = result.get("data") or {}
            orders = []
            for item in data.get("list") or []:
                orders.append({
                    "id": item.get("id"),
                    "orderSn": item.get("orderSn"),
                    "status": item.get("status"),
                    "totalAmount": str(item.get("totalAmount")) if item.get("totalAmount") is not None else None,
                    "createTime": str(item.get("createTime")) if item.get("createTime") else None,
                })
            add_link("查看我的订单", "/order/list")
            return _dump({"total": data.get("total", len(orders)), "orders": orders})

        return [search_products, get_product_detail, get_my_orders], link_sink

    # ========== admin / merchant 共用实现 ==========

    order_link, pending_link, product_link = (
        ({"label": "订单管理", "to": "/order"},
         {"label": "处理待发货订单", "to": "/order?status=1"},
         {"label": "商品管理", "to": "/product"})
        if role == "admin" else
        ({"label": "查看订单履约", "to": "/orders"},
         {"label": "处理待发货订单", "to": "/orders?status=1"},
         {"label": "商品管理", "to": "/products"})
    )

    async def fetch_order_total(status: int) -> tuple[int | None, int]:
        """返回 (total, 网关返回码)，total 为 None 表示该状态查询失败"""
        result = await _admin_get(
            "/mall-admin/order/list",
            params={"status": status, "pageNum": 1, "pageSize": 1},
        )
        if result.get("code") != SUCCESS_CODE:
            return None, int(result.get("code") or 0)
        return (result.get("data") or {}).get("total"), SUCCESS_CODE

    async def order_statistics() -> str:
        """聚合五种订单状态的数量摘要。"""
        if not auth_header:
            add_link(order_link["label"], order_link["to"])
            return _dump({"message": _no_login_hint(), "needLogin": True})
        stats: dict[str, Any] = {}
        failed = []
        last_code = 0
        for status, name in ORDER_STATUS_NAMES.items():
            total, code = await fetch_order_total(status)
            last_code = code
            if total is None:
                failed.append(name)
            else:
                stats[name] = total
        add_link(order_link["label"], order_link["to"])
        if last_code == 401:
            return _dump({"message": "登录状态已失效，请重新登录后台后再试。", "needLogin": True})
        if failed and not stats:
            return _dump({"message": "订单统计查询失败：网关返回异常，请稍后再试。"})
        payload: dict[str, Any] = {"statistics": stats}
        if failed:
            payload["warning"] = f"以下状态查询失败：{('、'.join(failed))}"
        return _dump(payload)

    async def pending_delivery_orders() -> str:
        """查询待发货订单明细。"""
        if not auth_header:
            add_link(pending_link["label"], pending_link["to"])
            return _dump({"message": _no_login_hint(), "needLogin": True})
        result = await _admin_get(
            "/mall-admin/order/list",
            params={"status": 1, "pageNum": 1, "pageSize": 5},
        )
        add_link(pending_link["label"], pending_link["to"])
        if result.get("code") == 401:
            return _dump({"message": "登录状态已失效，请重新登录后台后再试。", "needLogin": True})
        if result.get("code") != SUCCESS_CODE:
            return _dump({"message": f"待发货订单查询失败：{result.get('message')}"})
        data = result.get("data") or {}
        orders = []
        for item in data.get("list") or []:
            orders.append({
                "id": item.get("id"),
                "orderSn": item.get("orderSn"),
                "receiverName": item.get("receiverName"),
                "totalAmount": str(item.get("totalAmount")) if item.get("totalAmount") is not None else None,
                "status": item.get("status"),
                "orderType": item.get("orderType"),
                "createTime": str(item.get("createTime")) if item.get("createTime") else None,
            })
        return _dump({
            "totalPending": data.get("total", len(orders)),
            "sample": orders,
            "hint": "以上为最新的待发货订单，可在订单管理页批量发货。",
        })

    async def product_stock_overview() -> str:
        """查询商品列表并筛出低库存商品。"""
        if not auth_header:
            add_link(product_link["label"], product_link["to"])
            return _dump({"message": _no_login_hint(), "needLogin": True})
        result = await _admin_get(
            "/mall-admin/product/list",
            params={"pageNum": 1, "pageSize": 5},
        )
        add_link(product_link["label"], product_link["to"])
        if result.get("code") == 401:
            return _dump({"message": "登录状态已失效，请重新登录后台后再试。", "needLogin": True})
        if result.get("code") != SUCCESS_CODE:
            return _dump({"message": f"商品列表查询失败：{result.get('message')}"})
        data = result.get("data") or {}
        products = data.get("list") or []
        low_stock = [
            {
                "id": p.get("id"),
                "name": p.get("name"),
                "stock": p.get("stock"),
                "price": str(p.get("price")) if p.get("price") is not None else None,
            }
            for p in products
            if isinstance(p.get("stock"), int) and p["stock"] <= LOW_STOCK_THRESHOLD
        ]
        return _dump({
            "totalProducts": data.get("total", len(products)),
            "checkedCount": len(products),
            "lowStockThreshold": LOW_STOCK_THRESHOLD,
            "lowStockProducts": low_stock,
            "hint": f"本次抽查了最新 {len(products)} 款商品，其中 {len(low_stock)} 款库存不高于 {LOW_STOCK_THRESHOLD}。",
        })

    if role == "admin":

        @tool
        async def get_order_statistics() -> str:
            """统计后台各状态订单数量（待付款/待发货/已发货/已完成/已关闭），返回聚合摘要。适合回答运营“现在有多少订单”。"""
            return await order_statistics()

        @tool
        async def get_pending_delivery_orders() -> str:
            """查询待发货订单明细（最新 5 条，含订单号、收货人、金额）。适合处理发货任务。"""
            return await pending_delivery_orders()

        @tool
        async def get_product_stock_overview() -> str:
            """查询后台商品列表（最新 5 款）并筛出库存不高于 10 的低库存商品。适合回答库存预警。"""
            return await product_stock_overview()

        return [get_order_statistics, get_pending_delivery_orders, get_product_stock_overview], link_sink

    # merchant
    @tool
    async def get_order_statistics() -> str:
        """统计店铺各状态订单数量（待付款/待发货/已发货/已完成/已关闭），返回聚合摘要。适合回答“今天有多少待发货”。"""
        return await order_statistics()

    @tool
    async def get_pending_delivery_orders() -> str:
        """查询店铺待发货订单明细（最新 5 条，含订单号、收货人、金额），便于安排发货。"""
        return await pending_delivery_orders()

    @tool
    async def get_product_stock_overview() -> str:
        """查询店铺商品列表（最新 5 款）并筛出库存不高于 10 的低库存商品，用于补货预警。"""
        return await product_stock_overview()

    return [get_order_statistics, get_pending_delivery_orders, get_product_stock_overview], link_sink
