<template>
  <div class="page-stack">
    <div class="page-heading"><div><h1>商品管理</h1><p>维护商品资料、销售状态和库存，及时跟进经营变化。</p></div><div class="heading-actions"><el-button :icon="Refresh" :loading="loading" @click="load">刷新商品</el-button><el-button type="primary" :icon="Plus" @click="router.push('/products/create')">新增商品</el-button></div></div>
    <div class="product-stats"><div><span>商品总数</span><b>{{ total.toLocaleString() }}</b></div><div><span>本页在售</span><b>{{ summary.live.toLocaleString() }}</b></div><div><span>本页已下架</span><b>{{ summary.offline.toLocaleString() }}</b></div><div class="stock-alert"><span>本页库存偏低 ≤ 10</span><b>{{ summary.lowStock.toLocaleString() }}</b></div></div>
    <section class="surface table-surface">
      <div class="filter-bar">
        <el-form inline @submit.prevent="search">
          <el-form-item label="商品名称"><el-input v-model="keyword" clearable placeholder="输入商品名称或关键词" :prefix-icon="Search" @keyup.enter="search" /></el-form-item>
          <el-form-item label="销售状态"><el-select v-model="statusFilter" clearable placeholder="全部状态" style="width: 130px" @change="search"><el-option label="出售中" :value="1" /><el-option label="已下架" :value="0" /></el-select></el-form-item>
          <el-form-item><el-checkbox v-model="lowStockOnly" @change="search">只看低库存</el-checkbox></el-form-item>
          <el-form-item><el-button type="primary" :icon="Search" @click="search">查询</el-button><el-button :icon="RefreshLeft" @click="reset">重置</el-button></el-form-item>
        </el-form>
      </div>
      <div class="list-meta"><b>商品列表</b><span>共 {{ total.toLocaleString() }} 件</span></div>
      <div v-if="selectedRows.length" class="batch-toolbar"><span>已选 <b>{{ selectedRows.length }}</b> 件商品</span><el-button size="small" type="primary" plain :loading="batching" @click="batchStatus(1)">批量上架</el-button><el-button size="small" type="danger" plain :loading="batching" @click="batchStatus(0)">批量下架</el-button><el-button size="small" text @click="clearSelection">取消选择</el-button></div>
      <el-table v-loading="loading" :data="rows" row-key="id" class="merchant-table" table-layout="auto" @selection-change="(selection: ProductRow[]) => selectedRows = selection">
        <el-table-column type="selection" width="48" :selectable="() => !batching" />
        <el-table-column label="商品信息" min-width="300"><template #default="{ row }"><div class="product-info"><el-image class="product-thumb" :src="row.pic || row.productPic || ''" :alt="`${productName(row)}图片`" fit="cover"><template #error><span class="thumb-empty"><el-icon><Picture /></el-icon></span></template></el-image><div class="product-detail"><b>{{ productName(row) }}</b><small>商品编号：{{ row.id }}</small></div></div></template></el-table-column>
        <el-table-column label="分类 / 品牌" min-width="150"><template #default="{ row }"><span>{{ row.productCategoryName || '未分类' }}</span><small class="table-subline">{{ row.brandName || '未设置品牌' }}</small></template></el-table-column>
        <el-table-column label="售价" width="125" align="right"><template #default="{ row }"><b class="price-text">¥ {{ money(row.price) }}</b></template></el-table-column>
        <el-table-column label="销量" width="100" align="right"><template #default="{ row }">{{ Number(row.sale ?? row.saleCount ?? 0).toLocaleString() }}</template></el-table-column>
        <el-table-column label="库存" width="105" align="right"><template #default="{ row }"><span :class="{ 'low-stock': row.stock != null && Number(row.stock) <= 10 }">{{ row.stock == null ? '—' : Number(row.stock).toLocaleString() }}</span></template></el-table-column>
        <el-table-column label="销售状态" width="145"><template #default="{ row }"><div class="publish-control"><el-switch :model-value="Number(row.publishStatus)" :active-value="1" :inactive-value="0" :loading="row._updating" :aria-label="`${productName(row)}销售状态`" @change="(value: string | number | boolean) => changeStatus(row, Number(value))" /><span>{{ Number(row.publishStatus) === 1 ? '出售中' : '已下架' }}</span></div></template></el-table-column>
        <el-table-column label="操作" width="100" fixed="right"><template #default="{ row }"><el-button link type="primary" @click="router.push(`/products/edit/${row.id}`)">编辑</el-button></template></el-table-column>
        <template #empty><el-empty description="没有找到符合条件的商品" :image-size="80" /></template>
      </el-table>
      <div class="pagination-wrap"><el-pagination v-model:current-page="pageNum" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next, jumper" @change="load" /></div>
    </section>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Picture, Plus, Refresh, RefreshLeft, Search } from '@element-plus/icons-vue'
