import { request } from './request'
import type { CommonPage, MemberAddress, Order } from '@/types/api'

/** 收货地址列表 */
export function getAddressList(): Promise<MemberAddress[]> {
  return request<MemberAddress[]>({ url: '/mall-portal/member/address/list', method: 'GET' })
}

/** 生成订单 */
export function generateOrder(data: {
  memberReceiveAddressId: number
  cartIds: number[]
  couponId?: number
  payType: number
}): Promise<{ order: Order; payResult?: unknown } | number> {
  return request<{ order: Order; payResult?: unknown } | number>({
    url: '/mall-portal/order/generateOrder',
    method: 'POST',
    data,
  })
}

/** 我的订单分页（status=-1 查全部） */
export function getOrderList(params: { status: number; pageNum: number; pageSize: number }): Promise<CommonPage<Order>> {
  return request<CommonPage<Order>>({ url: '/mall-portal/order/list', method: 'GET', query: params })
}
