<template>
  <div class="page-stack">
  <PageHeader title="订单管理" description="集中查看订单状态、金额与履约进度">
    <el-button :icon="Refresh" :loading="tableRef?.loading" @click="tableRef?.refresh()">刷新列表</el-button>
  </PageHeader>
  <el-card class="order-views" shadow="never">
    <el-tabs v-model="activeTab" @tab-change="selectStatus">
      <el-tab-pane label="全部订单" name="all" />
      <el-tab-pane label="待付款" name="0" />
      <el-tab-pane label="待发货" name="1" />
      <el-tab-pane label="已发货" name="2" />
      <el-tab-pane label="已完成" name="3" />
      <el-tab-pane label="已关闭" name="4" />
    </el-tabs>
  </el-card>
  <ProTable ref="tableRef" :columns="columns" :fetch="fetchPage" :search-fields="searchFields" :init-params="initialSearch">
    <template #payType="{ row }">{{ PAY_TYPE_MAP[row.payType ?? 0] || '未支付' }}</template>
    <template #totalAmount="{ row }"><span class="amount">¥ {{ row.totalAmount?.toFixed(2) || '0.00' }}</span></template>
    <template #status="{ row }">
      <el-tag :type="statusTagType(row.status)" effect="plain">{{ ORDER_STATUS_MAP[row.status ?? -1] || '未知' }}</el-tag>
    </template>
    <template #operations="{ row }">
      <el-button link type="primary" @click="router.push(`/order/detail/${row.id}`)">详情</el-button>
    </template>
  </ProTable>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ProTable from '@/components/ProTable/index.vue'
import PageHeader from '@/components/PageHeader.vue'
import type { ProTableColumn, SearchField } from '@/components/ProTable/index.vue'
import { getOrderList } from '@/api/order'
import { ORDER_STATUS_MAP, PAY_TYPE_MAP } from '@/types/api'
import { Refresh } from '@element-plus/icons-vue'
import { formatDateTime } from '@/utils/format'

const router = useRouter()
const route = useRoute()
const tableRef = ref<{ refresh: () => void; loading: boolean }>()
const activeTab = ref(String(route.query.status ?? 'all'))
const initialSearch = computed(() => ({ status: route.query.status == null ? null : Number(route.query.status) }))
watch(() => route.query.status, (status) => { activeTab.value = String(status ?? 'all') })

function selectStatus(tab: string | number) {
  const status = String(tab)
  router.replace({ path: '/order', query: status === 'all' ? {} : { status } })
}

const searchFields: SearchField[] = [
  { prop: 'orderSn', label: '订单号', component: 'input', placeholder: '订单号' },
]

const columns: ProTableColumn[] = [
  { prop: 'orderSn', label: '订单编号', minWidth: 190, showOverflowTooltip: true },
  { prop: 'receiverName', label: '收货人', width: 105 },
  { prop: 'receiverPhone', label: '联系电话', width: 130 },
  { prop: 'payType', label: '支付方式', width: 105, slot: true },
  { prop: 'totalAmount', label: '订单金额', width: 130, align: 'right', slot: true },
  { prop: 'status', label: '状态', width: 100, slot: true },
  { prop: 'createTime', label: '下单时间', minWidth: 180, format: formatDateTime },
  { prop: 'operations', label: '操作', width: 90, slot: true, fixed: 'right' },
]

function statusTagType(status?: number) {
  switch (status) {
    case 0:
      return 'warning'
    case 1:
      return 'primary'
    case 2:
    case 3:
      return 'success'
    default:
      return 'info'
  }
}

function fetchPage(params: Record<string, unknown>) {
  return getOrderList({
    pageNum: params.pageNum as number,
    pageSize: params.pageSize as number,
    orderSn: (params.orderSn as string) || undefined,
    status: (params.status as number) ?? undefined,
  })
}
</script>

<style scoped>
.amount { color: #313c4a; font-variant-numeric: tabular-nums; }
</style>
