<template>
  <div class="layout">
    <div v-if="!appStore.collapsed" class="mobile-backdrop" @click="appStore.toggleSidebar()" />
    <aside class="sidebar-wrap" :class="{ 'sidebar-wrap--collapsed': appStore.collapsed }" :style="{ width: appStore.collapsed ? '66px' : '202px' }">
      <Sidebar />
    </aside>
    <section class="workspace">
      <header class="topbar"><Navbar /></header>
      <main class="main-area">
        <router-view v-slot="{ Component }">
          <transition name="fade-slide" mode="out-in"><component :is="Component" /></transition>
        </router-view>
      </main>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import Sidebar from './Sidebar.vue'
import Navbar from './Navbar.vue'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
onMounted(() => {
  if (window.matchMedia('(max-width: 760px)').matches && !appStore.collapsed) appStore.toggleSidebar()
})
</script>

<style scoped>
.layout { display: flex; width: 100%; height: 100%; min-height: 0; overflow: hidden; background: var(--mall-background); }
.sidebar-wrap { position: relative; z-index: 30; flex: 0 0 auto; height: 100%; overflow: hidden; background: linear-gradient(180deg, #253451 0%, #1d2b45 100%); transition: width .2s ease; }
.workspace { display: flex; min-width: 0; min-height: 0; flex: 1; flex-direction: column; }
.topbar { display: flex; height: 64px; flex: 0 0 64px; align-items: center; padding: 0 20px; border-bottom: 1px solid #e2effb; background: #edf7ff; }
.main-area { min-width: 0; min-height: 0; flex: 1; overflow: auto; padding: 20px 20px 26px; background: #eff8ff; }
.mobile-backdrop { display: none; }
@media (max-width: 760px) {
  .layout { width: 100%; height: 100%; min-height: 0; }
  .sidebar-wrap { position: absolute; left: 0; top: 0; height: 100%; }
  .sidebar-wrap--collapsed { display: none; }
  .mobile-backdrop { position: absolute; z-index: 25; display: block; inset: 0; background: rgba(17, 25, 37, .38); }
  .topbar { height: 58px; flex-basis: 58px; padding: 0 12px; }
  .main-area { padding: 15px 12px 20px; }
}
</style>
