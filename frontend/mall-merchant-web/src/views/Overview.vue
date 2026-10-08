<template>
  <div class="dashboard-page">
    <div class="page-heading dashboard-heading">
      <div><h1>经营概况</h1><p>查看店铺商品、订单和需要处理的事项</p></div>
      <el-button :icon="Refresh" :loading="loading" @click="load">刷新数据</el-button>
    </div>

    <div class="dashboard-columns">
      <div class="dashboard-main-column">
        <section class="action-strip" aria-label="待处理事项">
          <router-link class="action-tile action-tile--urgent" to="/orders?status=1">
            <span class="action-tile-icon"><el-icon><Van /></el-icon></span>
            <span class="action-tile-copy"><b>待发货订单</b><small>尽快填写物流信息</small></span>
            <strong>{{ number(metrics.waitingShipment) }}</strong><el-icon class="action-tile-arrow"><ArrowRight /></el-icon>
          </router-link>
          <router-link class="action-tile" to="/products?stock=low">
            <span class="action-tile-icon action-tile-icon--yellow"><el-icon><Warning /></el-icon></span>
            <span class="action-tile-copy"><b>库存偏低</b><small>已加载商品中库存不高于 10 件</small></span>
            <strong>{{ number(lowStockCount) }}</strong><el-icon class="action-tile-arrow"><ArrowRight /></el-icon>
          </router-link>
          <router-link class="action-tile" to="/products?status=0">
            <span class="action-tile-icon action-tile-icon--blue"><el-icon><Goods /></el-icon></span>
            <span class="action-tile-copy"><b>已下架商品</b><small>查看当前未上架商品</small></span>
            <strong>{{ number(metrics.offline) }}</strong><el-icon class="action-tile-arrow"><ArrowRight /></el-icon>
          </router-link>
        </section>

        <section class="surface overview-stats">
          <div class="surface-heading overview-stats-heading">
            <div><h2>经营数据</h2><p>订单与商品记录 · 更新于 {{ updatedAt || '—' }}</p></div>
            <span class="data-scope">当前账号可查看的数据</span>
          </div>
          <div v-loading="loading" class="stats-grid">
            <router-link class="stat-cell" to="/products"><span>商品总数</span><strong>{{ number(metrics.products) }}</strong><small>全部商品</small></router-link>
            <router-link class="stat-cell" to="/products?status=1"><span>在售商品</span><strong>{{ number(metrics.live) }}</strong><small>当前已上架</small></router-link>
            <router-link class="stat-cell" to="/orders"><span>订单总数</span><strong>{{ number(metrics.orders) }}</strong><small>全部订单</small></router-link>
            <router-link class="stat-cell stat-cell--orange" to="/orders?status=0"><span>待付款</span><strong>{{ number(metrics.waitingPayment) }}</strong><small>等待买家付款</small></router-link>
            <router-link class="stat-cell stat-cell--orange" to="/orders?status=1"><span>待发货</span><strong>{{ number(metrics.waitingShipment) }}</strong><small>等待商家处理</small></router-link>
            <router-link class="stat-cell" to="/orders?status=2"><span>已发货</span><strong>{{ number(metrics.shipped) }}</strong><small>运输中订单</small></router-link>
            <router-link class="stat-cell" to="/orders?status=3"><span>已完成</span><strong>{{ number(metrics.completed) }}</strong><small>已完成交易</small></router-link>
            <router-link class="stat-cell" to="/orders?status=4"><span>已关闭</span><strong>{{ number(metrics.closed) }}</strong><small>关闭订单</small></router-link>
          </div>
        </section>

        <div class="insight-grid">
          <section class="surface trend-panel">
            <div class="surface-heading"><div><h2>近 7 日订单走势</h2><p>按下单日期统计，订单量 {{ number(weekOrderTotal) }} 笔</p></div><el-icon class="insight-heading-icon"><DataLine /></el-icon></div>
            <div v-if="trendReady && weekOrderTotal" class="trend-chart" role="img" :aria-label="`近7日订单量，共${weekOrderTotal}笔`">
              <div class="trend-y-axis"><span>{{ number(trendMax) }}</span><span>{{ number(Math.round(trendMax / 2)) }}</span><span>0</span></div>
              <div class="trend-columns"><div v-for="day in orderTrend" :key="day.key" class="trend-column"><span class="trend-value">{{ number(day.total) }}</span><div class="trend-bar-track"><i :class="{ 'trend-bar--today': day.today }" :style="{ height: `${Math.max(day.total ? (day.total / trendMax) * 100 : 0, day.total ? 8 : 0)}%` }"></i></div><small>{{ day.label }}</small></div></div>
            </div>
            <div v-else-if="trendReady" class="trend-empty"><el-icon><DataLine /></el-icon><b>近 7 日暂无订单</b><span>新订单产生后，走势会在这里更新</span></div>
            <div v-else class="trend-loading"><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>
          </section>

          <section class="surface order-breakdown">
            <div class="surface-heading"><div><h2>订单处理进度</h2><p>当前订单状态分布</p></div><el-icon class="insight-heading-icon"><Histogram /></el-icon></div>
            <div class="breakdown-list"><router-link v-for="item in orderBreakdown" :key="item.key" :to="item.to" class="breakdown-item"><span class="breakdown-label"><i :class="`breakdown-dot breakdown-dot--${item.tone}`"></i>{{ item.label }}</span><span class="breakdown-track"><i :class="`breakdown-fill breakdown-fill--${item.tone}`" :style="{ width: `${item.percent}%` }"></i></span><b>{{ number(item.value) }}</b></router-link></div>
            <router-link to="/orders" class="breakdown-foot">进入订单中心 <el-icon><ArrowRight /></el-icon></router-link>
          </section>
        </div>

        <div class="business-grid">
          <section class="surface best-sellers">
            <div class="surface-heading"><div><h2>商品销售排行</h2><p>按已读取商品的销量排序 · 共读取 {{ number(productsLoaded.length) }} 件</p></div><router-link to="/products" class="all-link">商品管理 <el-icon><ArrowRight /></el-icon></router-link></div>
            <div v-if="topProducts.length" class="rank-list"><router-link v-for="(product, index) in topProducts" :key="product.id" to="/products" class="rank-row"><span class="rank-number" :class="{ 'rank-number--top': index < 3 }">{{ String(index + 1).padStart(2, '0') }}</span><el-image :src="product.pic || product.productPic || ''" :alt="`${product.name || '商品'}图片`" fit="cover" class="rank-thumb"><template #error><span class="rank-thumb-empty"><el-icon><Goods /></el-icon></span></template></el-image><span class="rank-product"><b>{{ product.name || product.productName || product.title || '未命名商品' }}</b><small>{{ product.productCategoryName || '未分类' }}</small></span><span class="rank-sales"><b>{{ number(Number(product.sale ?? product.saleCount ?? 0)) }}</b><small>销量</small></span></router-link></div>
            <div v-else class="business-empty">暂无商品销售数据</div>
          </section>

          <section class="surface marketing-overview">
            <div class="surface-heading"><div><h2>营销活动</h2><p>优惠券与秒杀活动概览</p></div><router-link to="/marketing" class="all-link">活动管理 <el-icon><ArrowRight /></el-icon></router-link></div>
            <router-link to="/marketing?tab=flash" class="marketing-summary"><span class="marketing-symbol marketing-symbol--flash"><el-icon><Promotion /></el-icon></span><span class="marketing-copy"><b>秒杀活动</b><small>{{ flashTotal ? `共 ${number(flashTotal)} 场，当前读取活动中 ${flashActiveCount} 场进行中` : '创建限时活动，带动店铺成交' }}</small></span><strong>{{ number(flashTotal) }}</strong><el-icon class="marketing-arrow"><ArrowRight /></el-icon></router-link>
            <router-link to="/marketing?tab=coupons" class="marketing-summary"><span class="marketing-symbol marketing-symbol--coupon"><el-icon><Tickets /></el-icon></span><span class="marketing-copy"><b>优惠券</b><small>{{ couponTotal ? `共 ${number(couponTotal)} 种优惠券` : '设置门槛优惠，促进转化' }}</small></span><strong>{{ number(couponTotal) }}</strong><el-icon class="marketing-arrow"><ArrowRight /></el-icon></router-link>
            <div class="marketing-callout"><span>本月经营提示</span><b>{{ metrics.waitingShipment > 0 ? '优先完成待发货订单，及时更新物流。' : '商品、库存和营销活动都可以从这里快速进入。' }}</b><router-link to="/orders?status=1">{{ metrics.waitingShipment > 0 ? '去处理待发货' : '查看订单' }} <el-icon><ArrowRight /></el-icon></router-link></div>
          </section>
        </div>

        <section class="surface recent-surface">
          <div class="surface-heading"><div><h2>最近订单</h2><p>按创建时间排列</p></div><router-link to="/orders" class="all-link">全部订单 <el-icon><ArrowRight /></el-icon></router-link></div>
          <el-table v-loading="loading" :data="latestOrders" row-key="id" class="merchant-table">
            <el-table-column prop="orderSn" label="订单编号" min-width="185" show-overflow-tooltip />
            <el-table-column prop="receiverName" label="收货人" min-width="100" />
            <el-table-column label="实付金额" min-width="112" align="right"><template #default="{ row }"><b class="order-amount">¥ {{ money(row.payAmount ?? row.totalAmount) }}</b></template></el-table-column>
            <el-table-column label="下单时间" min-width="168"><template #default="{ row }">{{ dateTime(row.createTime) }}</template></el-table-column>
            <el-table-column label="状态" width="106"><template #default="{ row }"><el-tag :type="statusType(row.status)" effect="light">{{ orderStatus(row.status) }}</el-tag></template></el-table-column>
            <el-table-column label="操作" width="78" fixed="right"><template #default="{ row }"><el-button link type="primary" @click="router.push({ path: '/orders', query: { orderSn: row.orderSn } })">查看</el-button></template></el-table-column>
            <template #empty><el-empty description="暂无订单记录" :image-size="70" /></template>
          </el-table>
        </section>
      </div>

      <aside class="dashboard-side-column">
        <section class="surface notice-panel">
          <div class="surface-heading"><div><h2>经营提醒</h2><p>需要跟进的店铺事项</p></div></div>
          <div v-if="notices.length" class="notice-list">
            <button v-for="notice in notices" :key="notice.title" class="notice-item" @click="router.push(notice.to)">
              <span class="notice-kind" :class="`notice-kind--${notice.tone}`">{{ notice.label }}</span>
              <span class="notice-copy"><b>{{ notice.title }}</b><small>{{ notice.detail }}</small></span>
              <el-icon><ArrowRight /></el-icon>
            </button>
          </div>
          <div v-else class="notice-empty"><el-icon><CircleCheck /></el-icon><b>暂时没有待处理事项</b><span>有新订单或商品提醒时会显示在这里</span></div>
        </section>

        <section class="surface stock-panel">
          <div class="surface-heading"><div><h2>库存提醒</h2><p>库存不高于 10 件的商品</p></div><router-link to="/products?stock=low" class="all-link">查看 <el-icon><ArrowRight /></el-icon></router-link></div>
          <div v-if="lowStockProducts.length" class="stock-list">
            <router-link v-for="product in lowStockProducts" :key="product.id" to="/products?stock=low" class="stock-item">
              <el-image :src="product.pic || product.productPic || ''" :alt="`${product.name || '商品'}图片`" fit="cover" class="stock-thumb"><template #error><span class="stock-thumb-empty"><el-icon><Goods /></el-icon></span></template></el-image>
              <span class="stock-product"><b>{{ product.name || product.productName || product.title || '未命名商品' }}</b><small>商品编号 {{ product.id }}</small></span>
              <span class="stock-number">{{ product.stock ?? '—' }}<small>件</small></span>
            </router-link>
          </div>
          <div v-else class="stock-empty">当前加载的商品中没有低库存记录</div>
          <div class="stock-footnote">库存提醒基于本次读取的前 500 件商品</div>
        </section>

        <section class="surface shortcuts-panel">
          <div class="surface-heading"><div><h2>常用入口</h2></div></div>
          <div class="shortcut-list">
            <router-link to="/products"><span class="shortcut-icon"><el-icon><Goods /></el-icon></span><span>商品管理</span><el-icon class="shortcut-arrow"><ArrowRight /></el-icon></router-link>
            <router-link to="/orders"><span class="shortcut-icon"><el-icon><Tickets /></el-icon></span><span>订单履约</span><el-icon class="shortcut-arrow"><ArrowRight /></el-icon></router-link>
            <router-link to="/orders?status=1"><span class="shortcut-icon"><el-icon><Van /></el-icon></span><span>处理待发货</span><el-icon class="shortcut-arrow"><ArrowRight /></el-icon></router-link>
          </div>
        </section>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, CircleCheck, DataLine, Goods, Histogram, Promotion, Refresh, Tickets, Van, Warning } from '@element-plus/icons-vue'
