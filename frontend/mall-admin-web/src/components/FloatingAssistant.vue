<template>
  <div v-if="!assistantDisabled" ref="dockRef" class="assistant-dock" :style="dockStyle">
    <button
      class="assistant-launcher"
      :class="[tucked ? `assistant-launcher--tucked-${edgeDirection}` : '', { 'assistant-launcher--dragging': dragging, 'assistant-launcher--open': open }]"
      :style="{ '--assistant-accent': config.accent }"
      type="button"
      :aria-label="`打开${config.title}`"
      :aria-expanded="open"
      @pointerdown="startDrag"
      @pointermove="moveDrag"
      @pointerup="endDrag"
      @pointercancel="endDrag"
      @click="toggleOpen"
      @mouseenter="tucked = false"
      @mouseleave="tuckLauncher"
    >
      <svg class="launcher-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2 13.8 8l4.9 1.8-4.9 1.8-1.8 4.9-1.8-4.9-4.9-1.8L10.2 8 12 3.2Z"/><path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z"/></svg>
      <span>{{ config.button }}</span><i class="launcher-grip" aria-hidden="true">⠿</i>
    </button>

    <Transition name="assistant-pop">
      <section v-if="open" class="assistant-panel" :style="{ '--assistant-accent': config.accent }" role="dialog" aria-modal="false" :aria-label="config.title" @pointerdown="resetIdleTimer" @keydown="resetIdleTimer">
        <header class="assistant-header">
          <span class="assistant-avatar"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2 13.8 8l4.9 1.8-4.9 1.8-1.8 4.9-1.8-4.9-4.9-1.8L10.2 8 12 3.2Z"/><path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z"/></svg></span>
          <span class="assistant-heading"><b>{{ config.title }}</b><small><i></i>{{ config.subtitle }}</small></span>
          <button class="assistant-close" type="button" aria-label="关闭助手" @click="closePanel">×</button>
        </header>
        <div ref="messageList" class="assistant-messages" aria-live="polite">
          <div v-for="message in messages" :key="message.id" class="message-row" :class="`message-row--${message.role}`">
            <div v-if="message.role === 'assistant'" class="message-bubble md-body" v-html="renderMd(message.text)"></div>
            <div v-else class="message-bubble">{{ message.text }}</div>
            <div v-if="message.links?.length" class="message-actions">
              <button v-for="link in message.links" :key="link.to" type="button" @click="visit(link.to)">{{ link.label }}<span>›</span></button>
            </div>
          </div>
          <div v-if="pending" class="message-row message-row--assistant"><div class="message-bubble typing">正在思考<span class="typing-dots"><i></i><i></i><i></i></span></div></div>
          <div v-if="messages.length === 1 && !pending" class="assistant-suggestions"><span>可以试试</span><button v-for="item in config.suggestions" :key="item" type="button" @click="send(item)">{{ item }}<span>›</span></button></div>
        </div>
        <form class="assistant-composer" @submit.prevent="send(input)">
          <input v-model="input" :placeholder="config.placeholder" maxlength="240" aria-label="输入问题" />
          <button type="submit" :disabled="!input.trim() || pending" aria-label="发送消息"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 4 17 8-17 8 3-8-3-8Zm3 8h13"/></svg></button>
        </form>
        <div class="assistant-footnote">{{ config.footnote }}</div>
      </section>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

