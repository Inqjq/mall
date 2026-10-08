<template>
  <div class="dashboard">
    <PageHeader title="商城经营工作台" :description="updatedAt ? `数据更新于 ${updatedAt}` : '订单、商品与履约数据一览'">
      <el-button :loading="loading" :icon="Refresh" @click="loadDashboard">刷新数据</el-button>
    </PageHeader>

    <div class="metrics-grid">
      <button v-for="item in metrics" :key="item.label" class="metric-card" :class="[`metric-card--${item.tone}`, { 'metric-card--clickable': Boolean(item.path) }]" :disabled="!item.path" @click="item.path && router.push(item.path)">
        <span class="metric-icon"><el-icon><component :is="item.icon" /></el-icon></span>
        <span class="metric-content">
          <span class="metric-label">{{ item.label }}</span>
          <strong class="metric-value">{{ item.value == null ? '—' : item.value.toLocaleString() }}</strong>
          <span class="metric-note">{{ item.note }}</span>
        </span>
        <el-icon v-if="item.path" class="metric-arrow"><ArrowRight /></el-icon>
      </button>
    </div>

    <div class="dashboard-grid">
      <div class="primary-column">
        <section class="panel trend-panel">
          <div class="panel-heading">
            <div><span class="eyebrow">订单分析</span><h2>订单走势</h2><p>按最近 200 笔订单的下单时间统计</p></div>
            <el-radio-group v-model="trendDays" size="small" aria-label="订单趋势时间范围" @change="renderTrend">
              <el-radio-button :value="7">近 7 天</el-radio-button>
              <el-radio-button :value="30">近 30 天</el-radio-button>
            </el-radio-group>
          </div>
          <div ref="trendRef" class="trend-chart" role="img" :aria-label="`近 ${trendDays} 天订单趋势图`" />
          <div class="chart-caption"><span><i class="legend-line" />当前区间订单</span><strong>{{ trendTotal.toLocaleString() }} <small>单</small></strong></div>
        </section>

        <section class="panel orders-panel">
          <div class="panel-heading orders-heading">
            <div><span class="eyebrow">近期动态</span><h2>最近订单</h2><p>最近创建的订单记录</p></div>
            <el-button link type="primary" @click="router.push('/order')">全部订单<el-icon class="el-icon--right"><ArrowRight /></el-icon></el-button>
          </div>
          <el-table v-loading="loading" :data="latestOrders" row-key="id" class="recent-table">
            <el-table-column prop="orderSn" label="订单编号" min-width="190" show-overflow-tooltip />
            <el-table-column prop="receiverName" label="收货人" width="105" />
            <el-table-column label="订单金额" width="125" align="right">
              <template #default="{ row }">{{ row.totalAmount == null ? '—' : `¥ ${Number(row.totalAmount).toFixed(2)}` }}</template>
            </el-table-column>
            <el-table-column label="状态" width="115">
              <template #default="{ row }"><el-tag :type="statusType(row.status)" effect="light">{{ ORDER_STATUS_MAP[row.status ?? -1] || '未知' }}</el-tag></template>
            </el-table-column>
            <el-table-column label="下单时间" min-width="180">
              <template #default="{ row }">{{ formatDateTime(row.createTime) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="72" fixed="right">
              <template #default="{ row }"><el-button link type="primary" @click="router.push(`/order/detail/${row.id}`)">查看</el-button></template>
            </el-table-column>
            <template #empty><el-empty description="暂无订单" :image-size="72" /></template>
          </el-table>
        </section>
      </div>

      <aside class="secondary-column">
        <section class="panel status-panel">
          <div class="panel-heading">
            <div><span class="eyebrow">履约情况</span><h2>订单状态</h2><p>当前订单结构</p></div>
            <el-button link type="primary" @click="router.push('/order')">查看</el-button>
          </div>
          <div ref="statusRef" class="status-chart" role="img" aria-label="订单状态分布图" />
          <div class="status-list">
            <button v-for="item in statusCounts" :key="item.status" class="status-row" @click="router.push(`/order?status=${item.status}`)">
              <span class="status-mark" :style="{ background: item.color }" />
              <span>{{ item.label }}</span>
              <strong>{{ item.value == null ? '—' : item.value.toLocaleString() }}</strong>
              <el-icon><ArrowRight /></el-icon>
            </button>
          </div>
        </section>

        <section class="panel actions-panel">
          <div class="panel-heading">
            <div><span class="eyebrow">快捷入口</span><h2>常用操作</h2></div>
          </div>
          <div class="quick-actions">
            <button v-if="permissionStore.canAccess('/product')" class="quick-action" @click="router.push('/product')">
              <span class="quick-icon quick-icon--blue"><el-icon><Box /></el-icon></span><span><b>商品管理</b><small>维护商品与库存</small></span><el-icon class="quick-arrow"><ArrowRight /></el-icon>
            </button>
            <button v-if="permissionStore.canAccess('/order')" class="quick-action" @click="router.push('/order?status=1')">
              <span class="quick-icon quick-icon--violet"><el-icon><Van /></el-icon></span><span><b>待发货订单</b><small>查看需要履约的订单</small></span><el-icon class="quick-arrow"><ArrowRight /></el-icon>
            </button>
            <button v-if="permissionStore.canAccess('/product/category')" class="quick-action" @click="router.push('/product/category')">
              <span class="quick-icon quick-icon--cyan"><el-icon><CollectionTag /></el-icon></span><span><b>商品分类</b><small>管理商城商品目录</small></span><el-icon class="quick-arrow"><ArrowRight /></el-icon>
            </button>
          </div>
        </section>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { ArrowRight, Box, List, Van, CircleCheck, Refresh, CollectionTag } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import { getProductList } from '@/api/product'
