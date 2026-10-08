<template>
  <el-card class="table-card" shadow="never">
    <el-form v-if="searchFields.length" inline class="search-form" @submit.prevent="handleSearch">
      <el-form-item v-for="field in searchFields" :key="field.prop" :label="field.label">
        <el-select
          v-if="field.component === 'select'"
          v-model="query[field.prop]"
          :placeholder="field.placeholder || '请选择'"
          clearable
          :style="{ width: (field.width || 180) + 'px' }"
          @change="handleSearch"
        >
          <el-option v-for="option in field.options" :key="String(option.value)" :label="option.label" :value="option.value" />
        </el-select>
        <el-input
          v-else
          v-model="query[field.prop]"
          :placeholder="field.placeholder || '请输入'"
          clearable
          :style="{ width: (field.width || 220) + 'px' }"
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item class="search-actions">
        <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
        <el-button :icon="RefreshLeft" @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <div class="table-actions">
      <span class="record-count">共 {{ total.toLocaleString() }} 条</span>
      <div v-if="$slots.toolbar" class="toolbar"><slot name="toolbar" /></div>
    </div>

    <el-table v-loading="loading" :data="list" :row-key="rowKey" class="data-table">
      <el-table-column
        v-for="column in columns"
        :key="column.prop || column.label"
        :prop="column.prop"
        :label="column.label"
        :width="column.width"
        :min-width="column.minWidth"
        :fixed="column.fixed"
        :align="column.align"
        :show-overflow-tooltip="column.showOverflowTooltip"
      >
        <template #default="{ row }">
          <slot v-if="column.slot" :name="column.prop" :row="row">{{ row?.[column.prop ?? ''] ?? '—' }}</slot>
          <span v-else>{{ column.format ? column.format(row?.[column.prop ?? ''], row) : column.prop ? (row?.[column.prop] ?? '—') : '—' }}</span>
        </template>
      </el-table-column>
      <template #empty><el-empty description="暂无数据" :image-size="72" /></template>
    </el-table>

    <div class="pagination-wrap">
      <el-pagination
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @change="load"
      />
    </div>
  </el-card>
</template>

<script lang="ts">
import type { CommonPage } from '@/types/api'
export interface ProTableColumn {
  prop?: string
  label: string
  width?: number | string
  minWidth?: number | string
  slot?: boolean
  fixed?: 'left' | 'right'
  align?: 'left' | 'center' | 'right'
  showOverflowTooltip?: boolean
  format?: (value: unknown, row: Record<string, any>) => string
}
export interface SearchField {
  prop: string
  label: string
  component: 'input' | 'select'
  placeholder?: string
  options?: { label: string; value: string | number }[]
  width?: number
}
export type ProTableFetch = (params: Record<string, unknown>) => Promise<CommonPage>
</script>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { RefreshLeft, Search } from '@element-plus/icons-vue'
const props = withDefaults(defineProps<{
  columns: ProTableColumn[]
  fetch: ProTableFetch
  searchFields?: SearchField[]
  initParams?: Record<string, unknown>
  initialSearch?: Record<string, string | number | null>
  rowKey?: string
  immediate?: boolean
}>(), { searchFields: () => [], initParams: () => ({}), initialSearch: () => ({}), rowKey: undefined, immediate: true })

const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(false)
const list = ref<Record<string, any>[]>([])
const query = reactive<Record<string, string | number | null>>({})
for (const field of props.searchFields) query[field.prop] = props.initialSearch[field.prop] ?? (field.component === 'select' ? null : '')

async function load() {
  loading.value = true
  try {
    const params: Record<string, unknown> = { pageNum: pageNum.value, pageSize: pageSize.value, ...props.initParams }
    for (const [key, value] of Object.entries(query)) if (value !== '' && value !== null) params[key] = value
    const page = await props.fetch(params)
    list.value = (page.list as Record<string, any>[]) || []
    total.value = Number(page.total) || 0
  } finally { loading.value = false }
}
function handleSearch() { pageNum.value = 1; load() }
function handleReset() {
  for (const field of props.searchFields) query[field.prop] = field.component === 'select' ? null : ''
  handleSearch()
}
function refresh() { load() }
defineExpose({ refresh })
onMounted(() => { if (props.immediate) load() })
watch(() => props.initialSearch, (values) => {
  for (const field of props.searchFields) query[field.prop] = values[field.prop] ?? (field.component === 'select' ? null : '')
  pageNum.value = 1
  load()
}, { deep: true })
watch(() => props.initParams, () => {
  pageNum.value = 1
  load()
}, { deep: true })
</script>

<style scoped>
.table-card :deep(.el-card__body) { padding: 16px 18px; }
.search-form { display: flex; align-items: flex-start; flex-wrap: wrap; margin-bottom: 4px; padding-bottom: 3px; border-bottom: 1px solid #edf0f4; }
.search-form :deep(.el-form-item) { margin-right: 18px; margin-bottom: 12px; }
.search-form :deep(.el-form-item__label) { color: #535f6f; }
.search-actions :deep(.el-form-item__content) { gap: 8px; }
.table-actions { display: flex; min-height: 42px; align-items: center; justify-content: space-between; gap: 12px; }
.record-count { color: #77818e; font-size: 12px; }
.toolbar { display: flex; flex-wrap: wrap; gap: 8px; }
.data-table { width: 100%; }
.pagination-wrap { display: flex; justify-content: flex-end; padding-top: 16px; }
@media (max-width: 560px) {
  .table-card :deep(.el-card__body) { padding: 12px; }
  .search-form { display: block; }
  .search-form :deep(.el-form-item) { display: flex; margin-right: 0; }
  .search-form :deep(.el-form-item__content) { flex: 1; }
  .search-form :deep(.el-form-item__content > .el-input), .search-form :deep(.el-form-item__content > .el-select) { width: 100% !important; }
  .pagination-wrap { justify-content: flex-start; overflow-x: auto; }
}
</style>
