<template>
  <div class="page-stack">
    <PageHeader title="商品列表" description="查看商品信息、库存和销售状态">
      <el-button v-permission="'addProduct'" type="primary" :icon="Plus" @click="router.push('/product/create')">新增商品</el-button>
    </PageHeader>

    <el-card class="product-list-card" shadow="never">
      <el-form inline class="search-form" @submit.prevent="loadProducts(1)">
        <el-form-item label="关键词">
          <el-input v-model="keyword" clearable placeholder="商品名称" @keyup.enter="loadProducts(1)" />
        </el-form-item>
        <el-form-item class="search-actions">
          <el-button type="primary" :icon="Search" @click="loadProducts(1)">查询</el-button>
          <el-button :icon="RefreshLeft" @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="table-meta"><span>商品列表</span><span>共 {{ total.toLocaleString() }} 件商品</span></div>
      <el-table v-loading="loading" :data="products" row-key="id" class="product-table" table-layout="auto">
        <el-table-column label="商品信息" min-width="300">
          <template #default="{ row }">
            <div class="product-info">
              <el-image class="product-image" :src="imageOf(row)" :alt="`${nameOf(row)}图片`" :preview-src-list="imageOf(row) ? [imageOf(row)] : []" fit="cover" preview-teleported>
                <template #error><div class="image-placeholder"><el-icon><Picture /></el-icon></div></template>
                <template #placeholder><div class="image-placeholder"><el-icon><Picture /></el-icon></div></template>
              </el-image>
              <div class="product-copy">
                <div class="product-name">{{ nameOf(row) }}</div>
                <div class="product-id">商品编号：{{ row.id ?? '—' }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="品牌" min-width="130">
          <template #default="{ row }">{{ row.brandName || row.brand?.name || '—' }}</template>
        </el-table-column>
        <el-table-column label="售价" width="140" align="right">
          <template #default="{ row }"><span class="price">¥ {{ moneyOf(row) }}</span></template>
        </el-table-column>
        <el-table-column label="销量" width="110" align="right">
          <template #default="{ row }">{{ numberOf(row.sale ?? row.saleCount) }}</template>
        </el-table-column>
        <el-table-column label="库存" width="110" align="right">
          <template #default="{ row }">{{ numberOf(row.stock) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <div class="publish-cell">
              <el-switch
                v-permission="'product'"
                :model-value="Number(row.publishStatus)"
                :active-value="1"
                :inactive-value="0"
                :loading="row._updating"
                :aria-label="`${nameOf(row)}上架状态`"
                @change="(value: string | number | boolean) => handlePublishChange(row, Number(value))"
              />
              <span>{{ Number(row.publishStatus) === 1 ? '已上架' : '已下架' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="router.push(`/product/edit/${row.id}`)">编辑</el-button>
          </template>
        </el-table-column>
        <template #empty><el-empty description="没有找到商品" :image-size="72" /></template>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="pageNum"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @change="loadProducts()"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Picture, RefreshLeft, Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import { getProductList, updateProductPublishStatus } from '@/api/product'
import type { PmsProduct } from '@/types/api'

type ProductRow = PmsProduct & {
  productName?: string
  title?: string
  productPic?: string
  brand?: { name?: string }
  stock?: number
  saleCount?: number
  _updating?: boolean
}

const router = useRouter()
const products = ref<ProductRow[]>([])
const keyword = ref('')
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(false)

function nameOf(row: ProductRow): string {
  return row.name || row.productName || row.title || '未命名商品'
}
function imageOf(row: ProductRow): string {
  return row.pic || row.productPic || ''
}
function moneyOf(row: ProductRow): string {
  const amount = Number(row.price)
  return Number.isFinite(amount) ? amount.toFixed(2) : '0.00'
}
function numberOf(value: unknown): string {
  const count = Number(value)
  return Number.isFinite(count) ? count.toLocaleString() : '—'
}

async function loadProducts(page = pageNum.value) {
  pageNum.value = page
  loading.value = true
  try {
    const result = await getProductList({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      keyword: keyword.value.trim() || undefined,
    })
    products.value = (result.list || []) as ProductRow[]
    total.value = Number(result.total) || 0
  } finally {
    loading.value = false
  }
}

function resetSearch() {
  keyword.value = ''
  loadProducts(1)
}

async function handlePublishChange(row: ProductRow, publishStatus: number) {
  row._updating = true
  try {
    await ElMessageBox.confirm(`确认${publishStatus === 1 ? '上架' : '下架'}“${nameOf(row)}”吗？`, '商品状态', {
      type: 'warning', confirmButtonText: '确认', cancelButtonText: '取消',
    })
    await updateProductPublishStatus([row.id], publishStatus)
    row.publishStatus = publishStatus
    ElMessage.success('状态已更新')
  } catch {
    // 取消操作保持商品当前状态；接口错误由请求层提示。
  } finally {
    row._updating = false
  }
}

onMounted(() => loadProducts(1))
</script>

<style scoped>
.product-list-card :deep(.el-card__body) { padding: 16px 18px; }
.search-form { display: flex; align-items: flex-start; flex-wrap: wrap; margin-bottom: 4px; padding-bottom: 3px; border-bottom: 1px solid #edf0f4; }
.search-form :deep(.el-form-item) { margin-right: 18px; margin-bottom: 12px; }
.search-form :deep(.el-input) { width: 260px; }
.search-form :deep(.el-form-item__label) { color: #535f6f; }
.search-actions :deep(.el-form-item__content) { gap: 8px; }
.table-meta { display: flex; min-height: 42px; align-items: center; justify-content: space-between; color: #77818e; font-size: 12px; }
.table-meta span:first-child { color: #364252; font-size: 13px; font-weight: 600; }
.product-table { width: 100%; }
.product-info { display: flex; min-width: 0; align-items: center; gap: 12px; }
.product-image, .image-placeholder { display: grid; width: 52px; height: 52px; flex: 0 0 52px; place-items: center; overflow: hidden; border: 1px solid #e5e9ef; border-radius: 4px; background: #f5f6f8; color: #9aa4b0; }
.image-placeholder { font-size: 18px; }
.product-copy { min-width: 0; }
.product-name { overflow: hidden; color: #303946; text-overflow: ellipsis; white-space: nowrap; }
.product-id { margin-top: 4px; color: #8a94a1; font-size: 12px; }
.price { color: #374454; font-variant-numeric: tabular-nums; }
.publish-cell { display: flex; align-items: center; gap: 8px; color: #697483; font-size: 12px; }
.pagination-wrap { display: flex; justify-content: flex-end; padding-top: 16px; }
@media (max-width: 600px) {
  .product-list-card :deep(.el-card__body) { padding: 12px; }
  .search-form { display: block; }
  .search-form :deep(.el-form-item) { display: flex; margin-right: 0; }
  .search-form :deep(.el-form-item__content) { flex: 1; }
  .search-form :deep(.el-input) { width: 100%; }
  .pagination-wrap { justify-content: flex-start; overflow-x: auto; }
}
</style>