import { getOrderList } from '@/api/order'
import { ORDER_STATUS_MAP, type OmsOrder } from '@/types/api'
import { usePermissionStore } from '@/stores/permission'
import { formatDateTime } from '@/utils/format'

const router = useRouter()
const permissionStore = usePermissionStore()
const loading = ref(false)
const trendDays = ref<7 | 30>(7)
const updatedAt = ref('')
const trendRef = ref<HTMLElement>()
const statusRef = ref<HTMLElement>()
const latestOrders = ref<OmsOrder[]>([])
const rawOrders = ref<OmsOrder[]>([])
let trendChart: echarts.ECharts | undefined
let statusChart: echarts.ECharts | undefined

const statusCounts = ref([
  { status: 0, label: '待付款', value: null as number | null, color: '#f2a542' },
  { status: 1, label: '待发货', value: null as number | null, color: '#4e74f7' },
  { status: 2, label: '已发货', value: null as number | null, color: '#9670e8' },
  { status: 3, label: '已完成', value: null as number | null, color: '#37b995' },
  { status: 4, label: '已关闭', value: null as number | null, color: '#aab7ca' },
])
const metrics = ref([
  { label: '商品总数', value: null as number | null, note: '全部商品', icon: Box, tone: 'blue', path: permissionStore.canAccess('/product') ? '/product' : '' },
  { label: '订单总数', value: null as number | null, note: '全部订单', icon: List, tone: 'slate', path: permissionStore.canAccess('/order') ? '/order' : '' },
  { label: '待发货订单', value: null as number | null, note: '需要处理', icon: Van, tone: 'orange', path: permissionStore.canAccess('/order') ? '/order?status=1' : '' },
  { label: '已完成订单', value: null as number | null, note: '已完成交易', icon: CircleCheck, tone: 'green', path: permissionStore.canAccess('/order') ? '/order?status=3' : '' },
])
const trendTotal = computed(() => recentDays().reduce((total, item) => total + item.count, 0))

