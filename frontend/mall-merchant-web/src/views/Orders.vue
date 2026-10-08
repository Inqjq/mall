<template>
  <div class="page-stack">
    <div class="page-heading"><div><h1>订单履约</h1><p>核对订单信息，及时完成发货与物流录入。</p></div><div class="heading-actions"><el-button v-if="selectedOrders.length" type="primary" :loading="batchDelivering" @click="openBatchDelivery">批量发货（{{ selectedOrders.length }}）</el-button><el-button :icon="Refresh" :loading="loading" @click="load">刷新订单</el-button></div></div>
    <section class="surface order-surface">
      <el-tabs v-model="activeStatus" class="order-tabs" @tab-change="changeTab">
        <el-tab-pane v-for="tab in tabs" :key="tab.key" :label="tab.label" :name="tab.key" />
      </el-tabs>
      <div class="filter-bar order-filter"><el-form inline @submit.prevent="search"><el-form-item label="订单编号"><el-input v-model="orderSn" clearable placeholder="请输入订单编号" :prefix-icon="Search" @keyup.enter="search" /></el-form-item><el-form-item label="收货人"><el-input v-model="receiver" clearable placeholder="姓名或手机号" @keyup.enter="search" /></el-form-item><el-form-item><el-button type="primary" :icon="Search" @click="search">查询</el-button><el-button :icon="RefreshLeft" @click="reset">重置</el-button></el-form-item></el-form></div>
      <div class="list-meta"><b>{{ currentTabLabel }}</b><span>共 {{ total.toLocaleString() }} 笔订单</span></div>
      <el-table v-loading="loading" :data="rows" row-key="id" class="merchant-table" table-layout="auto" @selection-change="(selection: Order[]) => selectedOrders = selection">
        <el-table-column type="selection" width="48" :selectable="(row: Order) => Number(row.status) === 1 && !batchDelivering" />
        <el-table-column label="订单信息" min-width="205"><template #default="{ row }"><div class="order-primary"><b>{{ row.orderSn || `订单 #${row.id}` }}</b><small>{{ dateTime(row.createTime) }}</small></div></template></el-table-column>
        <el-table-column label="收货信息" min-width="145"><template #default="{ row }"><div class="order-primary"><b>{{ row.receiverName || '—' }}</b><small>{{ row.receiverPhone || '未留联系电话' }}</small></div></template></el-table-column>
        <el-table-column label="订单金额" width="135" align="right"><template #default="{ row }"><b class="price-text">¥ {{ money(row.payAmount ?? row.totalAmount) }}</b></template></el-table-column>
        <el-table-column label="物流信息" min-width="170"><template #default="{ row }"><div v-if="row.deliverySn" class="order-primary"><b>{{ row.deliveryCompany || '已发货' }}</b><small>{{ row.deliverySn }}</small></div><span v-else class="muted-text">{{ row.status === 1 ? '待填写' : '—' }}</span></template></el-table-column>
        <el-table-column label="订单状态" width="115"><template #default="{ row }"><el-tag :type="statusType(row.status)" effect="light">{{ orderStatus(row.status) }}</el-tag></template></el-table-column>
        <el-table-column label="操作" width="118" fixed="right"><template #default="{ row }"><el-button v-if="row.status === 1" link type="primary" @click="openDelivery(row)">填写发货</el-button><el-button v-else link type="primary" @click="viewDelivery(row)">物流信息</el-button></template></el-table-column>
        <template #empty><el-empty description="没有找到符合条件的订单" :image-size="80" /></template>
      </el-table>
      <div class="pagination-wrap"><el-pagination v-model:current-page="pageNum" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next, jumper" @change="load" /></div>
    </section>
    <el-dialog v-model="deliveryVisible" title="订单发货" width="470px" destroy-on-close>
      <div class="delivery-order"><span>订单编号</span><b>{{ selectedOrder?.orderSn || `订单 #${selectedOrder?.id}` }}</b></div>
      <el-form label-position="top" class="delivery-form">
        <el-form-item label="物流公司" required><el-select v-model="deliveryForm.deliveryCompany" placeholder="请选择物流公司" style="width: 100%"><el-option v-for="company in carriers" :key="company" :label="company" :value="company" /></el-select></el-form-item>
        <el-form-item label="物流单号" required><el-input v-model="deliveryForm.deliverySn" placeholder="请输入运单号" maxlength="80" show-word-limit /></el-form-item>
      </el-form>
      <template #footer><el-button @click="deliveryVisible = false">取消</el-button><el-button type="primary" :loading="delivering" @click="submitDelivery">确认发货</el-button></template>
    </el-dialog>
    <el-dialog v-model="batchDeliveryVisible" title="批量发货" width="760px" destroy-on-close>
      <div class="batch-dialog-intro"><b>共 {{ batchDeliveryForm.length }} 笔待发货订单</b><span>请逐笔核对并填写物流公司和运单号，确认后将同时提交。</span></div>
      <div class="batch-delivery-list">
        <div v-for="item in batchDeliveryForm" :key="item.orderId" class="batch-delivery-row">
          <div class="batch-delivery-order"><b>{{ item.orderSn || `订单 #${item.orderId}` }}</b><small>{{ item.receiverName || '收货人未填写' }}</small></div>
          <el-select v-model="item.deliveryCompany" placeholder="物流公司" class="batch-carrier"><el-option v-for="company in carriers" :key="company" :label="company" :value="company" /></el-select>
          <el-input v-model="item.deliverySn" placeholder="填写此订单的运单号" maxlength="80" />
        </div>
      </div>
      <template #footer><el-button @click="batchDeliveryVisible = false">取消</el-button><el-button type="primary" :loading="batchDelivering" @click="submitBatchDelivery">确认批量发货</el-button></template>
    </el-dialog>
    <el-dialog v-model="trackingVisible" title="物流信息" width="430px"><el-descriptions :column="1" border><el-descriptions-item label="订单编号">{{ selectedOrder?.orderSn || `订单 #${selectedOrder?.id}` }}</el-descriptions-item><el-descriptions-item label="物流公司">{{ selectedOrder?.deliveryCompany || '—' }}</el-descriptions-item><el-descriptions-item label="物流单号">{{ selectedOrder?.deliverySn || '暂无物流信息' }}</el-descriptions-item></el-descriptions></el-dialog>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, RefreshLeft, Search } from '@element-plus/icons-vue'
