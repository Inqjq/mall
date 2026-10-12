import Taro from '@tarojs/taro'
import { request } from './request'
import { useUserStore } from '@/store/user'
import type { CartItem } from '@/types/api'

const CART_TAB_INDEX = 2

/** 添加商品到购物车，返回购物车项 id */
export function addCart(data: { productId: number; productSkuId: number; quantity: number }): Promise<number> {
  return request<number>({ url: '/mall-portal/cart/add', method: 'POST', data })
}

/** 购物车列表 */
export function getCartList(): Promise<CartItem[]> {
  return request<CartItem[]>({ url: '/mall-portal/cart/list', method: 'GET' })
}

/** 修改购物车数量 */
export function updateCartQuantity(id: number, quantity: number): Promise<unknown> {
  return request<unknown>({ url: '/mall-portal/cart/update/quantity', method: 'GET', query: { id, quantity } })
}

/** 删除购物车项（body 为 id 数组） */
export function deleteCartItems(ids: number[]): Promise<unknown> {
  return request<unknown>({ url: '/mall-portal/cart/delete', method: 'POST', data: ids })
}

/** 刷新购物车 tab 角标（未登录/失败时移除角标） */
export async function refreshCartBadge(): Promise<void> {
  try {
    if (!useUserStore.getState().token) {
      Taro.removeTabBarBadge({ index: CART_TAB_INDEX })
      return
    }
    const list = await getCartList()
    const count = list.reduce((sum, item) => sum + (item.quantity || 0), 0)
    if (count > 0) {
      await Taro.setTabBarBadge({ index: CART_TAB_INDEX, text: count > 99 ? '99+' : String(count) })
    } else {
      Taro.removeTabBarBadge({ index: CART_TAB_INDEX })
    }
  } catch (e) {
    // 非 tabBar 场景或网络异常时静默处理
    console.error('[Cart] refresh badge failed:', e)
    try {
      Taro.removeTabBarBadge({ index: CART_TAB_INDEX })
    } catch {
      /* ignore */
    }
  }
}
