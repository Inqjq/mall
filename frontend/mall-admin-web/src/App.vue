<template>
  <router-view />
  <FloatingAssistant role="admin" :get-token="() => userStore.tokenHead + userStore.token" />
</template>

<script setup lang="ts">
import FloatingAssistant from '@/components/FloatingAssistant.vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
</script>

<style>
#app {
  color: #303133;
}
</style>
