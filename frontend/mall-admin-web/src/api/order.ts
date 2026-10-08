import { request } from '@/utils/request'
import type { CommonPage, OmsOrder, OmsOrderDeliveryParam, OmsOrderDetail } from '@/types/api'

/** 订单分页列表 */
export function getOrderList(params: {
  pageNum: number
  pageSize: number
  orderSn?: string
  status?: number | null
}): Promise<CommonPage<OmsOrder>> {
  return request<CommonPage<OmsOrder>>({ url: '/mall-admin/order/list', method: 'get', params })
}

/** 订单详情：订单信息、商品信息、操作记录（GET /mall-admin/order/{id}） */
export function getOrderDetail(id: number): Promise<OmsOrderDetail> {
  return request<OmsOrderDetail>({ url: `/mall-admin/order/${id}`, method: 'get' })
}

/** 批量发货（POST /mall-admin/order/update/delivery） */
export function deliverOrder(data: OmsOrderDeliveryParam[]) {
  return request({ url: '/mall-admin/order/update/delivery', method: 'post', data })
}
