<template>
  <main class="login-page">
    <section class="login-card">
      <div class="brand">
        <span class="brand-mark">M</span>
        <div><strong>Mall 商城管理</strong><span>运营管理平台</span></div>
      </div>
      <div class="login-heading">
        <h1>登录</h1>
        <p>请输入管理员账号和密码</p>
      </div>
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" size="large" @keyup.enter="handleLogin">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" :prefix-icon="User" autocomplete="username" clearable />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password placeholder="请输入密码" :prefix-icon="Lock" autocomplete="current-password" />
        </el-form-item>
        <el-form-item class="submit-item">
          <el-button type="primary" class="login-button" :loading="loading" @click="handleLogin">登录</el-button>
        </el-form-item>
      </el-form>
      <p class="login-note">请使用已开通权限的管理员账号</p>
    </section>
    <section class="welcome-copy" aria-label="商城管理平台介绍">
      <div class="welcome-mark"><el-icon><Goods /></el-icon></div>
      <span class="welcome-kicker">MALL COMMERCE MANAGEMENT</span>
      <h2>让经营数据，<br />一目了然。</h2>
      <p>商品、订单与履约信息集中管理，<br />为日常运营提供清晰可靠的工作台。</p>
      <div class="welcome-rule"><span /> MALL · OPERATIONS CENTER</div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Goods, Lock, User } from '@element-plus/icons-vue'
import { login } from '@/api/auth'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const formRef = ref<FormInstance>()
const loading = ref(false)
const form = reactive({ username: 'admin', password: '' })
const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function handleLogin() {
  await formRef.value?.validate()
  loading.value = true
  try {
    const data = await login('admin-app', form.username, form.password)
    userStore.saveToken(data.token, data.tokenHead)
    ElMessage.success('登录成功')
    router.push((route.query.redirect as string) || '/dashboard')
  } finally { loading.value = false }
}
</script>

<style scoped>
.login-page { position: relative; display: grid; width: 100%; height: 100%; min-height: 100%; grid-template-columns: minmax(0,1.05fr) minmax(370px,.75fr); align-items: center; gap: 8%; margin: 0; padding: clamp(34px,7vw,112px); overflow: hidden; background: linear-gradient(145deg,#2858f5,#3568fa 58%,#4977ff); }
.login-page::before, .login-page::after { position: absolute; border: 1px solid rgba(255,255,255,.12); border-radius: 44% 56% 61% 39% / 46% 42% 58% 54%; content: ''; pointer-events: none; }
.login-page::before { top: -48%; left: -22%; width: 92%; height: 125%; transform: rotate(16deg); box-shadow: 0 0 0 34px rgba(255,255,255,.035),0 0 0 70px rgba(255,255,255,.025); }
.login-page::after { right: -30%; bottom: -65%; width: 86%; height: 115%; transform: rotate(-22deg); box-shadow: 0 0 0 34px rgba(255,255,255,.035); }
.welcome-copy { position: relative; z-index: 1; max-width: 560px; color: #fff; }
.welcome-mark { display: grid; width: 62px; height: 62px; margin-bottom: 34px; place-items: center; border: 1px solid rgba(255,255,255,.38); border-radius: 20px; background: rgba(255,255,255,.14); font-size: 30px; }
.welcome-kicker { color: rgba(255,255,255,.7); font-size: 11px; letter-spacing: 2px; }
.welcome-copy h2 { margin: 17px 0; color: #fff; font-size: clamp(35px,4vw,58px); font-weight: 650; line-height: 1.25; letter-spacing: .5px; }
.welcome-copy p { color: rgba(255,255,255,.79); font-size: 16px; line-height: 1.9; }
.welcome-rule { display: flex; align-items: center; gap: 12px; margin-top: 64px; color: rgba(255,255,255,.62); font-size: 10px; letter-spacing: 1.6px; }
.welcome-rule span { width: 34px; height: 1px; background: rgba(255,255,255,.65); }
.login-card { position: relative; z-index: 1; width: min(420px, 100%); justify-self: end; padding: 33px 34px 26px; border: 1px solid rgba(226,237,255,.95); border-radius: 15px; background: #fff; box-shadow: 0 22px 55px rgba(18,47,126,.2); }
.brand { display: flex; align-items: center; gap: 12px; padding-bottom: 23px; border-bottom: 1px solid #edf2fa; }
.brand-mark { display: grid; width: 42px; height: 42px; place-items: center; border: 3px solid #dce7ff; border-radius: 50%; color: #fff; background: #3564f5; font-size: 16px; font-weight: 700; }
.brand strong, .brand span:not(.brand-mark) { display: block; }
.brand strong { color: #273959; font-size: 15px; font-weight: 650; }
.brand span:not(.brand-mark) { margin-top: 2px; color: #8797b0; font-size: 12px; }
.login-heading { margin: 26px 0 21px; }
.login-heading h1 { margin: 0; color: #233653; font-size: 23px; font-weight: 650; }
.login-heading p { margin: 6px 0 0; color: #8392a9; font-size: 13px; }
.login-card :deep(.el-form-item) { margin-bottom: 18px; }
.login-card :deep(.el-form-item__label) { padding-bottom: 5px; color: #485a77; font-size: 13px; }
.login-button { width: 100%; height: 44px; margin-top: 3px; border-radius: 8px; }
.submit-item { margin-bottom: 0 !important; }
.login-note { margin: 19px 0 0; color: #8b9ab0; font-size: 12px; text-align: center; }
@media (max-width: 820px) { .login-page { grid-template-columns: 1fr; gap: 18px; padding: 28px 20px; } .welcome-copy { display: none; } .login-card { width: min(420px,100%); justify-self: center; padding: 28px 26px 22px; } }
@media (max-width: 420px) { .login-card { padding: 25px 21px 21px; } }
</style>
