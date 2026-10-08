import { request } from '@/utils/request'
import type { CommonPage } from '@/types/api'

export interface OrderSetting { id: number; flashOrderOvertime?: number; normalOrderOvertime?: number; confirmOvertime?: number; finishOvertime?: number; commentOvertime?: number }
export interface ReturnReason { id: number; name?: string; sort?: number; status?: number; createTime?: string }
export interface ReturnApply { id: number; orderSn?: string; createTime?: string; memberUsername?: string; returnName?: string; returnPhone?: string; returnAmount?: number; productName?: string; productPic?: string; productAttr?: string; productCount?: number; reason?: string; description?: string; status?: number; handleNote?: string; handleMan?: string; proofPics?: string }
export interface Coupon { id: number; name?: string; type?: number; count?: number; amount?: number; minPoint?: number; startTime?: string; endTime?: string; useCount?: number; receiveCount?: number }
export interface FlashCampaign { id: number; title?: string; startDate?: string; endDate?: string; status?: number }
export interface HomeAdvertise { id: number; name?: string; type?: number; pic?: string; startTime?: string; endTime?: string; status?: number; url?: string; sort?: number }
export interface Role { id: number; name?: string; description?: string; adminCount?: number; createTime?: string; status?: number; sort?: number }

export const getOrderSetting = (id = 1) => request<OrderSetting>({ url: `/mall-admin/orderSetting/${id}`, method: 'get' })
export const saveOrderSetting = (id: number, data: OrderSetting) => request({ url: `/mall-admin/orderSetting/update/${id}`, method: 'post', data })
export const getReturnReasons = (params: Record<string, unknown>) => request<CommonPage<ReturnReason>>({ url: '/mall-admin/returnReason/list', method: 'get', params })
export const createReturnReason = (data: Partial<ReturnReason>) => request({ url: '/mall-admin/returnReason/create', method: 'post', data })
export const updateReturnReason = (id: number, data: Partial<ReturnReason>) => request({ url: `/mall-admin/returnReason/update/${id}`, method: 'post', data })
export const deleteReturnReasons = (ids: number[]) => request({ url: '/mall-admin/returnReason/delete', method: 'post', params: { ids: ids.join(',') } })
export const updateReturnReasonStatus = (ids: number[], status: number) => request({ url: '/mall-admin/returnReason/update/status', method: 'post', params: { ids: ids.join(','), status } })
export const getReturnApplies = (params: Record<string, unknown>) => request<CommonPage<ReturnApply>>({ url: '/mall-admin/returnApply/list', method: 'get', params })
export const getReturnApply = (id: number) => request<ReturnApply>({ url: `/mall-admin/returnApply/${id}`, method: 'get' })
export const updateReturnApply = (id: number, data: Record<string, unknown>) => request({ url: `/mall-admin/returnApply/update/status/${id}`, method: 'post', data })
export const getCoupons = (params: Record<string, unknown>) => request<CommonPage<Coupon>>({ url: '/mall-admin/coupon/list', method: 'get', params })
export const createCoupon = (data: Record<string, unknown>) => request({ url: '/mall-admin/coupon/create', method: 'post', data })
export const deleteCoupon = (id: number) => request({ url: `/mall-admin/coupon/delete/${id}`, method: 'post' })
export const getFlashCampaigns = (params: Record<string, unknown>) => request<CommonPage<FlashCampaign>>({ url: '/mall-admin/flash/list', method: 'get', params })
export const createFlashCampaign = (data: Partial<FlashCampaign>) => request({ url: '/mall-admin/flash/create', method: 'post', data })
export const updateFlashStatus = (id: number, status: number) => request({ url: `/mall-admin/flash/update/status/${id}`, method: 'post', params: { status } })
export const deleteFlashCampaign = (id: number) => request({ url: `/mall-admin/flash/delete/${id}`, method: 'post' })
export const getHomeAdvertises = (params: Record<string, unknown>) => request<CommonPage<HomeAdvertise>>({ url: '/mall-admin/home/advertise/list', method: 'get', params })
export const createHomeAdvertise = (data: Partial<HomeAdvertise>) => request({ url: '/mall-admin/home/advertise/create', method: 'post', data })
export const updateHomeAdvertiseStatus = (id: number, status: number) => request({ url: `/mall-admin/home/advertise/update/status/${id}`, method: 'post', params: { status } })
export const deleteHomeAdvertises = (ids: number[]) => request({ url: '/mall-admin/home/advertise/delete', method: 'post', params: { ids: ids.join(',') } })
export const getRoles = (params: Record<string, unknown>) => request<CommonPage<Role>>({ url: '/mall-admin/role/list', method: 'get', params })
export const createRole = (data: Partial<Role>) => request({ url: '/mall-admin/role/create', method: 'post', data })
export const updateRole = (id: number, data: Partial<Role>) => request({ url: `/mall-admin/role/update/${id}`, method: 'post', data })
export const deleteRoles = (ids: number[]) => request({ url: '/mall-admin/role/delete', method: 'post', params: { ids: ids.join(',') } })
export const updateRoleStatus = (id: number, status: number) => request({ url: `/mall-admin/role/updateStatus/${id}`, method: 'post', params: { status } })
