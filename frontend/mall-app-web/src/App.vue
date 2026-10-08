<template>
  <div class="storefront">
    <div class="announcement"><span>欢迎来到 Mall 商城</span><router-link to="/order/list">我的订单</router-link><router-link to="/mine">会员中心</router-link></div>
    <header class="store-header">
      <div class="header-main">
        <router-link class="brand" to="/" aria-label="Mall 商城首页">
          <span class="brand-mark">M</span>
          <span class="brand-copy"><strong>Mall</strong><small>网上商城</small></span>
        </router-link>
        <form class="header-search" role="search" @submit.prevent="submitSearch">
          <van-icon name="search" />
          <input v-model="searchText" aria-label="搜索商品" placeholder="搜索商品、品牌" />
          <button type="submit">搜索</button>
        </form>
        <div class="header-actions">
          <router-link to="/mine" class="header-action"><van-icon name="user-o" /><span>{{ userStore.isLogin ? userStore.username : '登录 / 注册' }}</span></router-link>
          <router-link to="/cart" class="header-action"><van-icon name="cart-o" /><span>购物车</span></router-link>
        </div>
      </div>
      <nav class="main-nav" aria-label="主导航">
        <router-link to="/" exact-active-class="active">首页</router-link>
        <router-link to="/category" active-class="active">全部分类</router-link>
        <router-link to="/search?sort=1">上新好物</router-link>
        <router-link to="/search?sort=2">人气推荐</router-link>
        <router-link to="/order/list">我的订单</router-link>
      </nav>
    </header>

    <main id="main-content" class="page-content">
      <router-view v-slot="{ Component }"><component :is="Component" /></router-view>
    </main>

    <footer class="site-footer">
      <div class="footer-inner">
        <router-link to="/" class="footer-brand"><span class="brand-mark">M</span><span><strong>Mall</strong><small>网上商城</small></span></router-link>
        <div class="footer-promises"><span>商品分类</span><span>购物车</span><span>我的订单</span></div>
        <span class="footer-copy">© Mall 商城</span>
      </div>
    </footer>

    <van-tabbar v-if="$route.meta.tabbar" route fixed placeholder class="mobile-tabbar">
      <van-tabbar-item replace to="/" icon="home-o">首页</van-tabbar-item>
      <van-tabbar-item replace to="/category" icon="apps-o">分类</van-tabbar-item>
      <van-tabbar-item replace to="/cart" icon="cart-o">购物车</van-tabbar-item>
      <van-tabbar-item replace to="/mine" icon="user-o">我的</van-tabbar-item>
    </van-tabbar>
    <FloatingAssistant role="customer" :get-token="() => userStore.tokenHead + userStore.token" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import FloatingAssistant from '@/components/FloatingAssistant.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const searchText = ref((route.query.keyword as string) || '')

watch(() => route.query.keyword, (value) => { searchText.value = (value as string) || '' })

function submitSearch() {
  router.push({ path: '/search', query: { keyword: searchText.value.trim() || undefined } })
}
</script>

<style>
:root {
  --store-ink: #333333;
  --store-muted: #888888;
  --store-primary: #e1251b;
  --store-primary-dark: #c81d16;
  --store-accent: #f56a14;
  --store-paper: #f5f5f5;
  --store-card: #fff;
  --store-line: #e9ece7;
  --van-primary-color: #e1251b;
  --van-danger-color: #e1251b;
  --van-text-color: #333333;
  --van-background: #f5f5f5;
}

* { box-sizing: border-box; }
html { background: var(--store-paper); scroll-behavior: smooth; }
body { margin: 0; min-width: 320px; color: var(--store-ink); background: var(--store-paper); font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif; -webkit-font-smoothing: antialiased; }
button, input { font: inherit; }
a { color: inherit; text-decoration: none; }
button, a, [role="button"] { -webkit-tap-highlight-color: transparent; }
button:focus-visible, a:focus-visible, input:focus-visible { outline: 3px solid rgba(40,92,75,.35); outline-offset: 3px; }

