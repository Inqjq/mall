<template>
  <div class="navbar">
    <div class="nav-leading">
      <el-tooltip :content="appStore.collapsed ? '展开菜单' : '收起菜单'" placement="bottom">
        <button class="icon-button" :aria-label="appStore.collapsed ? '展开菜单' : '收起菜单'" @click="appStore.toggleSidebar()">
          <el-icon><Expand v-if="appStore.collapsed" /><Fold v-else /></el-icon>
        </button>
      </el-tooltip>
      <div class="workspace-tabs" role="tablist" aria-label="已打开页面">
        <div
          v-for="tab in tabs"
          :key="tab.path"
          class="workspace-tab"
          :class="{ 'workspace-tab--active': route.path === tab.path }"
          role="tab"
          tabindex="0"
          :aria-selected="route.path === tab.path"
          @click="router.push(tab.path)"
          @keydown.enter="router.push(tab.path)"
        >
          <span>{{ tab.title }}</span>
          <button v-if="tab.path !== '/dashboard'" class="tab-close" :aria-label="`关闭${tab.title}`" @click.stop="closeTab(tab.path)">
            <el-icon><Close /></el-icon>
          </button>
        </div>
      </div>
    </div>

    <el-dropdown trigger="click" @command="handleCommand">
      <button class="account" aria-label="打开账号菜单">
        <span class="greeting">{{ greeting }}，{{ userStore.username || '管理员' }}</span>
        <el-avatar :size="34" class="avatar">{{ (userStore.username || '管').slice(0, 1) }}</el-avatar>
        <el-icon class="arrow"><ArrowDown /></el-icon>
      </button>
      <template #dropdown>
        <el-dropdown-menu><el-dropdown-item command="logout">退出登录</el-dropdown-item></el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useAppStore } from '@/stores/app'
import { usePermissionStore } from '@/stores/permission'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const appStore = useAppStore()
const permissionStore = usePermissionStore()
const tabs = ref([{ path: '/dashboard', title: '工作台' }])
const greeting = computed(() => {
  const hour = new Date().getHours()
  return hour < 11 ? '早上好' : hour < 14 ? '中午好' : hour < 19 ? '下午好' : '晚上好'
})

watch(() => route.path, (path) => {
  if (path === '/login' || path === '/403' || path === '/404') return
  if (!tabs.value.some((tab) => tab.path === path)) {
    tabs.value.push({ path, title: path === '/dashboard' ? '工作台' : String(route.meta.title || '页面') })
    if (tabs.value.length > 6) tabs.value.splice(1, 1)
  }
}, { immediate: true })

function closeTab(path: string) {
  const index = tabs.value.findIndex((tab) => tab.path === path)
  if (index < 0) return
  tabs.value.splice(index, 1)
  if (route.path === path) router.push(tabs.value[Math.max(0, index - 1)]?.path || '/dashboard')
}

async function handleCommand(command: string) {
  if (command !== 'logout') return
  await ElMessageBox.confirm('确认退出当前账号？', '退出登录', { type: 'warning', confirmButtonText: '退出', cancelButtonText: '取消' })
  userStore.logout()
  permissionStore.reset()
  ElMessage.success('已退出登录')
  router.push('/login')
}
</script>

<style scoped>
.navbar { display: flex; width: 100%; min-width: 0; align-items: center; justify-content: space-between; gap: 16px; }
.nav-leading { display: flex; min-width: 0; flex: 1; align-items: center; gap: 15px; }
.icon-button { display: grid; width: 36px; height: 36px; flex: 0 0 36px; place-items: center; border: 0; border-radius: 9px; color: #4b638e; background: transparent; cursor: pointer; }
.icon-button:hover { color: var(--mall-primary); background: #dcecff; }
.workspace-tabs { display: flex; min-width: 0; align-items: center; gap: 5px; overflow-x: auto; scrollbar-width: none; }
.workspace-tabs::-webkit-scrollbar { display: none; }
.workspace-tab { display: inline-flex; min-width: 82px; height: 36px; flex: 0 0 auto; align-items: center; justify-content: center; gap: 10px; padding: 0 12px; border-radius: 20px; color: #657895; background: transparent; cursor: pointer; transition: color .16s, background .16s; }
.workspace-tab:hover { color: #244dba; background: #e5f0ff; }
.workspace-tab--active { color: #fff; background: #4e74f7; box-shadow: 0 4px 12px rgba(49,95,244,.2); }
.workspace-tab--active:hover { color: #fff; background: #3e67ee; }
.tab-close { display: grid; width: 20px; height: 20px; padding: 0; place-items: center; border: 0; border-radius: 50%; color: currentColor; background: transparent; opacity: .72; cursor: pointer; }
.tab-close:hover { background: rgba(255,255,255,.2); opacity: 1; }
.account { display: inline-flex; min-height: 42px; flex: 0 0 auto; align-items: center; gap: 10px; padding: 4px 2px 4px 10px; border: 0; border-radius: 24px; color: #43536f; background: transparent; cursor: pointer; }
.account:hover { background: #e5f0ff; }
.greeting { max-width: 230px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; }
.avatar { border: 2px solid #fff; color: #fff; background: #5b7df4; box-shadow: 0 2px 6px rgba(36,70,158,.17); }
.arrow { margin-left: -5px; color: #7587a3; font-size: 12px; }
@media (max-width: 760px) { .navbar { gap: 6px; } .nav-leading { gap: 4px; } .workspace-tab { min-width: 72px; height: 34px; padding: 0 9px; font-size: 13px; } .greeting { display: none; } .account { gap: 4px; padding-left: 0; } }
</style>
