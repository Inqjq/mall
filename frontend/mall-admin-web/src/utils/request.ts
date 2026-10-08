import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'

const TOKEN_KEY = 'mall_admin_token'
const TOKEN_HEAD_KEY = 'mall_admin_token_head'

export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) || ''
}
export function getTokenHead(): string {
  return localStorage.getItem(TOKEN_HEAD_KEY) || 'Bearer '
}
export function setToken(token: string, tokenHead: string) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(TOKEN_HEAD_KEY, tokenHead)
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(TOKEN_HEAD_KEY)
}

const service: AxiosInstance = axios.create({
  baseURL: '/gateway', // 由 vite proxy / nginx 转发到 mall-gateway
  timeout: 15000,
})

service.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = getTokenHead() + token
  }
  return config
})

service.interceptors.response.use(
  (response) => {
    const res = response.data
    // 二进制流直接返回
    if (response.request?.responseType === 'blob' || response.request?.responseType === 'arraybuffer') {
      return res
    }
    // Sa-Token 网关校验失败时 HTTP 状态仍为 200，按 body.code 判断
    if (res.code === 200) {
      return res.data
    }
    if (res.code === 401) {
      clearToken()
      ElMessage.error('登录已过期，请重新登录')
      if (!location.pathname.startsWith('/login')) {
        setTimeout(() => (location.href = '/login'), 500)
      }
      return Promise.reject(new Error(res.message || '未授权'))
    }
    ElMessage.error(res.message || '请求失败')
    return Promise.reject(new Error(res.message || '请求失败'))
  },
  (error) => {
    const msg = error?.response?.status ? `请求错误(${error.response.status})` : '网络异常，请检查网关服务是否启动'
    ElMessage.error(msg)
    return Promise.reject(error)
  },
)

/** 泛型请求助手：拦截器已剥掉 CommonResult 外壳 */
export function request<T>(config: Parameters<AxiosInstance['request']>[0]): Promise<T> {
  return service.request(config) as Promise<T>
}

export default service
