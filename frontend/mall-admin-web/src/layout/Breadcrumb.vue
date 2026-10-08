<template>
  <el-breadcrumb separator="/" class="breadcrumb">
    <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
    <el-breadcrumb-item v-if="currentTitle">{{ currentTitle }}</el-breadcrumb-item>
  </el-breadcrumb>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
const route = useRoute()
const currentTitle = computed(() => route.path === '/dashboard' ? '' : String(route.meta.title || ''))
</script>

<style scoped>
.breadcrumb { font-size: 13px; }
.breadcrumb :deep(.el-breadcrumb__inner) { color: #677282; font-weight: 400; }
.breadcrumb :deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) { color: #333d4b; font-weight: 500; }
</style>
