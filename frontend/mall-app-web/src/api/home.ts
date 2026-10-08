import { request } from '@/utils/request'
import type { CategoryNode, HomeContent, Product } from '@/types/api'

/** 首页聚合内容（轮播/品牌/新品/热销/专题，免登录白名单） */
export function getHomeContent(): Promise<HomeContent> {
  return request<HomeContent>({ url: '/mall-portal/home/content', method: 'get' })
}

/** 商品分类树（免登录白名单） */
export function getProductCateList(parentId = 0): Promise<CategoryNode[]> {
  return request<CategoryNode[]>({ url: `/mall-portal/home/productCateList/${parentId}`, method: 'get' })
}

/** Portal API returns one level per call, so build the visible category tree explicitly. */
export async function getProductCategoryTree(): Promise<CategoryNode[]> {
  const parents = await getProductCateList(0)
  return Promise.all((parents || []).map(async (parent) => {
    if (parent.childrenList?.length) return parent
    try {
      return { ...parent, childrenList: await getProductCateList(parent.id) }
    } catch {
      return { ...parent, childrenList: [] }
    }
  }))
}

/** 人气推荐（免登录白名单） */
export function getHotProductList(pageNum = 1, pageSize = 10): Promise<{ list: Product[] }> {
  return request<{ list: Product[] }>({ url: '/mall-portal/home/hotProductList', method: 'get', params: { pageNum, pageSize } })
}

/** 首页精选商品列表 */
export function getRecommendProductList(pageNum = 1, pageSize = 10): Promise<Product[]> {
  return request<Product[]>({ url: '/mall-portal/home/recommendProductList', method: 'get', params: { pageNum, pageSize } })
}