type Role = 'admin' | 'merchant' | 'customer'
type LinkAction = { label: string; to: string }
type Message = { id: number; role: 'assistant' | 'user'; text: string; links?: LinkAction[] }
// apiBase：mall-ai-agent 服务地址；getToken：可选，返回完整 Authorization 头值（含 Bearer 前缀），由嵌入方按所在端提供
const props = withDefaults(
  defineProps<{ role: Role; apiBase?: string; getToken?: () => string | null }>(),
  { apiBase: 'http://localhost:8500', getToken: undefined },
)
const configByRole = {
  admin: {
    title: '后台工作助手', button: '工作助手', subtitle: '系统管理 · 业务处理', accent: '#2f66c5', placeholder: '问商品、订单或权限管理…', footnote: '工作流指引 · 操作仍由你确认',
    suggestions: ['今天先处理什么？', '批量发货怎么操作？', '优惠券和秒杀在哪里？'],
  },
  merchant: {
    title: '店铺经营助手', button: '经营助手', subtitle: '订单履约 · 商品经营', accent: '#c94d24', placeholder: '问订单、库存或店铺营销…', footnote: '店铺经营指引 · 修改前可先核对数据',
    suggestions: ['我有待发货订单', '哪些商品库存偏低？', '怎么创建优惠券？'],
  },
  customer: {
    title: 'Mall 在线客服', button: '在线客服', subtitle: '购物咨询 · 订单服务', accent: '#df3026', placeholder: '问商品、优惠或订单问题…', footnote: '自助服务 · 订单信息请登录后查看',
    suggestions: ['怎么查看物流？', '优惠券在哪里使用？', '我想找商品'],
  },
} as const
const router = useRouter()
const route = useRoute()
const config = computed(() => configByRole[props.role])
const assistantDisabled = computed(() => route.path === '/login' || (props.role === 'customer' && route.path === '/order/confirm'))
const storageKey = computed(() => `mall_assistant_position_${props.role}`)
const position = ref({ right: 26, bottom: props.role === 'customer' ? 84 : 28 })
const open = ref(false)
const dragging = ref(false)
const tucked = ref(true)
const edgeDirection = ref<'left' | 'right' | 'top' | 'bottom'>('right')
const moved = ref(false)
const input = ref('')
const pending = ref(false)
const messageList = ref<HTMLElement>()
const dockRef = ref<HTMLElement>()
let pointerStart: { x: number; y: number; right: number; bottom: number } | undefined
let messageId = 1
let sessionId = crypto.randomUUID()
let idleTimer: ReturnType<typeof setTimeout> | undefined
const messages = ref<Message[]>([{ id: messageId++, role: 'assistant', text: welcomeFor(props.role) }])
const dockStyle = computed(() => ({ right: `${position.value.right}px`, bottom: `${position.value.bottom}px` }))

function welcomeFor(role: Role) {
  if (role === 'admin') return '你好，我可以帮你快速定位后台功能、梳理常见处理流程。你可以直接问订单、商品、营销或权限。'
  if (role === 'merchant') return '你好，我可以协助处理店铺订单、商品库存和营销活动，也能直接带你到对应的操作页面。'
  return '您好，欢迎咨询 Mall。可以问我商品查找、优惠券使用、订单和物流相关问题。'
}

