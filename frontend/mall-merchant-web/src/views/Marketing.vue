<template>
  <div class="page-stack marketing-page">
    <div class="page-heading">
      <div><h1>营销活动</h1><p>管理店铺优惠券与限时秒杀，查看活动状态和领取情况。</p></div>
      <div class="heading-actions"><el-button :icon="Refresh" :loading="loading" @click="load">刷新数据</el-button><el-button type="primary" :icon="Plus" @click="openCreate">{{ activeTab === 'flash' ? '创建秒杀活动' : '创建优惠券' }}</el-button></div>
    </div>
    <div class="product-stats marketing-stats">
      <div><span>活动类型</span><b>{{ activeTab === 'flash' ? '限时秒杀' : '店铺优惠券' }}</b></div>
      <div><span>{{ activeTab === 'flash' ? '活动数量' : '优惠券数量' }}</span><b>{{ total.toLocaleString() }}</b></div>
      <div><span>{{ activeTab === 'flash' ? '本页进行中' : '本页已领取' }}</span><b>{{ activeTab === 'flash' ? activeCount.toLocaleString() : receivedCount.toLocaleString() }}</b></div>
      <div><span>{{ activeTab === 'flash' ? '本页已结束' : '本页已使用' }}</span><b>{{ activeTab === 'flash' ? endedCount.toLocaleString() : usedCount.toLocaleString() }}</b></div>
    </div>
    <section class="surface marketing-surface">
      <el-tabs v-model="activeTab" class="order-tabs" @tab-change="changeTab">
        <el-tab-pane label="秒杀活动" name="flash" />
        <el-tab-pane label="优惠券" name="coupons" />
      </el-tabs>
      <div class="filter-bar marketing-filter">
        <el-form inline @submit.prevent="search">
          <el-form-item :label="activeTab === 'flash' ? '活动名称' : '优惠券名称'"><el-input v-model="keyword" clearable :placeholder="activeTab === 'flash' ? '输入活动名称' : '输入优惠券名称'" :prefix-icon="Search" @keyup.enter="search" /></el-form-item>
          <el-form-item v-if="activeTab === 'coupons'" label="优惠券类型"><el-select v-model="couponType" clearable placeholder="全部类型" style="width: 145px" @change="search"><el-option v-for="item in couponTypes" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
          <el-form-item><el-button type="primary" :icon="Search" @click="search">查询</el-button><el-button :icon="RefreshLeft" @click="reset">重置</el-button></el-form-item>
        </el-form>
      </div>
      <div class="list-meta"><b>{{ activeTab === 'flash' ? '秒杀活动列表' : '优惠券列表' }}</b><span>共 {{ total.toLocaleString() }} 项</span></div>
      <el-table v-loading="loading" :data="activeTab === 'flash' ? flashRows : couponRows" row-key="id" class="merchant-table" table-layout="auto">
        <template v-if="activeTab === 'flash'">
          <el-table-column label="活动名称" min-width="220"><template #default="{ row }"><div class="campaign-title"><span class="campaign-mark"><el-icon><Promotion /></el-icon></span><div><b>{{ row.title || '未命名秒杀活动' }}</b><small>活动编号：{{ row.id }}</small></div></div></template></el-table-column>
          <el-table-column label="活动时间" min-width="240"><template #default="{ row }"><div class="order-primary"><b>{{ dateTime(row.startDate) }}</b><small>至 {{ dateTime(row.endDate) }}</small></div></template></el-table-column>
          <el-table-column label="状态" width="130"><template #default="{ row }"><el-tag :type="flashStatus(row).type" effect="light">{{ flashStatus(row).label }}</el-tag></template></el-table-column>
          <el-table-column label="活动开关" width="130"><template #default="{ row }"><div class="publish-control"><el-switch :model-value="Number(row.status)" :active-value="1" :inactive-value="0" :loading="updatingId === row.id" :aria-label="`${row.title || '秒杀活动'}状态`" @change="(value: string | number | boolean) => changeFlashStatus(row, Number(value))" /><span>{{ Number(row.status) === 1 ? '已开启' : '已关闭' }}</span></div></template></el-table-column>
          <el-table-column label="创建时间" min-width="160"><template #default="{ row }">{{ dateTime(row.createTime) }}</template></el-table-column>
          <el-table-column label="操作" width="130" fixed="right"><template #default="{ row }"><el-button link type="primary" @click="openEditFlash(row)">编辑</el-button><el-button link type="danger" @click="removeFlash(row)">删除</el-button></template></el-table-column>
        </template>
        <template v-else>
          <el-table-column label="优惠券" min-width="220"><template #default="{ row }"><div class="coupon-cell"><div class="coupon-value"><small>¥</small>{{ money(row.amount) }}</div><div class="order-primary"><b>{{ row.name || '未命名优惠券' }}</b><small>{{ couponTypeName(row.type) }} · {{ Number(row.minPoint) > 0 ? `满 ¥${money(row.minPoint)} 可用` : '无门槛' }}</small></div></div></template></el-table-column>
          <el-table-column label="发行 / 已领取" min-width="145"><template #default="{ row }"><div class="order-primary"><b>{{ Number(row.publishCount ?? row.count ?? 0).toLocaleString() }} 张</b><small>已领取 {{ Number(row.receiveCount || 0).toLocaleString() }} 张</small></div></template></el-table-column>
          <el-table-column label="已使用" width="105" align="right"><template #default="{ row }">{{ Number(row.useCount || 0).toLocaleString() }}</template></el-table-column>
          <el-table-column label="领取时间" min-width="220"><template #default="{ row }"><div class="order-primary"><b>{{ dateTime(row.startTime) }}</b><small>至 {{ dateTime(row.endTime) }}</small></div></template></el-table-column>
          <el-table-column label="每人限领" width="105" align="right"><template #default="{ row }">{{ row.perLimit || '不限' }}</template></el-table-column>
          <el-table-column label="操作" width="130" fixed="right"><template #default="{ row }"><el-button link type="primary" @click="openEditCoupon(row)">编辑</el-button><el-button link type="danger" @click="removeCoupon(row)">删除</el-button></template></el-table-column>
        </template>
        <template #empty><el-empty :description="activeTab === 'flash' ? '还没有秒杀活动，创建活动后可在这里管理' : '还没有优惠券，创建后即可在店铺中发放'" :image-size="82" /></template>
      </el-table>
      <div class="pagination-wrap"><el-pagination v-model:current-page="pageNum" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next, jumper" @change="load" /></div>
    </section>

    <el-dialog v-model="dialogVisible" :title="`${editingId ? '编辑' : '创建'}${activeTab === 'flash' ? '秒杀活动' : '优惠券'}`" width="610px" destroy-on-close>
      <el-form label-position="top" class="marketing-form">
        <template v-if="activeTab === 'flash'">
          <el-form-item label="活动名称" required><el-input v-model="flashForm.title" maxlength="40" show-word-limit placeholder="例如：周末限时秒杀" /></el-form-item>
          <div class="form-two-column"><el-form-item label="开始时间" required><input v-model="flashForm.startDate" class="native-field" type="datetime-local" /></el-form-item><el-form-item label="结束时间" required><input v-model="flashForm.endDate" class="native-field" type="datetime-local" /></el-form-item></div>
          <div class="form-tip">创建后可在活动列表中单独开启或关闭。秒杀商品需在平台商品活动配置中关联。</div>
        </template>
        <template v-else>
          <el-form-item label="优惠券名称" required><el-input v-model="couponForm.name" maxlength="40" show-word-limit placeholder="例如：新客专享券" /></el-form-item>
          <div class="form-two-column"><el-form-item label="优惠券类型" required><el-select v-model="couponForm.type" style="width: 100%"><el-option v-for="item in couponTypes" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item><el-form-item label="优惠金额（元）" required><el-input-number v-model="couponForm.amount" :min="0.01" :precision="2" :step="1" controls-position="right" style="width: 100%" /></el-form-item></div>
          <div class="form-two-column"><el-form-item label="发行数量" required><el-input-number v-model="couponForm.count" :min="1" :max="10000000" :step="100" controls-position="right" style="width: 100%" /></el-form-item><el-form-item label="每人限领"><el-input-number v-model="couponForm.perLimit" :min="1" :max="100" controls-position="right" style="width: 100%" /></el-form-item></div>
          <div class="form-two-column"><el-form-item label="使用门槛（元）"><el-input-number v-model="couponForm.minPoint" :min="0" :precision="2" :step="10" controls-position="right" style="width: 100%" /></el-form-item><el-form-item label="使用范围"><el-select v-model="couponForm.useType" style="width: 100%"><el-option label="全场通用" :value="0" /><el-option label="指定分类" :value="1" /><el-option label="指定商品" :value="2" /></el-select></el-form-item></div>
          <div class="form-two-column"><el-form-item label="开始领取时间" required><input v-model="couponForm.startTime" class="native-field" type="datetime-local" /></el-form-item><el-form-item label="结束领取时间" required><input v-model="couponForm.endTime" class="native-field" type="datetime-local" /></el-form-item></div>
          <el-form-item label="备注"><el-input v-model="couponForm.note" type="textarea" :rows="2" maxlength="120" placeholder="记录优惠券使用说明" /></el-form-item>
          <div class="form-tip">优惠券创建后可在会员营销中发放；指定商品或分类需在优惠券规则中继续配置。</div>
        </template>
      </el-form>
      <template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" :loading="saving" @click="submitCreate">确认创建</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Promotion, Plus, Refresh, RefreshLeft, Search } from '@element-plus/icons-vue'
