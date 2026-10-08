<template>
  <div class="login page-container">
    <van-nav-bar title="会员登录" />
    <div class="login-intro"><span>WELCOME TO MALL</span><h1>登录你的 Mall 账户</h1><p>继续发现值得带回家的好物。</p></div>
    <van-form @submit="handleLogin">
      <van-cell-group inset style="margin-top: 24px">
        <van-field v-model="form.username" name="username" label="用户名" placeholder="用户名" :rules="[{ required: true, message: '请输入用户名' }]" />
        <van-field v-model="form.password" type="password" name="password" label="密码" placeholder="密码" :rules="[{ required: true, message: '请输入密码' }]" />
      </van-cell-group>
      <div style="margin: 24px 16px">
        <van-button round block type="danger" native-type="submit" :loading="loading">登录</van-button>
      </div>
    </van-form>
    <div class="tip">登录后可使用购物车、下单、查看订单</div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showSuccessToast } from 'vant'
import { login } from '@/api/member'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const form = reactive({ username: '', password: '' })

async function handleLogin() {
  loading.value = true
  try {
    const data = await login(form.username, form.password)
    userStore.saveToken(data.token, data.tokenHead, form.username)
    showSuccessToast('登录成功')
    router.replace((route.query.redirect as string) || '/')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login { width: min(480px, calc(100% - 64px)); margin-top: 46px; margin-bottom: 50px; padding: 15px 24px 22px; border: 1px solid #e7ebe5; background: #fff; }
.login-intro { padding: 22px 0 3px; }
.login-intro > span { color: #8c978f; font-size: 9px; letter-spacing: .18em; }
.login-intro h1 { margin: 9px 0 6px; font-size: 21px; font-weight: 600; }
.login-intro p { margin: 0; color: #808b84; font-size: 12px; }
.login :deep(.van-cell-group--inset) { margin: 18px 0 0; }
.login :deep(.van-button) { border-radius: 2px; background: var(--store-primary); }
.tip {
  text-align: center;
  color: #838e87;
  font-size: 12px;
}
@media (max-width: 760px) {
  .login { width: auto; margin: 0 0 20px; padding: 0 0 18px; border: 0; background: transparent; }
  .login :deep(.van-nav-bar) { margin: 0 -14px; }
  .login-intro { padding: 27px 8px 4px; }
  .login :deep(.van-cell-group--inset) { margin: 18px 0 0; }
  .login :deep(.van-form > div) { margin-left: 0 !important; margin-right: 0 !important; }
}
</style>
