import Taro from '@tarojs/taro'

const TAB_PAGES = [
  '/pages/index/index',
  '/pages/category/index',
  '/pages/cart/index',
  '/pages/mine/index',
]

/** H5 Web 路径 -> 小程序路径映射（AI 客服返回的 links 使用 H5 路径） */
const WEB_TO_MINI: Record<string, string> = {
  '/': '/pages/index/index',
  '/category': '/pages/category/index',
  '/cart': '/pages/cart/index',
  '/mine': '/pages/mine/index',
  '/search': '/pages/search/index',
  '/order/list': '/pages/order-list/index',
  '/login': '/pages/login/index',
}

/** H5 动态路径映射（如商品详情 /product/:id） */
const WEB_TO_MINI_DYNAMIC: Array<{ pattern: RegExp; build: (match: RegExpMatchArray) => string }> = [
  { pattern: /^\/product\/(\d+)$/, build: (m) => `/pages/product/index?id=${m[1]}` },
]

/** 将 H5 Web 路径（可带 query）映射为小程序路径，无法映射返回 null */
export function mapWebPath(web?: string): string | null {
  if (!web) return null
  const [rawPath, search] = web.split('?')
  let pathname = rawPath.replace(/\/+$/, '')
  if (!pathname) pathname = '/'
  let target = WEB_TO_MINI[pathname]
  if (!target) {
    for (const rule of WEB_TO_MINI_DYNAMIC) {
      const match = pathname.match(rule.pattern)
      if (match) {
        target = rule.build(match)
        break
      }
    }
  }
  if (!target) return null
  return search ? `${target}?${search}` : target
}

/** 智能跳转：tab 页 switchTab（不支持 query），其余 navigateTo */
export function smartNavigate(path: string): void {
  const [pathname] = path.split('?')
  if (TAB_PAGES.includes(pathname)) {
    Taro.switchTab({ url: pathname }).catch((err) => console.error('[Nav] switchTab failed:', err))
    return
  }
  Taro.navigateTo({ url: path }).catch((err) => console.error('[Nav] navigateTo failed:', err))
}
