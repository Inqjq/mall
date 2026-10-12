/**
 * 全局配置：后端网关与 AI 客服地址
 *
 * 开发/预览默认走服务器 IP 入口（HTTP，稳定可达）；
 * 域名备案完成后正式发布时切换为 HTTPS 域名：
 *   API_BASE  = 'https://shop.xqkaifa.art/gateway'
 *   AGENT_BASE = 'https://shop.xqkaifa.art/agent'
 * （微信小程序正式版要求 HTTPS + 已配置 request 合法域名）
 */
export const API_BASE = 'http://119.29.167.133:8088/gateway'
export const AGENT_BASE = 'http://119.29.167.133:8088/agent'

/**
 * 预览环境判断：预览沙箱页面为 HTTPS，请求 http:// 接口会被浏览器混合内容拦截，
 * 请求必失败且会被沙箱监控上报为应用异常。此场景下不发请求，直接走本地 mock。
 * 真机小程序（无 window）、本地 http 开发均不受影响。
 */
export function useMockDirectly(): boolean {
  try {
    if (typeof window === 'undefined' || !/^http:/.test(API_BASE)) return false
    const protocol = window.location.protocol
    return protocol !== 'http:' && protocol !== 'file:'
  } catch {
    return false
  }
}
