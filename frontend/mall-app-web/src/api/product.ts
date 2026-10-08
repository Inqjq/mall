import { request } from '@/utils/request'
import type { CommonPage, Product, ProductDetail } from '@/types/api'

/** 综合搜索、分类/品牌筛选、排序（mall-search ES，免登录白名单） */
export function searchProducts(params: { keyword?: string; productCategoryId?: number; brandId?: number; pageNum: number; pageSize: number; sort?: number }): Promise<CommonPage<Product>> {
  return request<CommonPage<Product>>({ url: '/mall-search/esProduct/search', method: 'get', params })
}

/** 商品详情（免登录白名单） */
export function getProductDetail(id: number): Promise<ProductDetail> {
  return request<ProductDetail>({ url: `/mall-portal/product/detail/${id}`, method: 'get' })
}
