"""mall 网关客户端：封装对 Spring Cloud Gateway 的 HTTP 调用。

所有方法统一异常处理：网关超时/连接失败/非 2xx 时返回可读的错误说明，
不向上层抛异常。
"""
import logging
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

# 与 CommonResult 对齐的成功码
SUCCESS_CODE = 200
REQUEST_TIMEOUT = 10.0


def _error(message: str, code: int = 500) -> dict[str, Any]:
    return {"code": code, "message": message, "data": None}


class MallClient:
    """mall 网关异步客户端（基于 httpx.AsyncClient）"""

    def __init__(self, base_url: str | None = None):
        self._base_url = (base_url or settings.mall_gateway_base_url).rstrip("/")

    async def get_json(
        self,
        path: str,
        params: dict[str, Any] | None = None,
        auth_header: str | None = None,
    ) -> dict[str, Any]:
        """GET 请求网关，返回 CommonResult 风格的 dict（code/message/data）。

        auth_header 为前端透传的完整 Authorization 头（如 "Bearer xxx"）。
        """
        headers = {"Authorization": auth_header} if auth_header else {}
        url = f"{self._base_url}{path}"
        try:
            async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
                resp = await client.get(url, params=params, headers=headers)
        except httpx.TimeoutException:
            logger.warning("网关请求超时: %s", url)
            return _error("商城网关请求超时，服务可能繁忙，请稍后再试", 504)
        except httpx.HTTPError as exc:
            logger.warning("网关请求失败: %s, %s", url, exc)
            return _error(f"商城网关暂时无法访问（{type(exc).__name__}），请稍后再试")

        if resp.status_code != 200:
            return _error(f"商城网关返回异常状态码 {resp.status_code}，请稍后再试", resp.status_code)
        try:
            body = resp.json()
        except ValueError:
            return _error("商城网关返回了无法解析的数据格式")
        if not isinstance(body, dict):
            return _error("商城网关返回了意外的数据结构")
        return body

    # ===== 匿名接口 =====

    async def search_products(self, keyword: str, page_size: int = 5) -> list[dict[str, Any]]:
        """ES 简单搜索（匿名）：/mall-search/esProduct/search/simple

        返回精简商品字段列表；请求失败返回空列表。
        """
        result = await self.get_json(
            "/mall-search/esProduct/search/simple",
            params={"keyword": keyword, "pageNum": 0, "pageSize": page_size},
        )
        if result.get("code") != SUCCESS_CODE:
            logger.info("商品搜索未成功: %s", result.get("message"))
            return []
        data = result.get("data") or {}
        products = data.get("list") or []
        return [
            {
                "id": p.get("id"),
                "name": p.get("name"),
                "subTitle": p.get("subTitle"),
                "brandName": p.get("brandName"),
                "productCategoryName": p.get("productCategoryName"),
                "price": str(p.get("price")) if p.get("price") is not None else None,
                "sale": p.get("sale"),
                "stock": p.get("stock"),
                "pic": p.get("pic"),
            }
            for p in products
        ]

    async def get_product_detail(self, product_id: int) -> dict[str, Any]:
        """商品详情（匿名）：/mall-portal/product/detail/{id}

        返回精简详情；请求失败返回带 message 的 dict。
        """
        result = await self.get_json(f"/mall-portal/product/detail/{product_id}")
        if result.get("code") != SUCCESS_CODE:
            return {"error": result.get("message") or "商品详情查询失败"}
        data = result.get("data") or {}
        product = data.get("product") or {}
        return {
            "id": product.get("id"),
            "name": product.get("name"),
            "subTitle": product.get("subTitle"),
            "brandName": (data.get("brand") or {}).get("name"),
            "productCategoryName": product.get("productCategoryName"),
            "price": str(product.get("price")) if product.get("price") is not None else None,
            "originalPrice": str(product.get("originalPrice"))
            if product.get("originalPrice") is not None
            else None,
            "stock": product.get("stock"),
            "sale": product.get("sale"),
            "pic": product.get("pic"),
            "detailHtml": None,  # 富文本不传给 LLM
            "skuCount": len(data.get("skuStockList") or []),
            "couponCount": len(data.get("couponList") or []),
        }
