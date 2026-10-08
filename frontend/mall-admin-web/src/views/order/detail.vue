<template>
  <div class="detail-page" v-loading="loading">
    <PageHeader :title="order.orderSn ? `订单 ${order.orderSn}` : '订单详情'">
      <el-button v-if="order.status === 1" v-permission="'order'" type="primary" @click="openDelivery">订单发货</el-button>
      <el-button @click="$router.push('/order')">返回列表</el-button>
    </PageHeader>
    <section class="order-summary">
      <div>
        <div class="summary-label">订单状态</div>
        <el-tag :type="statusTagType(order.status)" effect="plain">{{ ORDER_STATUS_MAP[order.status ?? -1] || '未知' }}</el-tag>
      </div>
      <div class="summary-total"><span>订单金额</span><strong>¥ {{ formatAmount(order.totalAmount) }}</strong></div>
      <div class="summary-date"><span>下单时间</span><strong>{{ formatDateTime(order.createTime) }}</strong></div>
    </section>

    <div class="detail-grid">
      <el-card shadow="never" header="订单信息">
        <el-descriptions :column="2" class="plain-descriptions">
          <el-descriptions-item label="订单编号">{{ order.orderSn || '-' }}</el-descriptions-item>
          <el-descriptions-item label="会员账号">{{ order.memberUsername || '-' }}</el-descriptions-item>
          <el-descriptions-item label="支付方式">{{ PAY_TYPE_MAP[order.payType ?? 0] || '-' }}</el-descriptions-item>
          <el-descriptions-item label="支付时间">{{ formatDateTime(order.paymentTime) }}</el-descriptions-item>
          <el-descriptions-item label="优惠金额">¥ {{ formatAmount(discountTotal) }}</el-descriptions-item>
          <el-descriptions-item label="运费">¥ {{ formatAmount(order.freightAmount) }}</el-descriptions-item>
          <el-descriptions-item label="订单备注" :span="2">{{ order.note || '-' }}</el-descriptions-item>
        </el-descriptions>
      </el-card>
      <el-card shadow="never" header="收货与物流">
        <el-descriptions :column="2" class="plain-descriptions">
          <el-descriptions-item label="收货人">{{ order.receiverName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ order.receiverPhone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="收货地址" :span="2">{{ receiverAddress }}</el-descriptions-item>
          <el-descriptions-item label="物流公司">{{ order.deliveryCompany || '-' }}</el-descriptions-item>
          <el-descriptions-item label="物流单号">{{ order.deliverySn || '-' }}</el-descriptions-item>
          <el-descriptions-item label="发货时间" :span="2">{{ formatDateTime(order.deliveryTime) }}</el-descriptions-item>
        </el-descriptions>
      </el-card>
    </div>

    <el-card shadow="never" header="商品明细" class="section">
      <el-table :data="order.orderItemList || []" row-key="id">
        <el-table-column label="商品" width="84">
          <template #default="{ row }">
            <el-image class="item-image" :src="row.productPic" :alt="`${row.productName || '商品'}图片`" :preview-src-list="[row.productPic]" fit="cover" preview-teleported />
          </template>
        </el-table-column>
        <el-table-column prop="productName" label="商品名称" min-width="220" show-overflow-tooltip />
        <el-table-column prop="productAttr" label="规格" min-width="150" show-overflow-tooltip />
        <el-table-column label="单价" width="130" align="right">
          <template #default="{ row }">¥ {{ formatAmount(row.productPrice) }}</template>
        </el-table-column>
        <el-table-column prop="productQuantity" label="数量" width="90" align="center" />
        <el-table-column label="小计" width="130" align="right">
          <template #default="{ row }">¥ {{ formatAmount(row.realAmount) }}</template>
        </el-table-column>
        <template #empty><el-empty description="没有商品明细" :image-size="72" /></template>
      </el-table>
    </el-card>

    <el-card shadow="never" header="操作记录" class="section">
      <el-timeline v-if="order.historyList?.length" class="history-list">
        <el-timeline-item v-for="item in order.historyList" :key="item.id" :timestamp="formatDateTime(item.createTime)" placement="top" color="#5479f5">
          <div class="history-item"><strong>{{ ORDER_STATUS_MAP[item.orderStatus ?? -1] || '未知' }}</strong><span>{{ item.note || '状态更新' }}</span><small>操作人：{{ item.operateMan || '-' }}</small></div>
        </el-timeline-item>
      </el-timeline>
      <el-empty v-else description="暂无操作记录" />
    </el-card>

    <!-- 发货弹窗 -->
    <el-dialog v-model="deliveryVisible" title="订单发货" width="420px" destroy-on-close>
      <el-form label-width="90px" @submit.prevent="handleDeliver">
        <el-form-item label="物流公司" required>
          <el-select v-model="deliveryForm.deliveryCompany" placeholder="请选择物流公司" style="width: 100%">
            <el-option v-for="company in DELIVERY_COMPANIES" :key="company" :label="company" :value="company" />
          </el-select>
        </el-form-item>
        <el-form-item label="运单号" required>
          <el-input v-model="deliveryForm.deliverySn" placeholder="请输入物流单号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="deliveryVisible = false">取消</el-button>
        <el-button type="primary" :loading="delivering" @click="handleDeliver">确认发货</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import { deliverOrder, getOrderDetail } from '@/api/order'
import { ORDER_STATUS_MAP, PAY_TYPE_MAP } from '@/types/api'
import { formatDateTime } from '@/utils/format'
import type { OmsOrderDetail } from '@/types/api'

const DELIVERY_COMPANIES = ['顺丰速运', '中通快递', '圆通速递', '申通快递', '韵达快递', '京东物流', '邮政 EMS']

const route = useRoute()
const orderId = Number(route.params.id)

const loading = ref(false)
const order = ref<OmsOrderDetail>({ id: orderId })

const deliveryVisible = ref(false)
const delivering = ref(false)
const deliveryForm = reactive({ deliveryCompany: '', deliverySn: '' })

const receiverAddress = computed(() => {
  const info = order.value
  if (!info.receiverProvince && !info.receiverCity && !info.receiverRegion && !info.receiverDetailAddress) return '-'
  return `${info.receiverProvince || ''}${info.receiverCity || ''}${info.receiverRegion || ''}${info.receiverDetailAddress || ''}`
})

/** 优惠金额 = 促销优惠 + 优惠券抵扣 */
const discountTotal = computed(() => (order.value.promotionAmount ?? 0) + (order.value.couponAmount ?? 0))

function formatAmount(value?: number) {
  return value == null ? '-' : value.toFixed(2)
}

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

async function loadDetail() {
  loading.value = true
  try {
    order.value = await getOrderDetail(orderId)
  } finally {
    loading.value = false
  }
}

function openDelivery() {
  deliveryForm.deliveryCompany = ''
  deliveryForm.deliverySn = ''
  deliveryVisible.value = true
}

async function handleDeliver() {
  if (!deliveryForm.deliveryCompany) return ElMessage.warning('请选择物流公司')
  if (!deliveryForm.deliverySn) return ElMessage.warning('请输入物流单号')
  delivering.value = true
  try {
    await deliverOrder([
      {
        orderId,
        deliveryCompany: deliveryForm.deliveryCompany,
        deliverySn: deliveryForm.deliverySn,
      },
    ])
    ElMessage.success('发货成功')
    deliveryVisible.value = false
    await loadDetail()
  } finally {
    delivering.value = false
  }
}

onMounted(loadDetail)
</script>

<style scoped>
.detail-page { display: grid; gap: 16px; }
.detail-page :deep(.page-heading) { margin-bottom: 0; }
.order-summary { display: grid; grid-template-columns: 1fr 1fr 1.4fr; align-items: center; gap: 18px; min-height: 96px; padding: 16px 20px; border: 1px solid #e2edfb; border-radius: 11px; background: #fff; box-shadow: 0 4px 15px rgba(51,91,158,.035); }
.summary-label, .summary-total > span, .summary-date > span { display: block; margin-bottom: 5px; color: #7d8795; font-size: 12px; }
.summary-total strong { color: #2a55d8; font-size: 23px; font-weight: 650; font-variant-numeric: tabular-nums; }
.summary-date strong { color: #424e5d; font-size: 13px; font-weight: 500; }
.detail-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.plain-descriptions :deep(.el-descriptions__label) { color: #788391; font-weight: 400; }
.plain-descriptions :deep(.el-descriptions__content) { color: #35404e; }
.section { margin-top: 0; }
.item-image { width: 48px; height: 48px; border: 1px solid #e5e9ef; border-radius: 3px; background: #f5f6f8; }
.history-list { max-width: 760px; padding-top: 8px; }
.history-item { display: flex; align-items: baseline; flex-wrap: wrap; gap: 10px; color: #566171; }
.history-item strong { color: #303946; font-weight: 600; }
.history-item small { color: #8a94a1; }
@media (max-width: 850px) { .detail-grid { grid-template-columns: 1fr; } }
@media (max-width: 560px) {
  .order-summary { grid-template-columns: 1fr 1fr; gap: 12px; padding: 12px; }
  .summary-date { grid-column: 1 / -1; }
  .plain-descriptions :deep(.el-descriptions__body .el-descriptions__table) { table-layout: fixed; }
}
</style>