import { couponDetail, coupons, createCoupon, createFlashCampaign, dateTime, deleteCoupon, deleteFlashCampaign, flashCampaigns, money, updateCoupon, updateFlashCampaign, updateFlashStatus, type Coupon, type FlashCampaign } from '../api'

const route = useRoute()
const router = useRouter()
const activeTab = ref(route.query.tab === 'coupons' ? 'coupons' : 'flash')
const keyword = ref('')
const couponType = ref<number>()
const couponTypes = [{ value: 0, label: '全场赠券' }, { value: 1, label: '会员赠券' }, { value: 2, label: '购物赠券' }, { value: 3, label: '注册赠券' }]
const flashRows = ref<FlashCampaign[]>([])
const couponRows = ref<Coupon[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const editingFlashStatus = ref(0)
const updatingId = ref<number | null>(null)
const today = new Date()
const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
function localInput(date: Date) { const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60000); return adjusted.toISOString().slice(0, 16) }
const flashForm = reactive({ title: '', startDate: localInput(today), endDate: localInput(nextMonth) })
const couponForm = reactive({ name: '', type: 0, platform: 0, count: 1000, amount: 10, perLimit: 1, minPoint: 0, startTime: localInput(today), endTime: localInput(nextMonth), useType: 0, note: '', memberLevel: 0 })
const activeCount = computed(() => flashRows.value.filter((row) => flashStatus(row).label === '进行中').length)
const endedCount = computed(() => flashRows.value.filter((row) => flashStatus(row).label === '已结束').length)
const receivedCount = computed(() => couponRows.value.reduce((sum, row) => sum + Number(row.receiveCount || 0), 0))
const usedCount = computed(() => couponRows.value.reduce((sum, row) => sum + Number(row.useCount || 0), 0))
function couponTypeName(type?: number) { return couponTypes.find((item) => item.value === Number(type))?.label || '优惠券' }
function flashStatus(row: FlashCampaign) {
  if (Number(row.status) !== 1) return { label: '已关闭', type: 'info' as const }
  const now = Date.now()
  const start = row.startDate ? new Date(row.startDate).getTime() : 0
  const end = row.endDate ? new Date(row.endDate).getTime() : 0
  if (end && now > end) return { label: '已结束', type: 'info' as const }
  if (start && now < start) return { label: '未开始', type: 'warning' as const }
  return { label: '进行中', type: 'success' as const }
}
function toIso(value: string) { return value ? new Date(value).toISOString() : '' }
async function load(page = pageNum.value) {
  pageNum.value = page
  loading.value = true
  try {
    if (activeTab.value === 'flash') {
      const result = await flashCampaigns({ keyword: keyword.value.trim() || undefined, pageNum: page, pageSize: pageSize.value })
      flashRows.value = result.list || []; total.value = Number(result.total) || 0
    } else {
      const result = await coupons({ name: keyword.value.trim() || undefined, type: couponType.value, pageNum: page, pageSize: pageSize.value })
      couponRows.value = result.list || []; total.value = Number(result.total) || 0
    }
  } finally { loading.value = false }
}
function changeTab(tab: string | number) {
  activeTab.value = String(tab); pageNum.value = 1
  router.replace({ path: '/marketing', query: { tab: activeTab.value } })
  load(1)
}
function search() { load(1) }
function reset() { keyword.value = ''; couponType.value = undefined; load(1) }
function openCreate() {
  editingId.value = null
  editingFlashStatus.value = 0
  if (activeTab.value === 'flash') Object.assign(flashForm, { title: '', startDate: localInput(today), endDate: localInput(nextMonth) })
  else Object.assign(couponForm, { name: '', type: 0, platform: 0, count: 1000, amount: 10, perLimit: 1, minPoint: 0, startTime: localInput(today), endTime: localInput(nextMonth), useType: 0, note: '', memberLevel: 0 })
  dialogVisible.value = true
}
function openEditFlash(row: FlashCampaign) {
  editingId.value = row.id
  editingFlashStatus.value = Number(row.status) || 0
  Object.assign(flashForm, { title: row.title || '', startDate: row.startDate ? localInput(new Date(row.startDate)) : '', endDate: row.endDate ? localInput(new Date(row.endDate)) : '' })
  dialogVisible.value = true
}
async function openEditCoupon(row: Coupon) {
  editingId.value = row.id
  saving.value = true
  try {
    const detail = await couponDetail(row.id)
    Object.assign(couponForm, { name: detail.name || '', type: Number(detail.type ?? 0), platform: Number(detail.platform ?? 0), count: Number(detail.publishCount ?? detail.count ?? 1), amount: Number(detail.amount ?? 0), perLimit: Number(detail.perLimit ?? 1), minPoint: Number(detail.minPoint ?? 0), startTime: detail.startTime ? localInput(new Date(detail.startTime)) : '', endTime: detail.endTime ? localInput(new Date(detail.endTime)) : '', useType: Number(detail.useType ?? 0), note: detail.note || '', memberLevel: Number(detail.memberLevel ?? 0) })
    dialogVisible.value = true
  } finally { saving.value = false }
}
async function submitCreate() {
  if (activeTab.value === 'flash') {
    if (!flashForm.title.trim()) return ElMessage.warning('请填写活动名称')
    if (!flashForm.startDate || !flashForm.endDate) return ElMessage.warning('请填写完整的活动时间')
    if (new Date(flashForm.endDate) <= new Date(flashForm.startDate)) return ElMessage.warning('结束时间需要晚于开始时间')
  } else {
    if (!couponForm.name.trim()) return ElMessage.warning('请填写优惠券名称')
    if (!couponForm.startTime || !couponForm.endTime) return ElMessage.warning('请填写完整的领取时间')
    if (new Date(couponForm.endTime) <= new Date(couponForm.startTime)) return ElMessage.warning('结束时间需要晚于开始时间')
  }
  saving.value = true
  try {
    if (activeTab.value === 'flash') {
      const payload = { title: flashForm.title.trim(), startDate: toIso(flashForm.startDate), endDate: toIso(flashForm.endDate), status: editingId.value ? editingFlashStatus.value : 0 }
      if (editingId.value) await updateFlashCampaign(editingId.value, payload)
      else await createFlashCampaign(payload)
    } else {
      const payload = { ...couponForm, name: couponForm.name.trim(), startTime: toIso(couponForm.startTime), endTime: toIso(couponForm.endTime), publishCount: couponForm.count }
      if (editingId.value) await updateCoupon(editingId.value, payload)
      else await createCoupon(payload)
    }
    ElMessage.success(`${activeTab.value === 'flash' ? '秒杀活动' : '优惠券'}已${editingId.value ? '更新' : '创建'}`)
    dialogVisible.value = false
    await load(1)
  } finally { saving.value = false }
}
async function changeFlashStatus(row: FlashCampaign, status: number) {
  updatingId.value = row.id
  try {
    await ElMessageBox.confirm(`确认${status === 1 ? '开启' : '关闭'}“${row.title || '该秒杀活动'}”吗？`, '活动状态', { type: 'warning', confirmButtonText: '确认', cancelButtonText: '取消' })
    await updateFlashStatus(row.id, status)
    ElMessage.success(`活动已${status === 1 ? '开启' : '关闭'}`)
    await load()
  } catch { /* 取消时保留服务端状态 */ } finally { updatingId.value = null }
}
async function removeFlash(row: FlashCampaign) {
  try { await ElMessageBox.confirm(`删除“${row.title || '该秒杀活动'}”？`, '删除活动', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }); await deleteFlashCampaign(row.id); ElMessage.success('活动已删除'); await load() } catch { /* 用户取消 */ }
}
async function removeCoupon(row: Coupon) {
  try { await ElMessageBox.confirm(`删除优惠券“${row.name || '未命名优惠券'}”？`, '删除优惠券', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }); await deleteCoupon(row.id); ElMessage.success('优惠券已删除'); await load() } catch { /* 用户取消 */ }
}
watch(() => route.query.tab, (tab) => {
  const next = tab === 'coupons' ? 'coupons' : 'flash'
  if (next !== activeTab.value) { activeTab.value = next; load(1) }
}, { immediate: true })
</script>