import { dateTime, deliverOrders, money, orderStatus, orders, type Order } from '../api'

const emit = defineEmits<{ pending: [count: number] }>()
const route = useRoute()
const router = useRouter()
const tabs = [{ key: 'all', label: '全部订单' }, { key: '0', label: '待付款' }, { key: '1', label: '待发货' }, { key: '2', label: '已发货' }, { key: '3', label: '已完成' }, { key: '4', label: '已关闭' }]
const activeStatus = ref(String(route.query.status ?? 'all'))
const currentTabLabel = computed(() => tabs.find((item) => item.key === activeStatus.value)?.label || '全部订单')
const rows = ref<Order[]>([])
const selectedOrders = ref<Order[]>([])
const orderSn = ref(String(route.query.orderSn || ''))
const receiver = ref(String(route.query.receiverKeyword || ''))
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(false)
const deliveryVisible = ref(false)
const trackingVisible = ref(false)
const delivering = ref(false)
const batchDelivering = ref(false)
const batchDeliveryVisible = ref(false)
const batchDeliveryForm = ref<Array<{ orderId: number; orderSn?: string; receiverName?: string; deliveryCompany: string; deliverySn: string }>>([])
const selectedOrder = ref<Order>()
const carriers = ['顺丰速运', '中通快递', '圆通速递', '申通快递', '韵达快递', '京东物流', '邮政 EMS']
const deliveryForm = reactive({ deliveryCompany: '', deliverySn: '' })
function statusType(status?: number) { return status === 0 || status === 1 ? 'warning' : status === 2 || status === 3 ? 'success' : 'info' }
async function load(page = pageNum.value) {
  pageNum.value = page; loading.value = true
  try {
    const result = await orders({ pageNum: page, pageSize: pageSize.value, orderSn: orderSn.value.trim() || undefined, receiverKeyword: receiver.value.trim() || undefined, status: activeStatus.value === 'all' ? undefined : Number(activeStatus.value) })
    const data = (result.list || []) as Order[]
    selectedOrders.value = []
    rows.value = data
    total.value = Number(result.total) || 0
    if (activeStatus.value === '1') emit('pending', Number(result.total) || 0)
  } finally { loading.value = false }
}
function changeTab(name: string | number) {
  activeStatus.value = String(name); pageNum.value = 1
  const query = { ...route.query }
  if (activeStatus.value === 'all') delete query.status
  else query.status = activeStatus.value
  router.replace({ path: '/orders', query })
  load(1)
}
function search() { load(1) }
function reset() { orderSn.value = ''; receiver.value = ''; load(1) }
function openDelivery(row: Order) { selectedOrder.value = row; deliveryForm.deliveryCompany = ''; deliveryForm.deliverySn = ''; deliveryVisible.value = true }
function viewDelivery(row: Order) { selectedOrder.value = row; trackingVisible.value = true }
function openBatchDelivery() {
  const eligible = selectedOrders.value.filter((row) => Number(row.status) === 1)
  if (!eligible.length) return ElMessage.info('请选择待发货订单')
  batchDeliveryForm.value = eligible.map((row) => ({ orderId: row.id, orderSn: row.orderSn, receiverName: row.receiverName, deliveryCompany: '', deliverySn: '' }))
  batchDeliveryVisible.value = true
}
async function submitBatchDelivery() {
  const missingCarrier = batchDeliveryForm.value.find((item) => !item.deliveryCompany)
  if (missingCarrier) return ElMessage.warning(`请为 ${missingCarrier.orderSn || `订单 #${missingCarrier.orderId}`} 选择物流公司`)
  const missingTracking = batchDeliveryForm.value.find((item) => !item.deliverySn.trim())
  if (missingTracking) return ElMessage.warning(`请填写 ${missingTracking.orderSn || `订单 #${missingTracking.orderId}`} 的运单号`)
  try { await ElMessageBox.confirm(`确认提交这 ${batchDeliveryForm.value.length} 笔订单的物流信息？`, '批量发货确认', { type: 'warning', confirmButtonText: '确认发货', cancelButtonText: '再检查一下' }) } catch { return }
  batchDelivering.value = true
  try {
    await deliverOrders(batchDeliveryForm.value.map(({ orderId, deliveryCompany, deliverySn }) => ({ orderId, deliveryCompany, deliverySn: deliverySn.trim() })))
    ElMessage.success(`已提交 ${batchDeliveryForm.value.length} 笔订单发货`)
    batchDeliveryVisible.value = false
    selectedOrders.value = []
    await load()
  } finally { batchDelivering.value = false }
}
async function submitDelivery() {
  if (!deliveryForm.deliveryCompany) return ElMessage.warning('请选择物流公司')
  if (!deliveryForm.deliverySn.trim()) return ElMessage.warning('请输入物流单号')
  if (!selectedOrder.value) return
  delivering.value = true
  try {
    await deliverOrders([{ orderId: selectedOrder.value.id, deliveryCompany: deliveryForm.deliveryCompany, deliverySn: deliveryForm.deliverySn.trim() }])
    ElMessage.success('订单发货成功')
    deliveryVisible.value = false
    await load()
  } finally { delivering.value = false }
}
watch(() => route.query.status, (value) => { activeStatus.value = String(value ?? 'all'); load(1) })
watch(() => route.query.orderSn, (value) => { orderSn.value = String(value || ''); load(1) })
watch(() => route.query.receiverKeyword, (value) => { receiver.value = String(value || ''); load(1) })
onMounted(() => load(1))
</script>
