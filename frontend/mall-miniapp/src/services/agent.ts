import Taro from '@tarojs/taro'
import { AGENT_BASE, useMockDirectly } from '@/config'
import { useUserStore } from '@/store/user'

export interface AgentLink {
  label: string
  to: string
}

export interface AgentReply {
  reply: string
  links?: AgentLink[]
}

/** 会话 id：优先持久化，避免刷新后丢失上下文 */
export function getAgentSessionId(): string {
  const KEY = 'mall_agent_session'
  try {
    let id = Taro.getStorageSync(KEY) as string
    if (!id) {
      id = `sess-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
      Taro.setStorageSync(KEY, id)
    }
    return id
  } catch (e) {
    console.error('[Agent] storage unavailable:', e)
    return `sess-${Date.now().toString(36)}`
  }
}

/** Agent 服务不可用时的本地知识库降级（与商城 H5 客服口径一致） */
function localAnswer(question: string): AgentReply {
  const q = question.toLowerCase()
  if (/订单|物流|快递|配送|发货/.test(q)) {
    return {
      reply: '登录后可在「我的订单」查看订单状态和物流信息。选择对应订单即可查看详情。',
      links: [
        { label: '我的订单', to: '/pages/order-list/index' },
        { label: '会员中心', to: '/pages/mine/index' },
      ],
    }
  }
  if (/优惠券|领券|折扣|优惠/.test(q)) {
    return {
      reply: '下单时可以在确认订单页查看可用优惠券；部分优惠券有使用门槛或有效期，记得核对规则。',
      links: [
        { label: '继续购物', to: '/pages/index/index' },
        { label: '购物车', to: '/pages/cart/index' },
      ],
    }
  }
  if (/退货|退款|售后|取消/.test(q)) {
    return {
      reply: '请先到我的订单找到对应订单并确认当前状态。当前商城支持订单查询；如需提交售后申请，请联系店铺客服处理。',
      links: [{ label: '查看我的订单', to: '/pages/order-list/index' }],
    }
  }
  if (/商品|搜索|找|分类|推荐/.test(q)) {
    return {
      reply: '可以用顶部搜索框按商品名或品牌查找，也可以按分类浏览；打开商品详情还能查看价格和规格。',
      links: [
        { label: '搜索商品', to: '/pages/search/index' },
        { label: '浏览分类', to: '/pages/category/index' },
      ],
    }
  }
  if (/地址|收货|账号|登录|会员/.test(q)) {
    return {
      reply: '登录后可以在会员中心查看收货地址；订单查询也需要先登录。',
      links: [
        { label: '会员中心', to: '/pages/mine/index' },
        { label: '登录 / 注册', to: '/pages/login/index' },
      ],
    }
  }
  return {
    reply: '我可以帮您找商品、查看订单物流、了解优惠券使用方式。您也可以选择一个常见问题继续。',
    links: [
      { label: '找商品', to: '/pages/search/index' },
      { label: '我的订单', to: '/pages/order-list/index' },
    ],
  }
}

/** AI 客服对话：优先请求 mall-ai-agent，失败时降级本地知识库 */
export async function chatWithAgent(message: string, sessionId: string): Promise<AgentReply> {
  if (useMockDirectly()) return localAnswer(message)
  const header: Record<string, string> = { 'Content-Type': 'application/json' }
  const { token, tokenHead } = useUserStore.getState()
  if (token) header.Authorization = `${tokenHead || 'Bearer '}${token}`
  try {
    const res = await Taro.request({
      url: `${AGENT_BASE}/chat`,
      method: 'POST',
      data: { message, session_id: sessionId, role: 'customer' },
      header,
      timeout: 30000,
    })
    if (res.statusCode === 200 && res.data && typeof res.data === 'object') {
      const data = res.data as { reply?: string; links?: AgentLink[] }
      if (data.reply) {
        console.info('[Agent] reply received')
        return { reply: data.reply, links: data.links }
      }
    }
    throw new Error(`unexpected response: ${res.statusCode}`)
  } catch (e) {
    console.info('[Agent] chat failed, fallback to local knowledge base:', e)
    return localAnswer(message)
  }
}
