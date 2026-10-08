import { request } from '@/utils/request'
import type { AdminInfo, CommonPage, UmsAdmin } from '@/types/api'

/** 当前登录用户信息（含角色/菜单） */
export function getAdminInfo(): Promise<AdminInfo> {
  return request<AdminInfo>({ url: '/mall-admin/admin/info', method: 'get' })
}

/** 后台用户分页列表 */
export function getAdminList(params: { pageNum: number; pageSize: number; keyword?: string }): Promise<CommonPage<UmsAdmin>> {
  return request<CommonPage<UmsAdmin>>({ url: '/mall-admin/admin/list', method: 'get', params })
}

/** 更新用户状态 */
export function updateAdminStatus(id: number, status: number) {
  return request({ url: `/mall-admin/admin/updateStatus/${id}`, method: 'post', params: { status } })
}
