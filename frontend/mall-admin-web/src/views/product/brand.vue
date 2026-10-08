<template>
  <div class="page-stack">
  <PageHeader title="品牌管理" />
  <ProTable ref="tableRef" :columns="columns" :fetch="fetchPage" :search-fields="searchFields">
    <template #logo="{ row }">
      <el-image :src="row.logo" :alt="`${row.name || '品牌'}标志`" fit="cover" style="width: 48px; height: 48px" />
    </template>
    <template #factoryStatus="{ row }">
      <el-tag :type="row.factoryStatus === 1 ? 'success' : 'info'" effect="plain">{{ row.factoryStatus === 1 ? '是' : '否' }}</el-tag>
    </template>
    <template #showStatus="{ row }">
      <el-switch :model-value="Number(row.showStatus)" :active-value="1" :inactive-value="0" :aria-label="`${row.name}前台显示状态`" @change="(value: string | number | boolean) => changeShowStatus(row, Number(value))" />
    </template>
    <template #action="{ row }">
      <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
      <el-popconfirm title="确定删除该品牌吗？" @confirm="handleDelete(row.id)"><template #reference><el-button link type="danger">删除</el-button></template></el-popconfirm>
    </template>
    <template #toolbar><el-button type="primary" :icon="Plus" @click="openCreate">新增品牌</el-button></template>
  </ProTable>

  <el-dialog v-model="dialogVisible" :title="editingId ? '编辑品牌' : '新增品牌'" width="600px" destroy-on-close>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="品牌名称" prop="name"><el-input v-model="form.name" maxlength="100" show-word-limit placeholder="请输入品牌名称" /></el-form-item>
      <el-form-item label="品牌 LOGO" prop="logo"><ImageUpload v-model="form.logo" label="品牌 LOGO" /></el-form-item>
      <el-form-item label="品牌大图"><ImageUpload v-model="form.bigPic" label="品牌大图" /></el-form-item>
      <el-form-item label="品牌首字母"><el-input v-model="form.firstLetter" maxlength="1" placeholder="如：A" /></el-form-item>
      <el-form-item label="列表排序"><el-input-number v-model="form.sort" :min="0" /></el-form-item>
      <el-form-item label="厂家品牌"><el-switch v-model="form.factoryStatus" :active-value="1" :inactive-value="0" active-text="是" inactive-text="否" /></el-form-item>
      <el-form-item label="前台显示"><el-switch v-model="form.showStatus" :active-value="1" :inactive-value="0" active-text="显示" inactive-text="隐藏" /></el-form-item>
      <el-form-item label="品牌故事"><el-input v-model="form.brandStory" type="textarea" :rows="3" maxlength="1000" show-word-limit /></el-form-item>
    </el-form>
    <template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" :loading="saving" @click="submit">保存</el-button></template>
  </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import ProTable from '@/components/ProTable/index.vue'
import PageHeader from '@/components/PageHeader.vue'
import ImageUpload from '@/components/ImageUpload.vue'
import type { ProTableColumn, SearchField } from '@/components/ProTable/index.vue'
import { createBrand, deleteBrand, getBrandList, updateBrand, updateBrandShowStatus, type PmsBrandParam } from '@/api/product'

const tableRef = ref<{ refresh: () => void }>()
const formRef = ref<FormInstance>()
const dialogVisible = ref(false)
const saving = ref(false)
const editingId = ref<number>()
const form = reactive<PmsBrandParam & { bigPic: string }>({ name: '', logo: '', firstLetter: '', sort: 0, factoryStatus: 0, showStatus: 1, bigPic: '', brandStory: '' })
const rules: FormRules = {
  name: [{ required: true, message: '请输入品牌名称', trigger: 'blur' }],
  logo: [{ required: true, message: '请上传品牌 LOGO 图片', trigger: 'change' }],
}

const searchFields: SearchField[] = [{ prop: 'keyword', label: '品牌名称', component: 'input', placeholder: '品牌名称' }]

const columns: ProTableColumn[] = [
  { prop: 'id', label: '编号', width: 80 },
  { prop: 'logo', label: '品牌LOGO', width: 90, slot: true },
  { prop: 'name', label: '品牌名称', minWidth: 140 },
  { prop: 'productCount', label: '商品数', width: 90 },
  { prop: 'factoryStatus', label: '制造商', width: 90, slot: true },
  { prop: 'showStatus', label: '显示', width: 90, slot: true },
  { prop: 'action', label: '操作', width: 100, fixed: 'right', slot: true },
]

function fetchPage(params: Record<string, unknown>) {
  return getBrandList({
    pageNum: params.pageNum as number,
    pageSize: params.pageSize as number,
    keyword: (params.keyword as string) || undefined,
  })
}

async function handleDelete(id: number) {
  await deleteBrand(id)
  ElMessage.success('删除成功')
  tableRef.value?.refresh()
}

function resetForm() {
  Object.assign(form, { name: '', logo: '', firstLetter: '', sort: 0, factoryStatus: 0, showStatus: 1, bigPic: '', brandStory: '' })
}
function openCreate() {
  editingId.value = undefined
  resetForm()
  dialogVisible.value = true
}
function openEdit(row: Record<string, any>) {
  editingId.value = Number(row.id)
  Object.assign(form, { name: row.name || '', logo: row.logo || '', firstLetter: row.firstLetter || '', sort: row.sort ?? 0, factoryStatus: Number(row.factoryStatus) || 0, showStatus: Number(row.showStatus) || 0, bigPic: row.bigPic || '', brandStory: row.brandStory || '' })
  dialogVisible.value = true
}
async function submit() {
  if (!await formRef.value?.validate().catch(() => false)) return
  saving.value = true
  try {
    if (editingId.value) await updateBrand(editingId.value, { ...form })
    else await createBrand({ ...form })
    ElMessage.success(editingId.value ? '品牌资料已更新' : '品牌已创建')
    dialogVisible.value = false
    tableRef.value?.refresh()
  } finally { saving.value = false }
}
async function changeShowStatus(row: Record<string, any>, status: number) {
  try {
    await ElMessageBox.confirm(`确认${status ? '在前台显示' : '从前台隐藏'}“${row.name}”吗？`, '品牌显示状态', { type: 'warning', confirmButtonText: '确认', cancelButtonText: '取消' })
    await updateBrandShowStatus([Number(row.id)], status)
    row.showStatus = status
    ElMessage.success('品牌显示状态已更新')
  } catch { tableRef.value?.refresh() }
}
</script>
