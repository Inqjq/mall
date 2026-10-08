<template>
  <main class="login-page">
    <section class="login-intro"><div class="intro-mark"><el-icon><Shop /></el-icon></div><h1>商家工作台</h1><p>商品管理、订单履约<br />店铺经营数据</p></section>
    <section class="login-panel"><div class="login-brand"><span class="brand-logo"><el-icon><Shop /></el-icon></span><div><b>商城商家中心</b></div></div><div class="login-title"><h2>登录</h2><p>使用已开通商城后台权限的账号</p></div>
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @keyup.enter="submit">
        <el-form-item label="账号" prop="username"><el-input v-model="form.username" size="large" autocomplete="username" placeholder="请输入账号" :prefix-icon="User" /></el-form-item>
        <el-form-item label="密码" prop="password"><el-input v-model="form.password" size="large" type="password" show-password autocomplete="current-password" placeholder="请输入密码" :prefix-icon="Lock" /></el-form-item>
        <el-button type="primary" class="login-submit" size="large" :loading="loading" @click="submit">登录工作台<el-icon class="el-icon--right"><ArrowRight /></el-icon></el-button>
      </el-form>
    </section>
  </main>
</template>
<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { ArrowRight, Lock, Shop, User } from '@element-plus/icons-vue'
import { signIn } from '../api'

const router = useRouter()
const route = useRoute()
const formRef = ref<FormInstance>()
const loading = ref(false)
const form = reactive({ username: '', password: '' })
const rules: FormRules = { username: [{ required: true, message: '请输入账号', trigger: 'blur' }], password: [{ required: true, message: '请输入密码', trigger: 'blur' }] }
async function submit() {
  if (!formRef.value) return
  await formRef.value.validate()
  loading.value = true
  try {
    const result = await signIn(form.username, form.password) as unknown as { token: string; tokenHead: string }
    localStorage.setItem('mall_merchant_token', result.token)
    localStorage.setItem('mall_merchant_token_head', result.tokenHead || 'Bearer ')
    localStorage.setItem('mall_merchant_name', form.username)
    ElMessage.success('登录成功')
    await router.replace((route.query.redirect as string) || '/overview')
  } finally { loading.value = false }
}
</script>
