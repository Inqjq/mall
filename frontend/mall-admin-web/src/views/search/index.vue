<template>
  <div class="page-stack">
  <PageHeader title="搜索验证" />
  <el-card shadow="never">
    <el-form inline class="search-form" @submit.prevent="handleSearch">
      <el-form-item label="搜索词">
        <el-input v-model="keyword" placeholder="输入商品名称" clearable style="width: 240px" @keyup.enter="handleSearch" />
      </el-form-item>
      <el-form-item label="排序方式">
        <el-select v-model="sort" style="width: 165px">
          <el-option label="综合排序" :value="0" />
          <el-option label="上新优先" :value="1" />
          <el-option label="销量从高到低" :value="2" />
          <el-option label="价格从低到高" :value="3" />
          <el-option label="价格从高到低" :value="4" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button :loading="importing" @click="handleImport">导入商品索引</el-button>
      </el-form-item>
    </el-form>
    <div class="result-count">共 {{ total.toLocaleString() }} 条搜索结果</div>
    <el-table v-loading="loading" :data="list">
      <el-table-column label="图片" width="90">
        <template #default="{ row }">
          <el-image :src="row.pic" :alt="`${row.name || '商品'}图片`" fit="cover" style="width: 56px; height: 56px" />
        </template>
      </el-table-column>
      <el-table-column prop="name" label="商品名称" min-width="200" show-overflow-tooltip />
      <el-table-column prop="subTitle" label="副标题" min-width="160" show-overflow-tooltip />
      <el-table-column prop="brandName" label="品牌" width="110" />
      <el-table-column prop="productCategoryName" label="分类" width="120" />
      <el-table-column label="价格" width="100">
        <template #default="{ row }">{{ row.price?.toFixed(2) }}</template>
      </el-table-column>
      <el-table-column prop="saleCount" label="销量" width="90" />
    </el-table>
    <el-pagination
      v-model:current-page="pageNum"
      v-model:page-size="pageSize"
      :total="total"
      layout="total, prev, pager, next"
      style="margin-top: 16px; justify-content: flex-end"
      @change="fetchList"
    />
  </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import { complexSearch, importAllProducts } from '@/api/search'
import type { EsProduct } from '@/types/api'

const keyword = ref('')
const sort = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(false)
const importing = ref(false)
const list = ref<EsProduct[]>([])

async function fetchList() {
  loading.value = true
  try {
    const page = await complexSearch({
      keyword: keyword.value || undefined,
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      sort: sort.value,
    })
    list.value = page.list || []
    total.value = Number(page.total) || 0
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pageNum.value = 1
  fetchList()
}

async function handleImport() {
  await ElMessageBox.confirm('将数据库全部商品导入 ES，数据量大时较慢，确定继续？', '提示', { type: 'warning' })
  importing.value = true
  try {
    const count = await importAllProducts()
    ElMessage.success(`导入成功，共 ${count} 条`)
    fetchList()
  } finally {
    importing.value = false
  }
}

onMounted(fetchList)
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 18px;
}
.search-form { display: flex; flex-wrap: wrap; padding-bottom: 4px; border-bottom: 1px solid #edf0f4; }
.search-form :deep(.el-form-item) { margin-bottom: 12px; }
.result-count { padding: 12px 0; color: #77818e; font-size: 12px; }
@media (max-width: 560px) {
  .search-form { display: block; }
  .search-form :deep(.el-form-item) { display: flex; }
  .search-form :deep(.el-form-item__content) { flex: 1; }
  .search-form :deep(.el-form-item__content > .el-input), .search-form :deep(.el-form-item__content > .el-select) { width: 100% !important; }
}
</style>
