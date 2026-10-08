import { request } from '@/utils/request'
import type { LoginResult } from '@/types/api'

/**
 * 统一登录（mall-auth）
 * @param clientId admin-app=管理后台 / portal-app=商城前台
 */
export function login(clientId: string, username: string, password: string): Promise<LoginResult> {
  return request<LoginResult>({
    url: '/mall-auth/auth/login',
    method: 'post',
    params: { clientId, username, password },
  })
}
