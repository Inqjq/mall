import { request } from './request'
import { mockCategoryChildren } from '@/data/categories'
import { mockHomeContent } from '@/data/home'
import { mockProducts } from '@/data/products'
import type { CategoryNode, HomeContent, Product } from '@/types/api'

/** 首页聚合内容（免登录白名单；后端不可达时降级 mock，保证预览可用） */
export async function getHomeContent(): Promise<HomeContent> {
  try {
    return await request<HomeContent>({ url: '/mall-portal/home/content', method: 'GET' })
  } catch (e) {
    console.info('[Home] content request failed, fallback to mock:', e)
    return mockHomeContent
  }
}

/** 商品分类（一级传 0，Portal 每次返回一层） */
export async function getProductCateList(parentId = 0): Promise<CategoryNode[]> {
  try {
    return await request<CategoryNode[]>({ url: `/mall-portal/home/productCateList/${parentId}`, method: 'GET' })
  } catch (e) {
    console.info('[Home] cateList request failed, fallback to mock:', e)
    return mockCategoryChildren(parentId)
  }
}

/** 组装可见的两级分类树 */
export async function getProductCategoryTree(): Promise<CategoryNode[]> {
  const parents = await getProductCateList(0)
  return Promise.all(
    (parents || []).map(async (parent) => {
      if (parent.childrenList?.length) return parent
      try {
        return { ...parent, childrenList: await getProductCateList(parent.id) }
      } catch (e) {
        console.info('[Home] load children failed:', parent.id, e)
        return { ...parent, childrenList: [] }
      }
    }),
  )
}

/** 首页精选商品列表 */
export async function getRecommendProductList(pageNum = 1, pageSize = 10): Promise<Product[]> {
  try {
    return await request<Product[]>({
      url: '/mall-portal/home/recommendProductList',
      method: 'GET',
      query: { pageNum, pageSize },
    })
  } catch (e) {
    console.info('[Home] recommend request failed, fallback to mock:', e)
    return mockProducts.slice((pageNum - 1) * pageSize, pageNum * pageSize)
  }
}
