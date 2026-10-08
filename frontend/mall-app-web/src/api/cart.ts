import { request } from '@/utils/request'
import type { CartItem } from '@/types/api'

/** 添加商品到购物车 */
export function addCart(data: { productId: number; productSkuId: number; quantity: number }): Promise<number> {
  return request<number>({ url: '/mall-portal/cart/add', method: 'post', data })
}

/** 购物车列表 */
export function getCartList(): Promise<CartItem[]> {
  return request<CartItem[]>({ url: '/mall-portal/cart/list', method: 'get' })
}

/** 修改购物车数量 */
export function updateCartQuantity(id: number, quantity: number) {
  return request({ url: '/mall-portal/cart/update/quantity', method: 'get', params: { id, quantity } })
}

/** 删除购物车项（body 为 id 数组） */
export function deleteCartItems(ids: number[]) {
  return request({ url: '/mall-portal/cart/delete', method: 'post', data: ids })
}
