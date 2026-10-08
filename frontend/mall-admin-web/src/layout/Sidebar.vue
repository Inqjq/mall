<template>
  <div class="sidebar">
    <div class="brand" :class="{ 'brand--collapsed': appStore.collapsed }">
      <span class="brand-mark"><el-icon><ShoppingBag /></el-icon></span>
      <div v-if="!appStore.collapsed" class="brand-copy"><strong>Mall</strong><span>商城运营管理</span></div>
    </div>
    <div v-if="!appStore.collapsed" class="section-label">业务导航</div>
    <el-menu
      :default-active="activeMenu"
      :collapse="appStore.collapsed"
      :collapse-transition="false"
      background-color="transparent"
      text-color="rgba(255,255,255,.83)"
      active-text-color="#fff"
      unique-opened
      router
      @select="handleSelect"
    >
      <el-menu-item index="/dashboard">
        <el-icon><House /></el-icon><template #title>工作台</template>
      </el-menu-item>
      <el-sub-menu v-for="parent in permissionStore.menuTree" :key="parent.id" :index="parent.name">
        <template #title>
          <el-icon><component :is="iconOf(parent.name)" /></el-icon><span>{{ parent.title }}</span>
        </template>
        <el-menu-item v-for="child in parent.children" :key="child.id" :index="MENU_ROUTE_MAP[child.name]">
          <el-icon><component :is="iconOf(child.name)" /></el-icon><template #title>{{ child.title }}</template>
        </el-menu-item>
      </el-sub-menu>
    </el-menu>
    <div v-if="!appStore.collapsed && quickLinks.length" class="sidebar-quick">
      <div class="quick-heading"><span>快捷入口</span><el-icon><Lightning /></el-icon></div>
      <router-link v-for="item in quickLinks" :key="item.to" :to="item.to" class="quick-link">
        <el-icon><component :is="item.icon" /></el-icon><span>{{ item.label }}</span><el-icon class="quick-arrow"><ArrowRight /></el-icon>
      </router-link>
    </div>
    <div class="sidebar-footer" :class="{ 'sidebar-footer--collapsed': appStore.collapsed }">
      <span class="footer-avatar" v-if="!appStore.collapsed">{{ userStore.username.slice(0, 1).toUpperCase() || '管' }}</span>
      <span class="footer-dot" v-else />
      <div v-if="!appStore.collapsed" class="footer-account"><b>{{ userStore.username || '管理员' }}</b><span>{{ userStore.roles[0] || '后台账号' }}</span></div>
      <span v-if="!appStore.collapsed" class="footer-status">已登录</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { usePermissionStore, MENU_ROUTE_MAP } from '@/stores/permission'
import { ArrowRight, House, Goods, ShoppingCart, Setting, User, Menu as MenuIcon, Collection, List, Tickets, ShoppingBag, Plus, Van, Lightning, Calendar, Promotion, RefreshLeft, Discount, DataAnalysis } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const appStore = useAppStore()
const permissionStore = usePermissionStore()
const userStore = useUserStore()
const activeMenu = computed(() => {
  const path = route.path
  return Object.values(MENU_ROUTE_MAP).filter((item) => path === item || path.startsWith(`${item}/`)).sort((a, b) => b.length - a.length)[0] || path
})
const ICON_MAP: Record<string, unknown> = {
  product: Goods, productCate: MenuIcon, productAttr: List, brand: Collection,
  order: Tickets, orderSetting: Setting, returnApply: RefreshLeft, returnReason: List,
  coupon: Discount, flash: Calendar, homeAdvertise: Promotion, homeBrand: Collection,
  homeNew: DataAnalysis, homeHot: DataAnalysis, homeSubject: List,
  admin: User, role: User, menu: MenuIcon, resource: Setting,
  pms: Goods, oms: ShoppingCart, sms: List, ums: Setting,
}
function iconOf(name: string) { return ICON_MAP[name] ?? List }
const quickLinks = computed(() => {
  const links: { label: string; to: string; icon: unknown }[] = []
  if (permissionStore.hasPermission('addProduct')) links.push({ label: '新增商品', to: '/product/create', icon: Plus })
  if (permissionStore.hasPermission('order')) links.push({ label: '待发货订单', to: '/order?status=1', icon: Van })
  if (permissionStore.hasPermission('productCate')) links.push({ label: '维护商品分类', to: '/product/category', icon: MenuIcon })
  return links
})
function handleSelect() {
  if (window.matchMedia('(max-width: 760px)').matches && !appStore.collapsed) appStore.toggleSidebar()
}
</script>

