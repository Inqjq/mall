import { request } from '@/utils/request'
import type { CommonPage, EsProduct } from '@/types/api'

/** ES 简单搜索（免登录，网关白名单） */
export function simpleSearch(params: { keyword?: string; pageNum: number; pageSize: number }): Promise<CommonPage<EsProduct>> {
  return request<CommonPage<EsProduct>>({ url: '/mall-search/esProduct/search/simple', method: 'get', params })
}

/** 综合搜索（筛选+排序，sort: 0相关 1新品 2销量 3价格升 4价格降） */
export function complexSearch(params: {
  keyword?: string
  brandId?: number
  productCategoryId?: number
  pageNum: number
  pageSize: number
  sort?: number
}): Promise<CommonPage<EsProduct>> {
  return request<CommonPage<EsProduct>>({ url: '/mall-search/esProduct/search', method: 'get', params })
}

/** 导入数据库全部商品到 ES */
export function importAllProducts() {
  return request<number>({ url: '/mall-search/esProduct/importAll', method: 'post' })
}