function amountTotal(result: PromiseSettledResult<{ total: number }>) {
  return result.status === 'fulfilled' ? Number(result.value.total) || 0 : null
}
function statusType(status?: number) {
  if (status === 0 || status === 1) return 'warning'
  if (status === 2 || status === 3) return 'success'
  return 'info'
}
function dateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
function recentDays() {
  return Array.from({ length: trendDays.value }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (trendDays.value - 1 - index))
    const key = dateKey(date)
    return { key, label: key.slice(5), count: rawOrders.value.filter((order) => (order.createTime || '').slice(0, 10) === key).length }
  })
}
function renderTrend() {
  if (!trendRef.value) return
  const data = recentDays()
  trendChart ||= echarts.init(trendRef.value)
  trendChart.setOption({
    animationDuration: 280,
    grid: { left: 42, right: 18, top: 20, bottom: 28 },
    tooltip: { trigger: 'axis', backgroundColor: '#263445', borderWidth: 0, textStyle: { color: '#fff' }, formatter: (items: any) => `${items[0].axisValue}<br/>订单数：${items[0].value}` },
    xAxis: { type: 'category', boundaryGap: false, data: data.map((item) => item.label), axisLine: { lineStyle: { color: '#dfeafa' } }, axisTick: { show: false }, axisLabel: { color: '#8596b0', fontSize: 11, interval: trendDays.value === 30 ? 3 : 0 } },
    yAxis: { type: 'value', minInterval: 1, splitLine: { lineStyle: { color: '#edf3fb', type: 'dashed' } }, axisLabel: { color: '#8596b0', fontSize: 11 } },
    series: [{ type: 'line', name: '订单数', data: data.map((item) => item.count), smooth: .22, symbol: 'circle', symbolSize: 6, lineStyle: { color: '#4e74f7', width: 3 }, itemStyle: { color: '#4e74f7', borderColor: '#fff', borderWidth: 2 }, areaStyle: { color: 'rgba(79,116,247,.12)' } }],
  }, true)
}
function renderStatus() {
  if (!statusRef.value) return
  statusChart ||= echarts.init(statusRef.value)
  statusChart.setOption({
    animationDuration: 250,
    tooltip: { trigger: 'item', formatter: '{b}：{c} 单（{d}%）' },
    color: statusCounts.value.map((item) => item.color),
    series: [{ type: 'pie', radius: ['64%', '82%'], center: ['50%', '50%'], avoidLabelOverlap: true, label: { show: false }, labelLine: { show: false }, itemStyle: { borderColor: '#fff', borderWidth: 3 }, data: statusCounts.value.map((item) => ({ name: item.label, value: item.value ?? 0 })) }],
    graphic: [{ type: 'text', left: 'center', top: '39%', style: { text: metrics.value[1].value == null ? '—' : String(metrics.value[1].value), fill: '#2d3744', fontSize: 24, fontWeight: 600 } }, { type: 'text', left: 'center', top: '56%', style: { text: '订单总数', fill: '#89929e', fontSize: 12 } }],
  }, true)
}
async function loadDashboard() {
  if (loading.value) return
  loading.value = true
  const statusRequests = statusCounts.value.map((item) => getOrderList({ pageNum: 1, pageSize: 1, status: item.status }))
  try {
    const [products, orders, recent, ...statuses] = await Promise.allSettled([
      getProductList({ pageNum: 1, pageSize: 1 }),
      getOrderList({ pageNum: 1, pageSize: 1 }),
      getOrderList({ pageNum: 1, pageSize: 200 }),
      ...statusRequests,
    ])
    metrics.value[0].value = amountTotal(products as PromiseSettledResult<{ total: number }>)
    metrics.value[1].value = amountTotal(orders as PromiseSettledResult<{ total: number }>)
    metrics.value[2].value = amountTotal(statuses[1] as PromiseSettledResult<{ total: number }>)
    metrics.value[3].value = amountTotal(statuses[3] as PromiseSettledResult<{ total: number }>)
    rawOrders.value = recent.status === 'fulfilled' ? (recent.value.list as OmsOrder[] || []) : []
    latestOrders.value = rawOrders.value.slice(0, 8)
    statuses.forEach((result, index) => { statusCounts.value[index].value = amountTotal(result as PromiseSettledResult<{ total: number }>) })
    updatedAt.value = new Date().toLocaleString('zh-CN', { hour12: false })
    await nextTick()
    renderTrend()
    renderStatus()
  } finally { loading.value = false }
}
function handleResize() { trendChart?.resize(); statusChart?.resize() }
watch(trendDays, renderTrend)
onMounted(() => { window.addEventListener('resize', handleResize); loadDashboard() })
onBeforeUnmount(() => { window.removeEventListener('resize', handleResize); trendChart?.dispose(); statusChart?.dispose() })
</script>

