import { request } from '@/utils/request'
import type { LoginResult } from '@/types/api'

/** 会员登录（免登录白名单接口） */
export function login(username: string, password: string): Promise<LoginResult> {
  return request<LoginResult>({
    url: '/mall-portal/sso/login',
    method: 'post',
    params: { username, password },
  })
}
