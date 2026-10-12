import { request } from './request'
import type { LoginResult } from '@/types/api'

/** 会员登录（免登录白名单接口，参数走 query） */
export function login(username: string, password: string): Promise<LoginResult> {
  return request<LoginResult>({
    url: '/mall-portal/sso/login',
    method: 'POST',
    query: { username, password },
  })
}
