<template>
  <div class="page-stack">
  <PageHeader title="系统用户" />
  <ProTable :columns="columns" :fetch="fetchPage" :search-fields="searchFields">
    <template #status="{ row }">
      <el-tag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
    </template>
  </ProTable>
  </div>
</template>

<script setup lang="ts">
import ProTable from '@/components/ProTable/index.vue'
import PageHeader from '@/components/PageHeader.vue'
import type { ProTableColumn, SearchField } from '@/components/ProTable/index.vue'
import { getAdminList } from '@/api/admin'
import { formatDateTime } from '@/utils/format'

const searchFields: SearchField[] = [{ prop: 'keyword', label: '用户名', component: 'input', placeholder: '用户名' }]

const columns: ProTableColumn[] = [
  { prop: 'id', label: '编号', width: 80 },
  { prop: 'username', label: '用户名', width: 140 },
  { prop: 'nickName', label: '昵称', width: 140 },
  { prop: 'email', label: '邮箱', minWidth: 180 },
  { prop: 'note', label: '备注', minWidth: 160, showOverflowTooltip: true },
  { prop: 'status', label: '状态', width: 100, slot: true },
  { prop: 'createTime', label: '创建时间', minWidth: 180, format: formatDateTime },
]

function fetchPage(params: Record<string, unknown>) {
  return getAdminList({
    pageNum: params.pageNum as number,
    pageSize: params.pageSize as number,
    keyword: (params.keyword as string) || undefined,
  })
}
</script>
