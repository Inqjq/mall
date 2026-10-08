<template><el-config-provider :locale="locale"><router-view /><FloatingAssistant role="merchant" /></el-config-provider></template>
<script setup lang="ts">
import locale from 'element-plus/es/locale/lang/zh-cn'
import FloatingAssistant from './components/FloatingAssistant.vue'
</script>
