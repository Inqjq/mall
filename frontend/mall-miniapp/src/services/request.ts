import Taro from '@tarojs/taro'
import { API_BASE, useMockDirectly } from '@/config'
import { useUserStore } from '@/store/user'

export interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  /** 请求体（POST JSON） */
  data?: unknown
  /** 查询参数（GET/POST 均拼到 URL query） */
  query?: Record<string, string | number | boolean | undefined>
}

export class ApiError extends Error {
  code: number
  constructor(message: string, code: number) {
    super(message)
    this.code = code
  }
}

let redirectingToLogin = false

/**
 * 网关请求封装：
 * - 自动携带 Authorization 头（tokenHead + token）
 * - 剥掉 CommonResult 外壳，直接返回 data
 * - 401 时清除登录态并引导登录
 */
export function request<T>(options: RequestOptions): Promise<T> {
  if (useMockDirectly()) {
    return Promise.reject(new ApiError('预览环境：HTTPS 页面无法直连 HTTP 接口，已切换本地数据', -2))
  }
  const { url, method = 'GET', data, query } = options
  let fullUrl = `${API_BASE}${url}`
  const qs = Object.entries(query || {})
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&')
  if (qs) fullUrl += (url.includes('?') ? '&' : '?') + qs

  const header: Record<string, string> = { 'Content-Type': 'application/json' }
  const { token, tokenHead } = useUserStore.getState()
  if (token) header.Authorization = `${tokenHead || 'Bearer '}${token}`

  return new Promise<T>((resolve, reject) => {
    Taro.request({
      url: fullUrl,
      method,
      data: data as never,
      header,
      timeout: 15000,
      success: (res) => {
        const body = res.data as { code?: number; message?: string; data?: T } | null
        if (res.statusCode >= 200 && res.statusCode < 300 && body && body.code === 200) {
          resolve(body.data as T)
          return
        }
        if (body && body.code === 401) {
          useUserStore.getState().logout()
          Taro.showToast({ title: '请先登录', icon: 'none' })
          const pages = Taro.getCurrentPages()
          const current = pages[pages.length - 1]
          if (!redirectingToLogin && current && current.route !== 'pages/login/index') {
            redirectingToLogin = true
            Taro.navigateTo({
              url: '/pages/login/index',
              complete: () => {
                redirectingToLogin = false
              },
            })
          }
          reject(new ApiError(body.message || '未授权', 401))
          return
        }
        const message = (body && body.message) || `请求失败(${res.statusCode})`
        console.error('[API]', url, message)
        Taro.showToast({ title: message, icon: 'none' })
        reject(new ApiError(message, body?.code ?? res.statusCode))
      },
      fail: (err) => {
        console.info('[API] network error:', url, err.errMsg)
        reject(new ApiError('网络异常，请稍后重试', -1))
      },
    })
  })
}
