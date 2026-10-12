import { request } from './request'
import { mockProductDetail, mockSearchProducts } from '@/data/products'
import type { CommonPage, Product, ProductDetail } from '@/types/api'

export interface SearchParams {
  keyword?: string
  productCategoryId?: number
  brandId?: number
  pageNum: number
  pageSize: number
  /** 0 综合 1 新品 2 销量 */
  sort?: number
}

/** 综合搜索、分类/品牌筛选、排序（mall-search ES，免登录白名单） */
export async function searchProducts(params: SearchParams): Promise<CommonPage<Product>> {
  try {
    return await request<CommonPage<Product>>({ url: '/mall-search/esProduct/search', method: 'GET', query: params as never })
  } catch (e) {
    console.info('[Search] request failed, fallback to mock:', e)
    return mockSearchProducts(params)
  }
}

/** 商品详情（免登录白名单） */
export async function getProductDetail(id: number): Promise<ProductDetail> {
  try {
    return await request<ProductDetail>({ url: `/mall-portal/product/detail/${id}`, method: 'GET' })
  } catch (e) {
    console.info('[Product] detail request failed, fallback to mock:', e)
    return mockProductDetail(id)
  }
}