.announcement { min-height: 31px; display: flex; align-items: center; justify-content: flex-end; gap: 20px; padding: 5px max(32px, calc((100% - 1280px) / 2)); background: #f1f1f1; color: #666; font-size: 11px; }
.announcement span:nth-child(2) { color: #e1251b; }
.announcement a:hover { color: #e1251b; }
.store-header { position: sticky; top: 0; z-index: 20; background: rgba(255,255,255,.96); border-bottom: 1px solid var(--store-line); backdrop-filter: blur(14px); }
.header-main, .main-nav, .footer-inner { width: min(1280px, calc(100% - 64px)); margin: 0 auto; }
.header-main { min-height: 78px; display: flex; align-items: center; gap: 52px; }
.brand, .footer-brand { display: flex; align-items: center; gap: 11px; flex: 0 0 auto; }
.brand-mark { width: 42px; height: 42px; display: inline-grid; place-items: center; border-radius: 4px; background: var(--store-primary); color: #fff; font: 700 22px/1 Georgia, serif; }
.brand-copy, .footer-brand > span:last-child { display: flex; flex-direction: column; gap: 2px; }
.brand-copy strong, .footer-brand strong { font: 700 24px/1 Georgia, serif; letter-spacing: -.04em; }
.brand-copy small, .footer-brand small { color: var(--store-muted); font-size: 11px; letter-spacing: .12em; }
.header-search { width: min(590px, 50vw); height: 42px; display: flex; align-items: center; gap: 10px; padding: 3px 4px 3px 14px; background: #fff; border: 2px solid var(--store-primary); border-radius: 3px; color: #888; }
.header-search .van-icon { font-size: 19px; }
.header-search input { width: 100%; border: 0; outline: 0; background: transparent; color: var(--store-ink); font-size: 14px; }
.header-search input::placeholder { color: #929b96; }
.header-search button { height: 34px; min-width: 76px; padding: 0 17px; border: 0; border-radius: 1px; color: #fff; background: var(--store-primary); cursor: pointer; transition: background .2s; }
.header-search button:hover { background: var(--store-primary-dark); }
.header-actions { display: flex; align-items: center; gap: 26px; margin-left: auto; white-space: nowrap; }
.header-action { display: inline-flex; align-items: center; gap: 8px; color: #4b5751; font-size: 13px; transition: color .2s; }
.header-action:hover { color: var(--store-accent); }
.header-action .van-icon { font-size: 20px; }
.main-nav { min-height: 42px; display: flex; align-items: center; gap: 34px; border-top: 1px solid #f2f2f2; }
.main-nav a { height: 42px; display: inline-flex; align-items: center; color: #444; font-size: 14px; position: relative; transition: color .2s; }
.main-nav a:hover, .main-nav a.active { color: var(--store-primary); }
.main-nav a.active::after { content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 3px; background: var(--store-primary); }
.nav-note { margin-left: auto; color: #89928d; font-size: 12px; letter-spacing: .12em; }
.page-content { min-height: calc(100vh - 240px); }
.site-footer { margin-top: 48px; background: #f0f0f0; color: #777; }
.footer-inner { min-height: 126px; display: flex; align-items: center; }
.footer-brand .brand-mark { color: #fff; background: var(--store-primary); }
.footer-brand small { color: #999; }
.footer-promises { display: flex; gap: 35px; margin: 0 auto; color: #666; font-size: 13px; }
.footer-copy { color: #999; font-size: 12px; }
.mobile-tabbar { display: none; }
.page-container { width: min(1280px, calc(100% - 64px)); margin: 0 auto; }
.section-heading { display: flex; align-items: end; justify-content: space-between; margin-bottom: 20px; }
.section-heading h2 { margin: 0; color: var(--store-ink); font-size: 25px; font-weight: 650; letter-spacing: -.04em; }
.section-heading p { margin: 7px 0 0; color: var(--store-muted); font-size: 13px; }
.section-heading a { color: var(--store-primary); font-size: 13px; }

@media (max-width: 760px) {
  .announcement, .store-header, .site-footer { display: none; }
  .page-content { min-height: calc(100vh - 50px); padding-bottom: env(safe-area-inset-bottom); }
  .mobile-tabbar { display: flex; }
  .page-container { width: 100%; }
}
@media (min-width: 761px) {
  .mobile-tabbar { display: none !important; }
  .page-content > * { min-height: 480px; }
}
@media (max-width: 980px) and (min-width: 761px) {
  .header-main, .main-nav, .footer-inner { width: calc(100% - 40px); }
  .header-main { gap: 24px; }
  .header-actions { gap: 15px; }
  .header-action span { display: none; }
  .main-nav { gap: 24px; }
  .page-container { width: calc(100% - 40px); }
}
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { scroll-behavior: auto !important; transition-duration: .01ms !important; animation-duration: .01ms !important; } }
</style>