<style scoped>
.dashboard { display: grid; gap: 17px; }
.dashboard :deep(.page-heading) { margin-bottom: 0; }
.metrics-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 13px; }
.metric-card { position: relative; display: flex; min-height: 116px; align-items: center; gap: 13px; padding: 17px; border: 1px solid #e2edfb; border-radius: 11px; background: #fff; text-align: left; cursor: default; box-shadow: 0 4px 15px rgba(51,91,158,.035); transition: border-color .18s, box-shadow .18s, transform .18s; }
.metric-card--clickable { cursor: pointer; }
.metric-card--clickable:hover { transform: translateY(-2px); border-color: #c7d9fa; box-shadow: 0 9px 22px rgba(53,93,172,.11); }
.metric-card:disabled { color: inherit; }
.metric-icon { display: grid; width: 43px; height: 43px; flex: 0 0 43px; place-items: center; border-radius: 12px; font-size: 19px; }
.metric-card--blue .metric-icon { color: #315ff4; background: #e9f0ff; }
.metric-card--slate .metric-icon { color: #536c9f; background: #edf3ff; }
.metric-card--orange .metric-icon { color: #ca782f; background: #fff2e5; }
.metric-card--green .metric-icon { color: #268e6c; background: #e5f7f0; }
.metric-content { display: grid; gap: 3px; }
.metric-label { color: #71819b; font-size: 13px; }
.metric-value { color: #23395f; font-size: 27px; font-weight: 650; line-height: 1.1; font-variant-numeric: tabular-nums; }
.metric-note { color: #94a1b5; font-size: 12px; }
.metric-arrow { position: absolute; top: 16px; right: 15px; color: #a9bad6; font-size: 14px; }
.dashboard-grid { display: grid; grid-template-columns: minmax(0, 1.75fr) minmax(300px, .85fr); align-items: start; gap: 16px; }
.primary-column, .secondary-column { display: grid; min-width: 0; gap: 16px; }
.panel { min-width: 0; overflow: hidden; border: 1px solid #e2edfb; border-radius: 11px; background: #fff; box-shadow: 0 4px 15px rgba(51,91,158,.035); }
.panel-heading { display: flex; min-height: 76px; align-items: center; justify-content: space-between; gap: 14px; padding: 14px 18px; border-bottom: 1px solid #edf3fb; }
.panel-heading h2 { margin: 1px 0 0; color: #253653; font-size: 16px; font-weight: 650; }
.panel-heading p { margin: 3px 0 0; color: #8999b1; font-size: 12px; }
.eyebrow { color: #7892bd; font-size: 11px; letter-spacing: .55px; }
.trend-panel { display: grid; grid-template-rows: auto 1fr auto; }
.trend-chart { height: 288px; padding: 8px 14px 0; }
.chart-caption { display: flex; align-items: center; justify-content: space-between; margin: 0 18px; padding: 12px 0 15px; border-top: 1px solid #edf3fb; color: #72829b; font-size: 12px; }
.chart-caption span { display: inline-flex; align-items: center; gap: 8px; }
.chart-caption strong { color: #2a426c; font-size: 17px; }
.chart-caption small { color: #8291a8; font-size: 12px; font-weight: 400; }
.legend-line { width: 17px; height: 3px; border-radius: 3px; background: #4e74f7; }
.status-chart { height: 210px; }
.status-list { display: grid; padding: 0 16px 13px; }
.status-row { display: flex; min-height: 39px; align-items: center; gap: 9px; padding: 5px 2px; border: 0; border-top: 1px solid #eff3f9; color: #63728a; background: #fff; text-align: left; font-size: 12px; cursor: pointer; }
.status-row:hover { color: #315ff4; background: #f7faff; }
.status-mark { width: 8px; height: 8px; flex: 0 0 8px; border-radius: 50%; box-shadow: 0 0 0 3px rgba(49,95,244,.07); }
.status-row strong { margin-left: auto; color: #304466; font-size: 13px; font-weight: 650; font-variant-numeric: tabular-nums; }
.status-row > .el-icon { color: #9aabc4; font-size: 13px; }
.orders-panel { padding: 0 17px 14px; }
.orders-heading { margin: 0 -17px 4px; border-bottom: 0; }
.recent-table { width: 100%; }
.actions-panel .panel-heading { min-height: 72px; }
.quick-actions { padding: 2px 16px 11px; }
.quick-action { display: flex; width: 100%; min-height: 67px; align-items: center; gap: 11px; padding: 9px 2px; border: 0; border-top: 1px solid #eff3f9; color: #364766; background: #fff; text-align: left; cursor: pointer; }
.quick-action:hover b, .quick-action:hover .quick-arrow { color: #315ff4; }
.quick-icon { display: grid; width: 39px; height: 39px; flex: 0 0 39px; place-items: center; border-radius: 11px; font-size: 17px; }
.quick-icon--blue { color: #315ff4; background: #eaf0ff; }
.quick-icon--violet { color: #8c60dd; background: #f2eefe; }
.quick-icon--cyan { color: #318dad; background: #e6f6fb; }
.quick-action > span:nth-child(2) { display: grid; gap: 2px; }
.quick-action b { color: #354767; font-size: 13px; font-weight: 600; }
.quick-action small { color: #8c9bb2; font-size: 11px; }
.quick-arrow { margin-left: auto; color: #a9b7cb; }
@media (max-width: 1120px) { .dashboard-grid { grid-template-columns: minmax(0, 1.4fr) minmax(265px, .9fr); } .metrics-grid { gap: 10px; } .metric-card { padding: 14px; } }
@media (max-width: 850px) { .dashboard-grid { grid-template-columns: 1fr; } .secondary-column { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); } .secondary-column > .panel { align-self: start; } }
@media (max-width: 620px) { .metrics-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .metric-card { min-height: 100px; padding: 12px; gap: 9px; } .metric-icon { width: 35px; height: 35px; flex-basis: 35px; font-size: 16px; } .metric-value { font-size: 22px; } .secondary-column { grid-template-columns: 1fr; } .trend-chart { height: 230px; } .panel-heading { padding: 13px 14px; } .orders-panel { padding: 0 10px 10px; } .orders-heading { margin: 0 -10px 4px; } }
</style>
