<template>
  <div class="page-stack">
    <PageHeader title="订单设置" description="配置订单付款、收货确认和交易完成等自动处理时限。"><el-button :icon="Refresh" :loading="loading" @click="load">刷新</el-button></PageHeader>
    <el-alert title="修改后会影响后续订单的自动关闭、确认收货及售后时限，请核对后保存。" type="warning" :closable="false" show-icon />
    <el-card shadow="never" class="settings-card">
      <el-form v-loading="loading" :model="form" label-position="top" class="settings-grid">
        <el-form-item label="普通订单未付款关闭时间"><el-input-number v-model="form.normalOrderOvertime" :min="1" :max="10080" controls-position="right" /><span>分钟</span><small>买家下单后未付款将自动关闭</small></el-form-item>
        <el-form-item label="限时购订单未付款关闭时间"><el-input-number v-model="form.flashOrderOvertime" :min="1" :max="10080" controls-position="right" /><span>分钟</span><small>限时购订单未付款将自动关闭</small></el-form-item>
        <el-form-item label="发货后自动确认收货"><el-input-number v-model="form.confirmOvertime" :min="1" :max="365" controls-position="right" /><span>天</span><small>物流发出后超过时限自动收货</small></el-form-item>
        <el-form-item label="订单完成后不可申请售后"><el-input-number v-model="form.finishOvertime" :min="1" :max="365" controls-position="right" /><span>天</span><small>完成交易后超过时限关闭售后申请</small></el-form-item>
        <el-form-item label="自动好评时间"><el-input-number v-model="form.commentOvertime" :min="1" :max="365" controls-position="right" /><span>天</span><small>交易完成后自动生成评价</small></el-form-item>
      </el-form>
      <div class="settings-footer"><span>设置编号：{{ form.id || '—' }}</span><el-button type="primary" :loading="saving" @click="save">保存设置</el-button></div>
    </el-card>
  </div>
</template>
<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import { getOrderSetting, saveOrderSetting } from '@/api/business'
const loading = ref(false); const saving = ref(false)
const form = reactive({ id: 1, normalOrderOvertime: 0, flashOrderOvertime: 0, confirmOvertime: 0, finishOvertime: 0, commentOvertime: 0 })
async function load(){loading.value=true;try{Object.assign(form,await getOrderSetting(1))}finally{loading.value=false}}
async function save(){saving.value=true;try{await saveOrderSetting(form.id,{...form});ElMessage.success('订单设置已保存')}finally{saving.value=false}}
onMounted(load)
</script>
<style scoped>
.settings-card{border-color:#e4ebf5;border-radius:10px}.settings-card :deep(.el-card__body){padding:24px}.settings-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px 32px;max-width:880px}.settings-grid :deep(.el-form-item){position:relative;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;column-gap:9px;padding:17px 0 15px;border-bottom:1px solid #edf0f4}.settings-grid :deep(.el-form-item__label){grid-column:1/-1;color:#39485d;font-weight:600}.settings-grid :deep(.el-input-number){width:100%}.settings-grid :deep(.el-form-item__content){display:contents}.settings-grid span{color:#68778a;font-size:12px}.settings-grid small{grid-column:1/-1;margin-top:7px;color:#98a2b1;font-size:10px}.settings-footer{display:flex;align-items:center;justify-content:space-between;margin-top:16px;padding-top:18px;border-top:1px solid #e9edf2;color:#8a96a6;font-size:11px}@media(max-width:700px){.settings-grid{grid-template-columns:1fr}.settings-card :deep(.el-card__body){padding:15px}}
</style>