<style scoped>
.sidebar { display: flex; width: 100%; height: 100%; flex-direction: column; color: #fff; }
.brand { display: flex; height: 150px; flex: 0 0 150px; align-items: center; justify-content: center; flex-direction: column; gap: 10px; padding: 16px 12px 13px; border-bottom: 1px solid rgba(255,255,255,.1); background: linear-gradient(155deg, rgba(89,112,158,.2), rgba(30,45,72,.08)); white-space: nowrap; }
.brand--collapsed { height: 70px; flex-basis: 70px; }
.brand-mark { display: grid; width: 54px; height: 54px; place-items: center; border: 3px solid rgba(255,255,255,.96); border-radius: 50%; background: rgba(255,255,255,.16); box-shadow: 0 4px 16px rgba(10,36,147,.2); color: #fff; font-size: 26px; }
.brand-copy { display: grid; justify-items: center; gap: 1px; }
.brand-copy strong { color: #fff; font-size: 17px; font-weight: 650; letter-spacing: .4px; }
.brand-copy span { color: rgba(255,255,255,.78); font-size: 12px; }
.section-label { padding: 16px 18px 7px; color: rgba(255,255,255,.62); font-size: 12px; letter-spacing: .4px; }
.el-menu { flex: 1; overflow: auto; border-right: 0; padding: 0 7px; --el-menu-bg-color: transparent; --el-menu-hover-bg-color: rgba(255,255,255,.12); --el-menu-text-color: rgba(255,255,255,.83); --el-menu-active-color: #fff; }
.el-menu-item, .el-sub-menu__title { height: 46px; margin: 3px 0; border-radius: 8px; line-height: 46px; }
.el-menu-item.is-active { background: #3f67dc !important; box-shadow: inset 3px 0 0 #c7d7ff; }
.el-menu-item:hover, .el-sub-menu__title:hover { color: #fff !important; background: rgba(255,255,255,.13) !important; }
.el-menu :deep(.el-sub-menu .el-menu-item) { min-width: 0; height: 40px; margin: 2px 0; border-radius: 7px; line-height: 40px; }
.sidebar-quick { flex:0 0 auto; margin:0 12px 14px; padding:11px 9px 8px; border:1px solid rgba(255,255,255,.12); border-radius:9px; background:rgba(255,255,255,.055); }
.quick-heading { display:flex; align-items:center; justify-content:space-between; padding:0 7px 7px; color:rgba(255,255,255,.56); font-size:10px; }
.quick-heading .el-icon { color:#a6bbdf; font-size:12px; }
.quick-link { display:flex; min-height:34px; align-items:center; gap:8px; padding:0 7px; border-radius:6px; color:rgba(255,255,255,.8); font-size:11px; transition:background .15s,color .15s; }
.quick-link:hover { color:#fff; background:rgba(255,255,255,.1); }
.quick-link > .el-icon:first-child { color:#b5c8ec; font-size:13px; }
.quick-arrow { margin-left:auto; color:rgba(255,255,255,.4); font-size:11px; }
.sidebar-footer { display: flex; min-height: 64px; align-items: center; gap: 8px; margin-top: auto; padding: 10px 13px; border-top: 1px solid rgba(255,255,255,.17); color: rgba(255,255,255,.75); font-size: 12px; }
.sidebar-footer--collapsed { justify-content: center; padding: 12px; }
.footer-dot { width: 8px; height: 8px; border-radius: 50%; background: #6cf0b4; box-shadow: 0 0 0 4px rgba(108,240,180,.14); }
.footer-avatar { display:grid; width:29px; height:29px; flex:0 0 29px; place-items:center; border:1px solid rgba(255,255,255,.2); border-radius:50%; color:#edf3ff; background:rgba(255,255,255,.11); font-size:11px; }
.footer-account { display:grid; min-width:0; flex:1; gap:3px; }
.footer-account b { overflow:hidden; color:#fff; font-size:10px; font-weight:550; text-overflow:ellipsis; white-space:nowrap; }
.footer-account span { overflow:hidden; color:rgba(255,255,255,.55); font-size:9px; text-overflow:ellipsis; white-space:nowrap; }
.footer-status { padding:3px 5px; border-radius:9px; color:#8fe3b6; background:rgba(108,240,180,.1); font-size:9px; }
.sidebar :deep(.el-menu--collapse) { padding: 0 5px; }
.sidebar :deep(.el-menu--collapse .el-menu-item), .sidebar :deep(.el-menu--collapse .el-sub-menu__title) { justify-content: center; padding: 0 !important; }
.sidebar :deep(.el-menu--collapse .el-sub-menu__icon-arrow) { display: none; }
@media (max-height: 700px) { .brand { height: 124px; flex-basis: 124px; } .brand-mark { width: 46px; height: 46px; } .el-menu-item, .el-sub-menu__title { height: 42px; line-height: 42px; } }
</style>