/** Agent 回复为 markdown，渲染为安全 HTML（v-html 内容不受 scoped 限制，样式用 :deep 处理） */
function renderMd(text: string): string {
  return DOMPurify.sanitize(marked.parse(text, { breaks: true }) as string)
}
function startDrag(event: PointerEvent) {
  if (event.button !== 0) return
  tucked.value = false
  pointerStart = { x: event.clientX, y: event.clientY, right: position.value.right, bottom: position.value.bottom }
  moved.value = false
  ;(event.currentTarget as HTMLButtonElement).setPointerCapture(event.pointerId)
}
function moveDrag(event: PointerEvent) {
  if (!pointerStart) return
  const dx = event.clientX - pointerStart.x
  const dy = event.clientY - pointerStart.y
  if (Math.abs(dx) + Math.abs(dy) > 5) { moved.value = true; dragging.value = true }
  if (!dragging.value) return
  const button = event.currentTarget as HTMLElement
  const rect = button.getBoundingClientRect()
  position.value = {
    right: clamp(pointerStart.right - dx, 8, Math.max(8, window.innerWidth - rect.width - 8)),
    bottom: clamp(pointerStart.bottom - dy, 8, Math.max(8, window.innerHeight - rect.height - 8)),
  }
}
function endDrag() {
  if (!pointerStart) return
  pointerStart = undefined
  dragging.value = false
  if (moved.value) {
    edgeDirection.value = nearestEdge(position.value.right, position.value.bottom)
    const rect = dockRef.value?.getBoundingClientRect()
    const width = rect?.width || 58
    const height = rect?.height || 58
    if (edgeDirection.value === 'right') position.value.right = 8
    else if (edgeDirection.value === 'left') position.value.right = window.innerWidth - width - 8
    else if (edgeDirection.value === 'top') position.value.bottom = window.innerHeight - height - 8
    else position.value.bottom = 8
    localStorage.setItem(storageKey.value, JSON.stringify({ ...position.value, edge: edgeDirection.value }))
    tucked.value = true
  }
}
function nearestEdge(right: number, bottom: number): 'left' | 'right' | 'top' | 'bottom' {
  const rect = dockRef.value?.getBoundingClientRect()
  const width = rect?.width || 58
  const height = rect?.height || 58
  const left = window.innerWidth - right - width
  const top = window.innerHeight - bottom - height
  const distances = [{ edge: 'left' as const, value: left }, { edge: 'right' as const, value: right }, { edge: 'top' as const, value: top }, { edge: 'bottom' as const, value: bottom }]
  return distances.reduce((closest, current) => current.value < closest.value ? current : closest).edge
}
function tuckLauncher() { if (!dragging.value) tucked.value = true }
function toggleOpen() {
  if (moved.value) { moved.value = false; return }
  open.value = !open.value
  if (open.value) resetIdleTimer()
  else clearIdleTimer()
}
function resetIdleTimer() {
  clearIdleTimer()
  if (open.value) idleTimer = setTimeout(() => { open.value = false }, 120000)
}
function clearIdleTimer() { if (idleTimer) clearTimeout(idleTimer); idleTimer = undefined }
function closePanel() { open.value = false; clearIdleTimer() }
function closeOnOutside(event: PointerEvent) { if (open.value && !dockRef.value?.contains(event.target as Node)) closePanel() }
function closeOnEscape(event: KeyboardEvent) { if (event.key === 'Escape') closePanel() }
function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)) }
function responseFor(question: string): { text: string; links: LinkAction[] } {
  const q = question.toLowerCase()
  if (props.role === 'admin') {
    if (/订单|发货|物流|退款|售后/.test(q)) return { text: '订单相关可以从订单管理开始：按状态筛选，批量处理待发货订单；售后申请也在订单中心。', links: [{ label: '订单管理', to: '/order' }, { label: '售后申请', to: '/order/returns' }] }
    if (/商品|库存|上架|分类|品牌/.test(q)) return { text: '商品、分类和品牌都在商品管理中。先用筛选缩小范围，再选择单条编辑或批量调整状态。', links: [{ label: '商品列表', to: '/product' }, { label: '商品分类', to: '/product/category' }] }
    if (/优惠券|秒杀|营销|活动/.test(q)) return { text: '营销中心可以维护优惠券、秒杀和首页推荐内容。', links: [{ label: '优惠券与活动', to: '/marketing/coupon' }, { label: '首页推荐', to: '/marketing/home-brand' }] }
    if (/用户|权限|角色|账号/.test(q)) return { text: '系统用户页维护后台账号，角色页配置菜单与操作权限。涉及权限调整时，建议先核对目标账号和角色。', links: [{ label: '系统用户', to: '/system/user' }, { label: '角色管理', to: '/system/roles' }] }
    if (/数据|经营|统计|今天|待处理/.test(q)) return { text: '经营看板汇总商品、订单和履约状态。待发货、售后和库存问题可以从看板或对应列表继续处理。', links: [{ label: '经营看板', to: '/dashboard' }, { label: '订单管理', to: '/order?status=1' }] }
    return { text: '我可以协助定位商品、订单、营销或账号权限功能。告诉我你现在要处理哪一类事情。', links: [{ label: '订单管理', to: '/order' }, { label: '商品管理', to: '/product' }] }
  }
  if (props.role === 'merchant') {
    if (/发货|物流|订单|快递/.test(q)) return { text: '待发货订单支持多选批量发货。提交前需要为每笔订单分别填写物流公司和运单号。', links: [{ label: '处理待发货', to: '/orders?status=1' }, { label: '查看全部订单', to: '/orders' }] }
    if (/库存|缺货|低库存/.test(q)) return { text: '库存预警会筛出库存不高于 10 件的商品。你可以进入列表检查库存和 SKU，再编辑商品资料。', links: [{ label: '查看库存预警', to: '/products?stock=low' }, { label: '新增商品', to: '/products/create' }] }
    if (/优惠券|领券|折扣/.test(q)) return { text: '优惠券可以按金额、发行数量、使用门槛和领取时间创建；指定商品或分类的适用范围需按页面提示继续配置。', links: [{ label: '优惠券管理', to: '/marketing?tab=coupons' }] }
    if (/秒杀|限时|活动|营销/.test(q)) return { text: '秒杀活动可设置名称和起止时间，创建后还能单独启用或关闭。秒杀商品需要在活动配置中关联。', links: [{ label: '秒杀活动', to: '/marketing?tab=flash' }] }
    if (/商品|上架|发布|编辑/.test(q)) return { text: '商品列表支持批量上架、下架；新商品可从商品管理创建，提交前检查价格、库存和图片。', links: [{ label: '商品管理', to: '/products' }, { label: '发布商品', to: '/products/create' }] }
    return { text: '我能帮你处理订单发货、商品库存、优惠券和秒杀活动。说说你现在要完成的任务。', links: [{ label: '经营概况', to: '/overview' }, { label: '营销活动', to: '/marketing' }] }
  }
  if (/订单|物流|快递|配送|发货/.test(q)) return { text: '登录后可在“我的订单”查看订单状态和物流信息。选择对应订单即可查看详情。', links: [{ label: '我的订单', to: '/order/list' }, { label: '会员中心', to: '/mine' }] }
  if (/优惠券|领券|折扣|优惠/.test(q)) return { text: '下单时可以在确认订单页查看可用优惠券；部分优惠券有使用门槛或有效期，记得核对规则。', links: [{ label: '继续购物', to: '/' }, { label: '购物车', to: '/cart' }] }
  if (/退货|退款|售后|取消/.test(q)) return { text: '请先到我的订单找到对应订单并确认当前状态。当前商城页面提供订单查询；如需提交售后申请，请联系店铺客服处理。', links: [{ label: '查看我的订单', to: '/order/list' }] }
  if (/商品|搜索|找|分类|推荐/.test(q)) return { text: '可以用顶部搜索框按商品名或品牌查找，也可以按分类浏览；打开商品详情还能查看价格和规格。', links: [{ label: '搜索商品', to: '/search' }, { label: '浏览分类', to: '/category' }] }
  if (/地址|收货|账号|登录|会员/.test(q)) return { text: '登录后可以在会员中心管理个人信息和收货地址；订单查询也需要先登录。', links: [{ label: '会员中心', to: '/mine' }, { label: '登录 / 注册', to: '/login' }] }
  return { text: '我可以帮您找商品、查看订单物流、了解优惠券使用方式。您也可以选择一个常见问题继续。', links: [{ label: '找商品', to: '/search' }, { label: '我的订单', to: '/order/list' }] }
}
async function send(value: string) {
  const question = value.trim()
  if (!question || pending.value) return
  messages.value.push({ id: messageId++, role: 'user', text: question })
  input.value = ''
  pending.value = true
  resetIdleTimer()
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    const authorization = props.getToken?.()
    if (authorization) headers.Authorization = authorization
    const res = await fetch(`${props.apiBase}/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message: question, session_id: sessionId, role: props.role }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = (await res.json()) as { reply?: string; links?: LinkAction[] }
    messages.value.push({
      id: messageId++,
      role: 'assistant',
      text: data.reply || '抱歉，我暂时没有理解您的问题。',
      links: data.links?.length ? data.links : undefined,
    })
  } catch {
    // Agent 服务不可用时降级到本地知识库，保证客服可用性
    const answer = responseFor(question)
    messages.value.push({ id: messageId++, role: 'assistant', ...answer })
  } finally {
    pending.value = false
  }
  if (messages.value.length > 21) messages.value.splice(1, 2)
}
function visit(path: string) { closePanel(); router.push(path) }
watch(() => messages.value.length, async () => { await nextTick(); messageList.value?.scrollTo({ top: messageList.value.scrollHeight, behavior: 'smooth' }) })
watch(assistantDisabled, (disabled) => { if (disabled) { open.value = false; clearIdleTimer() } })
onMounted(() => {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey.value) || 'null') as { right?: number; bottom?: number; edge?: 'left' | 'right' | 'top' | 'bottom' } | null
    if (saved) {
      position.value = { right: clamp(Number(saved.right) || 26, 8, window.innerWidth - 74), bottom: clamp(Number(saved.bottom) || (props.role === 'customer' ? 84 : 28), 8, window.innerHeight - 60) }
      edgeDirection.value = saved.edge || nearestEdge(position.value.right, position.value.bottom)
    } else edgeDirection.value = nearestEdge(position.value.right, position.value.bottom)
  } catch { /* 忽略损坏的位置记录 */ }
  document.addEventListener('pointerdown', closeOnOutside)
  document.addEventListener('keydown', closeOnEscape)
})
onBeforeUnmount(() => { pointerStart = undefined; clearIdleTimer(); document.removeEventListener('pointerdown', closeOnOutside); document.removeEventListener('keydown', closeOnEscape) })
</script>

<style scoped>
.assistant-dock { position:fixed; z-index:1200; display:flex; align-items:flex-end; justify-content:flex-end; pointer-events:none; }
.assistant-launcher { position:relative; display:flex; min-width:58px; height:58px; align-items:center; justify-content:center; gap:7px; padding:0 16px; border:0; border-radius:30px; color:#fff; background:var(--assistant-accent); box-shadow:0 8px 24px color-mix(in srgb,var(--assistant-accent) 26%,transparent),0 2px 6px rgba(25,35,45,.15); cursor:grab; pointer-events:auto; touch-action:none; user-select:none; transition:box-shadow .22s,transform .42s cubic-bezier(.22,1.18,.36,1); }
.assistant-launcher:hover,.assistant-launcher--open { box-shadow:0 11px 28px color-mix(in srgb,var(--assistant-accent) 35%,transparent),0 3px 8px rgba(25,35,45,.18); }
.assistant-launcher--tucked-right { transform:translateX(calc(100% - 13px)); }.assistant-launcher--tucked-right:hover { transform:translateX(0); }
.assistant-launcher--tucked-left { transform:translateX(calc(-100% + 13px)); }.assistant-launcher--tucked-left:hover { transform:translateX(0); }
.assistant-launcher--tucked-top { transform:translateY(calc(-100% + 13px)); }.assistant-launcher--tucked-top:hover { transform:translateY(0); }
.assistant-launcher--tucked-bottom { transform:translateY(calc(100% - 13px)); }.assistant-launcher--tucked-bottom:hover { transform:translateY(0); }
.assistant-launcher--dragging { cursor:grabbing; transform:scale(1.04); }
.launcher-icon { width:21px; height:21px; fill:none; stroke:currentColor; stroke-linecap:round; stroke-linejoin:round; stroke-width:1.8; }
.assistant-launcher > span { font-size:12px; font-weight:650; white-space:nowrap; }
.launcher-grip { position:absolute; top:2px; right:6px; color:rgba(255,255,255,.68); font-size:11px; font-style:normal; line-height:1; }
.assistant-panel { position:fixed; right:24px; bottom:102px; display:flex; width:min(520px,calc(100vw - 28px)); height:min(720px,calc(100vh - 126px)); flex-direction:column; overflow:hidden; border:1px solid #e7e9ed; border-radius:14px; background:#fff; box-shadow:0 22px 70px rgba(21,31,45,.2),0 4px 14px rgba(21,31,45,.08); pointer-events:auto; transform-origin:bottom right; }
.assistant-header { display:flex; min-height:69px; align-items:center; gap:11px; padding:12px 15px; border-bottom:1px solid #edf0f3; background:linear-gradient(115deg,color-mix(in srgb,var(--assistant-accent) 8%,white),#fff 76%); }
.assistant-avatar { display:grid; width:36px; height:36px; flex:0 0 36px; place-items:center; border-radius:11px; color:white; background:var(--assistant-accent); box-shadow:0 3px 8px color-mix(in srgb,var(--assistant-accent) 22%,transparent); }
.assistant-avatar svg { width:20px; height:20px; fill:none; stroke:currentColor; stroke-linecap:round; stroke-linejoin:round; stroke-width:1.7; }
.assistant-heading { display:grid; min-width:0; flex:1; gap:4px; }
.assistant-heading b { color:#303943; font-size:13px; font-weight:650; }
.assistant-heading small { display:flex; align-items:center; gap:5px; color:#858e97; font-size:10px; }
.assistant-heading small i { width:6px; height:6px; border-radius:50%; background:#4cad75; box-shadow:0 0 0 3px #eaf6ee; }
.assistant-close { width:28px; height:28px; border:0; border-radius:50%; color:#89929a; background:transparent; font-size:23px; line-height:1; cursor:pointer; }
.assistant-close:hover { color:#333c44; background:#f0f2f4; }
.assistant-messages { display:flex; min-height:0; flex:1; flex-direction:column; gap:13px; overflow:auto; padding:15px 13px; background:#f7f8fa; scrollbar-width:thin; }
.message-row { display:flex; max-width:92%; flex-direction:column; align-items:flex-start; gap:7px; }
.message-row--user { align-self:flex-end; align-items:flex-end; }
.message-bubble { padding:10px 12px; border:1px solid #eceff2; border-radius:4px 12px 12px 12px; color:#414b54; background:#fff; font-size:11px; line-height:1.75; white-space:pre-wrap; overflow-wrap:anywhere; }
.message-row--user .message-bubble { border-color:var(--assistant-accent); border-radius:12px 4px 12px 12px; color:#fff; background:var(--assistant-accent); }
.md-body { white-space:normal; }
.md-body :deep(p) { margin:0 0 6px; }
.md-body :deep(p:last-child) { margin-bottom:0; }
.md-body :deep(ul),.md-body :deep(ol) { margin:4px 0 6px; padding-left:16px; }
.md-body :deep(li) { margin:2px 0; }
.md-body :deep(strong) { font-weight:650; }
.md-body :deep(blockquote) { margin:6px 0; padding:4px 10px; border-left:3px solid color-mix(in srgb,var(--assistant-accent) 45%,white); background:#f7f8fa; border-radius:4px; }
.md-body :deep(code) { padding:1px 4px; border-radius:3px; background:#f1f3f5; font-size:10px; }
.md-body :deep(h1),.md-body :deep(h2),.md-body :deep(h3) { margin:8px 0 4px; font-size:12px; font-weight:650; }
.md-body :deep(a) { color:var(--assistant-accent); text-decoration:underline; }
.md-body :deep(hr) { border:0; border-top:1px solid #eceff2; margin:8px 0; }
.message-actions { display:flex; flex-wrap:wrap; gap:6px; }
.message-actions button,.assistant-suggestions button { display:flex; align-items:center; gap:8px; padding:6px 9px; border:1px solid color-mix(in srgb,var(--assistant-accent) 21%,white); border-radius:5px; color:var(--assistant-accent); background:#fff; font-size:10px; cursor:pointer; transition:background .15s,border-color .15s; }
.message-actions button:hover,.assistant-suggestions button:hover { border-color:var(--assistant-accent); background:color-mix(in srgb,var(--assistant-accent) 5%,white); }
.message-actions button span,.assistant-suggestions button span { font-size:14px; line-height:10px; }
.assistant-suggestions { display:grid; align-self:stretch; gap:6px; margin-top:auto; padding-top:4px; }
.assistant-suggestions > span { margin-bottom:1px; color:#929aa2; font-size:10px; }
.assistant-suggestions button { justify-content:space-between; min-height:33px; text-align:left; }
.assistant-composer { display:flex; min-height:55px; align-items:center; gap:8px; padding:9px 11px; border-top:1px solid #e9edf0; background:#fff; }
.assistant-composer input { min-width:0; flex:1; height:36px; padding:0 11px; border:1px solid #e3e7eb; border-radius:6px; outline:0; color:#38434c; background:#fafbfc; font-size:11px; }
.assistant-composer input:focus { border-color:var(--assistant-accent); background:#fff; box-shadow:0 0 0 2px color-mix(in srgb,var(--assistant-accent) 12%,transparent); }
.assistant-composer input::placeholder { color:#a0a8af; }
.assistant-composer > button { display:grid; width:36px; height:36px; flex:0 0 36px; place-items:center; border:0; border-radius:6px; color:#fff; background:var(--assistant-accent); cursor:pointer; }
.assistant-composer > button:disabled { background:#c8cdd2; cursor:not-allowed; }
.assistant-composer > button svg { width:17px; height:17px; fill:none; stroke:currentColor; stroke-linecap:round; stroke-linejoin:round; stroke-width:1.8; }
.assistant-footnote { padding:0 12px 9px; color:#a2a9af; background:#fff; font-size:9px; text-align:center; }
.typing { display:inline-flex; align-items:center; gap:6px; color:#858e97; }
.typing-dots { display:inline-flex; gap:3px; }
.typing-dots i { width:4px; height:4px; border-radius:50%; background:#b6bec6; animation:assistant-typing 1.2s infinite ease-in-out; }
.typing-dots i:nth-child(2) { animation-delay:.15s; }
.typing-dots i:nth-child(3) { animation-delay:.3s; }
@keyframes assistant-typing { 0%,60%,100% { opacity:.35; transform:translateY(0); } 30% { opacity:1; transform:translateY(-2px); } }
.assistant-pop-enter-active { transition:opacity .28s ease-out,transform .36s cubic-bezier(.22,.72,.25,1); }
.assistant-pop-leave-active { transition:opacity .22s ease-in,transform .26s cubic-bezier(.4,0,.8,.3); }
.assistant-pop-enter-from { opacity:0; transform:translateX(42px); }
.assistant-pop-leave-to { opacity:0; transform:translateX(34px); }
@media (max-width:600px) { .assistant-launcher { min-width:52px; height:52px; padding:0 13px; }.assistant-panel { right:12px; bottom:calc(144px + env(safe-area-inset-bottom)); width:calc(100vw - 20px); height:min(680px,calc(100vh - 150px)); border-radius:12px; } }
@media (prefers-reduced-motion:reduce) { .assistant-launcher,.assistant-pop-enter-active,.assistant-pop-leave-active { transition:none; }.assistant-pop-enter-from,.assistant-pop-leave-to { transform:none; } }
</style>
