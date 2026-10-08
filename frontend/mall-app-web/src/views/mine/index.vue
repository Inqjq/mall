<template>
  <div class="mine page-container">
    <van-nav-bar title="我的" />
    <div class="welcome"><span>MEMBER CENTER</span><h1>你好，{{ username || 'Mall 会员' }}</h1><p>欢迎回来，今天也祝你购物愉快。</p></div>
    <div class="user-card">
      <van-image round width="56" height="56" :src="icon">{{ (username || 'M')[0] }}</van-image>
      <div class="user-info">
        <div class="name">{{ username || '未登录' }}</div>
        <div class="sub">mall 商城会员</div>
      </div>
    </div>
    <van-cell-group inset style="margin-top: 12px">
      <van-cell title="我的订单" icon="orders-o" is-link @click="$router.push('/order/list')" />
      <van-cell title="购物车" icon="cart-o" is-link @click="$router.push('/cart')" />
    </van-cell-group>
    <van-cell-group inset style="margin-top: 12px">
      <van-cell title="退出登录" icon="cross" is-link @click="handleLogout" />
    </van-cell-group>
  </div>
</template>

<script setup lang="ts">
import { showConfirmDialog, showSuccessToast } from 'vant'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const username = userStore.username
const icon = ''

async function handleLogout() {
  await showConfirmDialog({ title: '提示', message: '确定退出登录吗？' })
  userStore.logout()
  showSuccessToast('已退出')
  router.replace('/login')
}
</script>

<style scoped>
.mine { width: min(900px, calc(100% - 64px)); padding-top: 12px; padding-bottom: 36px; }
.welcome { padding: 28px 6px 12px; }
.welcome > span { color: #8c978f; font-size: 9px; letter-spacing: .18em; }
.welcome h1 { margin: 9px 0 5px; font-size: 23px; font-weight: 600; }
.welcome p { margin: 0; color: #808b84; font-size: 12px; }
.user-card {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 12px 16px;
  padding: 16px;
  background: #fff;
  border: 1px solid #e7ebe5;
  border-radius: 0;
}
.name {
  font-size: 16px;
  font-weight: 600;
}
.sub {
  color: #999;
  font-size: 12px;
  margin-top: 4px;
}
@media (max-width: 760px) {
 .mine { width: auto; padding: 0 0 25px; }
 .mine :deep(.van-nav-bar) { margin: 0 -14px; }
 .welcome { padding: 21px 0 8px; }
 .welcome h1 { font-size: 22px; }
}
</style>