import { coupons, dateTime, flashCampaigns, money, orderStatus, orders, products, type FlashCampaign, type Order, type Product } from '../api'

const emit = defineEmits<{ pending: [count: number] }>()
const router = useRouter()
const shopOwner = localStorage.getItem('mall_merchant_name') || '商家'
const loading = ref(false)
const updatedAt = ref('')
const latestOrders = ref<Order[]>([])
const productsLoaded = ref<Product[]>([])
const orderTrend = ref<Array<{ key: string; label: string; total: number; today: boolean }>>([])
const trendReady = ref(false)
const flashRows = ref<FlashCampaign[]>([])
const flashTotal = ref(0)
const couponTotal = ref(0)
const metrics = ref({ products: 0, live: 0, offline: 0, orders: 0, waitingPayment: 0, waitingShipment: 0, shipped: 0, completed: 0, closed: 0 })
const allLowStockProducts = computed(() => productsLoaded.value.filter((item) => item.stock != null && Number(item.stock) <= 10))
const lowStockCount = computed(() => allLowStockProducts.value.length)
const lowStockProducts = computed(() => allLowStockProducts.value.slice(0, 5))
const topProducts = computed(() => [...productsLoaded.value].sort((a, b) => Number(b.sale ?? b.saleCount ?? 0) - Number(a.sale ?? a.saleCount ?? 0)).slice(0, 5))
const trendMax = computed(() => Math.max(1, ...orderTrend.value.map((day) => day.total)))
const weekOrderTotal = computed(() => orderTrend.value.reduce((sum, day) => sum + day.total, 0))
const flashActiveCount = computed(() => {
  const now = Date.now()
  return flashRows.value.filter((row) => Number(row.status) === 1 && (!row.startDate || new Date(row.startDate).getTime() <= now) && (!row.endDate || new Date(row.endDate).getTime() >= now)).length
})
const orderBreakdown = computed(() => {
  const total = metrics.value.orders || 0
  const rows = [
    { key: 'waitingShipment', label: '待发货', value: metrics.value.waitingShipment, tone: 'orange', to: '/orders?status=1' },
    { key: 'waitingPayment', label: '待付款', value: metrics.value.waitingPayment, tone: 'yellow', to: '/orders?status=0' },
    { key: 'shipped', label: '已发货', value: metrics.value.shipped, tone: 'blue', to: '/orders?status=2' },
    { key: 'completed', label: '已完成', value: metrics.value.completed, tone: 'green', to: '/orders?status=3' },
    { key: 'closed', label: '已关闭', value: metrics.value.closed, tone: 'gray', to: '/orders?status=4' },
  ]
  return rows.map((item) => ({ ...item, percent: total ? Math.max(item.value ? (item.value / total) * 100 : 0, item.value ? 3 : 0) : 0 }))
})
const notices = computed(() => [
  metrics.value.waitingShipment > 0 ? { label: '待发货', title: `${number(metrics.value.waitingShipment)} 笔订单等待发货`, detail: '填写物流公司和运单号', tone: 'orange', to: '/orders?status=1' } : null,
  lowStockCount.value > 0 ? { label: '库存', title: `${number(lowStockCount.value)} 件商品库存偏低`, detail: '查看已加载商品的库存情况', tone: 'yellow', to: '/products?stock=low' } : null,
  metrics.value.offline > 0 ? { label: '商品', title: `${number(metrics.value.offline)} 件商品已下架`, detail: '查看当前下架商品', tone: 'blue', to: '/products?status=0' } : null,
].filter((item): item is NonNullable<typeof item> => item !== null))
const number = (value: number) => value.toLocaleString('zh-CN')
function statusType(status?: number) { return status === 0 || status === 1 ? 'warning' : status === 2 || status === 3 ? 'success' : 'info' }
async function load() {
  loading.value = true
  trendReady.value = false
  try {
    const [productPage, livePage, offlinePage, orderPage, paymentPage, shipmentPage, shippedPage, completedPage, closedPage, flashPage, couponPage] = await Promise.all([
      products({ pageNum: 1, pageSize: 500 }), products({ pageNum: 1, pageSize: 1, publishStatus: 1 }), products({ pageNum: 1, pageSize: 1, publishStatus: 0 }),
      orders({ pageNum: 1, pageSize: 8 }), orders({ pageNum: 1, pageSize: 1, status: 0 }), orders({ pageNum: 1, pageSize: 1, status: 1 }),
      orders({ pageNum: 1, pageSize: 1, status: 2 }), orders({ pageNum: 1, pageSize: 1, status: 3 }), orders({ pageNum: 1, pageSize: 1, status: 4 }),
      flashCampaigns({ pageNum: 1, pageSize: 100 }), coupons({ pageNum: 1, pageSize: 1 }),
    ])
    productsLoaded.value = (productPage.list || []) as Product[]
    latestOrders.value = (orderPage.list || []) as Order[]
    metrics.value = {
      products: Number(productPage.total) || 0,
      live: Number(livePage.total) || 0,
      offline: Number(offlinePage.total) || 0,
      orders: Number(orderPage.total) || 0,
      waitingPayment: Number(paymentPage.total) || 0,
      waitingShipment: Number(shipmentPage.total) || 0,
      shipped: Number(shippedPage.total) || 0,
      completed: Number(completedPage.total) || 0,
      closed: Number(closedPage.total) || 0,
    }
    flashRows.value = (flashPage.list || []) as FlashCampaign[]
    flashTotal.value = Number(flashPage.total) || 0
    couponTotal.value = Number(couponPage.total) || 0
    const today = new Date()
    const trendDays = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today)
      date.setDate(today.getDate() - (6 - index))
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      return { key, label: `${date.getMonth() + 1}/${date.getDate()}`, today: index === 6 }
    })
    const dailyPages = await Promise.all(trendDays.map((day) => orders({ pageNum: 1, pageSize: 1, createTime: day.key })))
    orderTrend.value = trendDays.map((day, index) => ({ ...day, total: Number(dailyPages[index].total) || 0 }))
    trendReady.value = true
    emit('pending', metrics.value.waitingShipment)
    updatedAt.value = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } finally { loading.value = false }
}
onMounted(load)
</script>
