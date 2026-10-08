<template>
  <div class="merchant-shell">
    <header class="global-header">
      <router-link to="/overview" class="header-brand"><span class="header-brand-mark"><el-icon><Shop /></el-icon></span><b>商城商家版</b></router-link>
      <div class="header-account"><span class="account-label">当前账号</span><b>{{ username }}</b></div>
      <div class="header-spacer"></div>
      <form class="global-search" role="search" @submit.prevent="searchOrders">
        <el-icon><Search /></el-icon><input v-model="searchText" aria-label="搜索订单" placeholder="搜索订单号或收货人" />
        <button type="submit">搜索</button>
      </form>
      <el-popover placement="bottom-end" :width="250" trigger="click">
        <template #reference><el-button class="help-button" text aria-label="使用帮助"><el-icon><QuestionFilled /></el-icon></el-button></template>
        <div class="help-popover"><b>使用帮助</b><p>商品和订单操作受当前账号权限控制。如需开通权限，请联系商城管理员。</p></div>
      </el-popover>
      <el-dropdown @command="handleCommand">
        <button class="user-chip" aria-label="账号菜单"><span class="user-avatar">{{ initials }}</span><span class="user-name">{{ username }}</span><el-icon><ArrowDown /></el-icon></button>
        <template #dropdown><el-dropdown-menu><el-dropdown-item command="logout">退出登录</el-dropdown-item></el-dropdown-menu></template>
      </el-dropdown>
    </header>

    <aside class="sidebar">
      <div class="nav-caption">工作台</div>
      <div class="sidebar-store"><span class="store-mark"><el-icon><Shop /></el-icon></span><div><b>{{ username }}</b><small>商家账号</small></div><el-icon class="store-arrow"><ArrowDown /></el-icon></div>
      <nav class="nav-menu" aria-label="商家导航">
        <router-link to="/overview" class="nav-link"><el-icon><House /></el-icon><span>经营概况</span></router-link>
        <div class="nav-section-label">商品中心</div>
        <router-link to="/products" class="nav-link" :class="{ 'nav-link--selected': isProductView('all') }"><el-icon><Goods /></el-icon><span>全部商品</span><i class="nav-total">{{ productTotal || '—' }}</i></router-link>
        <router-link to="/products?status=1" class="nav-link" :class="{ 'nav-link--selected': isProductView('live') }"><el-icon><CircleCheck /></el-icon><span>出售中的商品</span></router-link>
        <router-link to="/products?status=0" class="nav-link" :class="{ 'nav-link--selected': isProductView('offline') }"><el-icon><Box /></el-icon><span>已下架商品</span></router-link>
        <router-link to="/products?stock=low" class="nav-link" :class="{ 'nav-link--selected': isProductView('stock') }"><el-icon><Warning /></el-icon><span>库存预警</span></router-link>
        <router-link to="/products/create" class="nav-link"><el-icon><CirclePlus /></el-icon><span>发布新商品</span></router-link>
        <div class="nav-section-label nav-section-label--separated">订单中心</div>
        <router-link to="/orders" class="nav-link" :class="{ 'nav-link--selected': isOrderView('all') }"><el-icon><Tickets /></el-icon><span>全部订单</span></router-link>
        <router-link to="/orders?status=0" class="nav-link" :class="{ 'nav-link--selected': isOrderView('0') }"><el-icon><Clock /></el-icon><span>等待付款</span></router-link>
        <router-link to="/orders?status=1" class="nav-link" :class="{ 'nav-link--selected': isOrderView('1') }"><el-icon><Van /></el-icon><span>等待发货</span><i v-if="pendingCount" class="nav-count">{{ pendingCount > 99 ? '99+' : pendingCount }}</i></router-link>
        <router-link to="/orders?status=2" class="nav-link" :class="{ 'nav-link--selected': isOrderView('2') }"><el-icon><Promotion /></el-icon><span>运输中</span></router-link>
        <router-link to="/orders?status=3" class="nav-link" :class="{ 'nav-link--selected': isOrderView('3') }"><el-icon><CircleCheck /></el-icon><span>已完成</span></router-link>
        <router-link to="/orders?status=4" class="nav-link" :class="{ 'nav-link--selected': isOrderView('4') }"><el-icon><CircleClose /></el-icon><span>已关闭</span></router-link>
        <div class="nav-section-label nav-section-label--separated">营销中心</div>
        <router-link to="/marketing?tab=flash" class="nav-link" :class="{ 'nav-link--selected': route.path === '/marketing' && route.query.tab !== 'coupons' }"><el-icon><Promotion /></el-icon><span>秒杀活动</span></router-link>
        <router-link to="/marketing?tab=coupons" class="nav-link" :class="{ 'nav-link--selected': route.path === '/marketing' && route.query.tab === 'coupons' }"><el-icon><Tickets /></el-icon><span>优惠券管理</span></router-link>
      </nav>
      <div class="sidebar-bottom"><span class="sidebar-bottom-mark"><el-icon><Shop /></el-icon></span><div><b>商家工作台</b><small>商品维护 · 订单履约</small></div></div>
    </aside>

    <div class="workspace">
      <main class="main-content"><router-view @pending="pendingCount = $event" /></main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { ArrowDown, Box, CircleCheck, CircleClose, CirclePlus, Clock, Goods, House, Promotion, QuestionFilled, Search, Shop, Tickets, Van, Warning } from '@element-plus/icons-vue'
import { products } from './api'

const router = useRouter()
const route = useRoute()
const pendingCount = ref(0)
const searchText = ref('')
const username = computed(() => localStorage.getItem('mall_merchant_name') || '商家用户')
const productTotal = ref<number | null>(null)
const initials = computed(() => username.value.slice(0, 1).toUpperCase())
function isProductView(view: string) {
  if (route.path !== '/products') return false
  if (view === 'stock') return route.query.stock === 'low'
  const status = route.query.status
  return view === 'all' ? status !== '0' && status !== '1' && !route.query.stock : view === 'live' ? status === '1' : status === '0'
}
function isOrderView(status: string) { return route.path === '/orders' && (status === 'all' ? !route.query.status : route.query.status === status) }
products({ pageNum: 1, pageSize: 1 }).then((result) => { productTotal.value = Number(result.total) || 0 }).catch(() => { productTotal.value = null })
function searchOrders() {
  const query = searchText.value.trim()
  if (query) router.push({ path: '/orders', query: { receiverKeyword: query } })
}
async function handleCommand(command: string) {
  if (command !== 'logout') return
  try {
    await ElMessageBox.confirm('确定退出当前商家账号吗？', '退出登录', { confirmButtonText: '退出', cancelButtonText: '取消', type: 'warning' })
    localStorage.removeItem('mall_merchant_token')
    localStorage.removeItem('mall_merchant_token_head')
    localStorage.removeItem('mall_merchant_name')
    await router.replace('/login')
  } catch { /* 用户取消 */ }
}
</script>