import { money, products, publishProducts, type Product } from '../api'
type ProductRow = Product & { _updating?: boolean }
const route = useRoute()
const router = useRouter()
const rows = ref<ProductRow[]>([])
const selectedRows = ref<ProductRow[]>([])
const keyword = ref('')
const statusFilter = ref<number>()
const lowStockOnly = ref(false)
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(false)
const batching = ref(false)
const summaryRows = ref<Product[]>([])
const summary = computed(() => ({ live: summaryRows.value.filter((row) => Number(row.publishStatus) === 1).length, offline: summaryRows.value.filter((row) => Number(row.publishStatus) !== 1).length, lowStock: summaryRows.value.filter((row) => row.stock != null && Number(row.stock) <= 10).length }))
function productName(row: Product) { return row.name || row.productName || row.title || '未命名商品' }
async function load(page = pageNum.value) {
  pageNum.value = page; loading.value = true
  try {
    if (lowStockOnly.value) {
      const result = await products({ pageNum: 1, pageSize: 500, keyword: keyword.value.trim() || undefined, publishStatus: statusFilter.value })
      const lowRows = ((result.list || []) as ProductRow[]).filter((item) => item.stock != null && Number(item.stock) <= 10)
      total.value = lowRows.length
      rows.value = lowRows.slice((page - 1) * pageSize.value, page * pageSize.value)
    } else {
      const result = await products({ pageNum: page, pageSize: pageSize.value, keyword: keyword.value.trim() || undefined, publishStatus: statusFilter.value })
      rows.value = (result.list || []) as ProductRow[]; total.value = Number(result.total) || 0
      if (page === 1 && !keyword.value && statusFilter.value == null) summaryRows.value = rows.value
    }
  } finally { loading.value = false }
}
function search() { load(1) }
function reset() { keyword.value = ''; statusFilter.value = undefined; lowStockOnly.value = false; load(1) }
function clearSelection() { selectedRows.value = [] }
async function batchStatus(next: number) {
  const targets = selectedRows.value.filter((row) => Number(row.publishStatus) !== next)
  if (!targets.length) return ElMessage.info(next === 1 ? '所选商品均已在售' : '所选商品均已下架')
  try {
    await ElMessageBox.confirm(`将所选 ${targets.length} 件商品${next === 1 ? '批量上架' : '批量下架'}？`, '批量修改商品状态', { type: 'warning', confirmButtonText: '确认操作', cancelButtonText: '取消' })
  } catch { return }
  batching.value = true
  try {
    await publishProducts(targets.map((row) => row.id), next)
    ElMessage.success(`已${next === 1 ? '上架' : '下架'} ${targets.length} 件商品`)
    clearSelection()
    await load()
  } finally { batching.value = false }
}
async function changeStatus(row: ProductRow, next: number) {
  row._updating = true
  try {
    await ElMessageBox.confirm(`确认将“${productName(row)}”${next === 1 ? '上架销售' : '下架'}吗？`, '商品销售状态', { type: 'warning', confirmButtonText: '确认', cancelButtonText: '取消' })
    await publishProducts([row.id], next)
    row.publishStatus = next
    ElMessage.success('商品状态已更新')
    await load()
  } catch { /* 取消时维持服务端状态 */ } finally { row._updating = false }
}
watch(() => [route.query.status, route.query.stock], ([status, stock]) => {
  statusFilter.value = status === '0' || status === '1' ? Number(status) : undefined
  lowStockOnly.value = stock === 'low'
  if (stock === 'low') keyword.value = ''
  load(1)
}, { immediate: true })
</script>
