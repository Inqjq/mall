<template>
  <div class="page-stack category-page">
    <PageHeader title="商品分类" description="维护商城类目结构、展示状态与导航入口">
      <el-button :icon="Refresh" :loading="loading" @click="loadCategories">刷新</el-button>
      <el-button v-permission="'productCate'" type="primary" :icon="Plus" @click="openCreate(0)">新增一级分类</el-button>
    </PageHeader>

    <div class="summary-grid">
      <div class="summary-card">
        <span class="summary-icon summary-icon--blue"><el-icon><Folder /></el-icon></span>
        <span><small>分类总数</small><strong>{{ categoryCount }}</strong></span>
      </div>
      <div class="summary-card">
        <span class="summary-icon summary-icon--violet"><el-icon><FolderOpened /></el-icon></span>
        <span><small>一级分类</small><strong>{{ categoryTree.length }}</strong></span>
      </div>
      <div class="summary-card">
        <span class="summary-icon summary-icon--cyan"><el-icon><Connection /></el-icon></span>
        <span><small>二级分类</small><strong>{{ childCount }}</strong></span>
      </div>
      <div class="summary-card">
        <span class="summary-icon summary-icon--green"><el-icon><View /></el-icon></span>
        <span><small>前台展示中</small><strong>{{ visibleCount }}</strong></span>
      </div>
    </div>

    <el-card class="category-card" shadow="never">
      <div class="category-toolbar">
        <div class="toolbar-heading"><h2>分类目录</h2><span>共 {{ filteredCategories.length }} 个结果</span></div>
        <div class="toolbar-filters">
          <el-input v-model="keyword" :prefix-icon="Search" clearable placeholder="搜索分类名称" />
          <el-radio-group v-model="levelFilter" size="default" aria-label="筛选分类层级">
            <el-radio-button value="all">全部</el-radio-button>
            <el-radio-button value="0">一级</el-radio-button>
            <el-radio-button value="1">二级</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <el-table v-loading="loading" :data="filteredCategories" row-key="id" class="category-table" table-layout="fixed">
        <el-table-column label="分类名称" min-width="320">
          <template #default="{ row }">
            <div class="category-name-cell" :class="{ 'category-name-cell--child': row.depth > 0 }">
              <span v-if="row.depth > 0" class="tree-branch" aria-hidden="true">└</span>
              <span class="category-name-icon"><el-icon><Folder v-if="row.depth === 0" /><Document v-else /></el-icon></span>
              <span class="category-name-copy"><strong>{{ row.name }}</strong><small>{{ row.depth === 0 ? '一级分类' : `上级分类：${row.parentName}` }}</small></span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="id" label="分类编号" min-width="125" />
        <el-table-column label="商品数" min-width="125" align="right">
          <template #default="{ row }">{{ Number(row.productCount || 0).toLocaleString() }}</template>
        </el-table-column>
        <el-table-column label="排序" min-width="100" align="right">
          <template #default="{ row }">{{ row.sort ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="前台显示" min-width="145">
          <template #default="{ row }">
            <div class="status-control">
              <el-switch v-permission="'productCate'" :model-value="Number(row.showStatus)" :active-value="1" :inactive-value="0" :loading="row._updatingShow" :aria-label="`${row.name}前台显示状态`" @change="(value: string | number | boolean) => updateShowStatus(row, Number(value))" />
              <span>{{ Number(row.showStatus) === 1 ? '显示' : '隐藏' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="导航栏" min-width="135">
          <template #default="{ row }">
            <div class="status-control">
              <el-switch v-permission="'productCate'" :model-value="Number(row.navStatus)" :active-value="1" :inactive-value="0" :loading="row._updatingNav" :aria-label="`${row.name}导航状态`" @change="(value: string | number | boolean) => updateNavStatus(row, Number(value))" />
              <span>{{ Number(row.navStatus) === 1 ? '展示' : '不展示' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="210" fixed="right">
          <template #default="{ row }">
            <div class="row-actions">
              <el-button v-if="row.depth === 0" v-permission="'productCate'" link type="primary" @click="openCreate(row.id)">新增子类</el-button>
              <el-button v-permission="'productCate'" link type="primary" @click="openEdit(row)">编辑</el-button>
              <el-tooltip v-if="row.productCount > 0 || row.children?.length" content="分类下仍有商品或子分类，暂不能删除" placement="top">
                <span><el-button v-permission="'productCate'" link type="danger" disabled>删除</el-button></span>
              </el-tooltip>
              <el-button v-else v-permission="'productCate'" link type="danger" @click="removeCategory(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
        <template #empty><el-empty description="没有匹配的分类" :image-size="76" /></template>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="640px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="formRules" label-position="top" class="category-form" @submit.prevent="saveCategory">
        <div class="form-grid">
          <el-form-item label="分类名称" prop="name" class="form-span">
            <el-input v-model="form.name" maxlength="100" show-word-limit placeholder="请输入分类名称" />
          </el-form-item>
          <el-form-item label="上级分类" prop="parentId">
            <el-select v-model="form.parentId" :disabled="editingId !== null" style="width:100%">
              <el-option label="无（一级分类）" :value="0" />
              <el-option v-for="item in categoryTree" :key="item.id" :label="item.name" :value="item.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="排序值" prop="sort">
            <el-input-number v-model="form.sort" :min="0" :max="99999" controls-position="right" style="width:100%" />
          </el-form-item>
          <el-form-item label="计量单位">
            <el-input v-model="form.productUnit" maxlength="20" placeholder="例如：件、台" />
          </el-form-item>
          <el-form-item label="前台显示">
            <el-radio-group v-model="form.showStatus"><el-radio :value="1">显示</el-radio><el-radio :value="0">隐藏</el-radio></el-radio-group>
          </el-form-item>
          <el-form-item label="导航栏展示">
            <el-radio-group v-model="form.navStatus"><el-radio :value="1">展示</el-radio><el-radio :value="0">不展示</el-radio></el-radio-group>
          </el-form-item>
          <el-form-item label="图标名称">
            <el-input v-model="form.icon" maxlength="100" placeholder="选填" />
          </el-form-item>
          <el-form-item label="关键词" class="form-span">
            <el-input v-model="form.keywords" maxlength="200" placeholder="用逗号分隔多个关键词" />
          </el-form-item>
          <el-form-item label="分类描述" class="form-span">
            <el-input v-model="form.description" type="textarea" :rows="3" maxlength="500" show-word-limit placeholder="介绍该分类包含的商品范围" />
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveCategory">{{ editingId === null ? '创建分类' : '保存修改' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Connection, Document, Folder, FolderOpened, Plus, Refresh, Search, View } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import { createCategory, deleteCategory, getCategoryTree, getProductCategoryAttributeInfo, updateCategory, updateCategoryNavStatus, updateCategoryShowStatus } from '@/api/product'
import type { PmsProductCategory, PmsProductCategoryParam, ProductCategoryAttributeInfo } from '@/types/api'

type CategoryTreeNode = PmsProductCategory & { children?: CategoryTreeNode[] }
type CategoryRow = PmsProductCategory & {
  depth: number
  parentName?: string
  children?: CategoryTreeNode[]
  _updatingShow?: boolean
  _updatingNav?: boolean
}
type CategoryForm = PmsProductCategoryParam

const categoryTree = ref<CategoryTreeNode[]>([])
const loading = ref(false)
const saving = ref(false)
const keyword = ref('')
const levelFilter = ref<'all' | '0' | '1'>('all')
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()
const originalAttributeInfo = ref<ProductCategoryAttributeInfo[]>([])
const form = reactive<CategoryForm>({ parentId: 0, name: '', productUnit: '', navStatus: 1, showStatus: 1, sort: 0, icon: '', keywords: '', description: '', productAttributeIdList: [] })
const formRules: FormRules = { name: [{ required: true, whitespace: true, message: '请输入分类名称', trigger: 'blur' }] }
const dialogTitle = computed(() => editingId.value === null ? (form.parentId ? '新增二级分类' : '新增一级分类') : '编辑分类')
const categoryCount = computed(() => categoryTree.value.reduce((count, item) => count + 1 + (item.children?.length || 0), 0))
const childCount = computed(() => categoryTree.value.reduce((count, item) => count + (item.children?.length || 0), 0))
const visibleCount = computed(() => flattenTree().filter((item) => Number(item.showStatus) === 1).length)
const filteredCategories = computed(() => {
  const search = keyword.value.trim().toLocaleLowerCase()
  const rows: CategoryRow[] = []
  for (const parent of categoryTree.value) {
    const children = parent.children || []
    const parentMatches = !search || parent.name.toLocaleLowerCase().includes(search)
    const matchedChildren = children.filter((child) => !search || child.name.toLocaleLowerCase().includes(search))
    const includeParent = levelFilter.value !== '1' && (parentMatches || matchedChildren.length > 0)
    if (includeParent) rows.push({ ...parent, depth: 0 })
    if (levelFilter.value !== '0') {
      const visibleChildren = parentMatches && !search ? children : parentMatches ? children : matchedChildren
      rows.push(...visibleChildren.filter((child) => !search || parentMatches || child.name.toLocaleLowerCase().includes(search)).map((child) => ({ ...child, depth: 1, parentName: parent.name })))
    }
  }
  return rows
})

function flattenTree(): CategoryRow[] {
  return categoryTree.value.flatMap((parent) => [
    { ...parent, depth: 0 } as CategoryRow,
    ...(parent.children || []).map((child) => ({ ...child, depth: 1, parentName: parent.name } as CategoryRow)),
  ])
}

async function loadCategories() {
  loading.value = true
  try {
    categoryTree.value = (await getCategoryTree()) as CategoryTreeNode[] || []
  } finally {
    loading.value = false
  }
}

function resetForm(parentId = 0) {
  editingId.value = null
  originalAttributeInfo.value = []
  Object.assign(form, { parentId, name: '', productUnit: '', navStatus: 1, showStatus: 1, sort: 0, icon: '', keywords: '', description: '', productAttributeIdList: [] })
}

function openCreate(parentId = 0) {
  resetForm(parentId)
  dialogVisible.value = true
}

async function openEdit(row: CategoryRow) {
  const attributeInfo = await getProductCategoryAttributeInfo(row.id)
  originalAttributeInfo.value = attributeInfo || []
  editingId.value = row.id
  Object.assign(form, {
    parentId: row.parentId ?? 0,
    name: row.name,
    productUnit: row.productUnit || '',
    navStatus: Number(row.navStatus) || 0,
    showStatus: Number(row.showStatus) || 0,
    sort: row.sort ?? 0,
    icon: row.icon || '',
    keywords: row.keywords || '',
    description: row.description || '',
    productAttributeIdList: originalAttributeInfo.value.map((item) => item.attributeId),
  })
  dialogVisible.value = true
}

async function saveCategory() {
  if (!formRef.value || saving.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    const payload: CategoryForm = {
      parentId: form.parentId,
      name: form.name.trim(),
      productUnit: form.productUnit?.trim() || undefined,
      navStatus: form.navStatus,
      showStatus: form.showStatus,
      sort: form.sort,
      icon: form.icon?.trim() || undefined,
      keywords: form.keywords?.trim() || undefined,
      description: form.description?.trim() || undefined,
      productAttributeIdList: form.productAttributeIdList || [],
    }
    if (editingId.value === null) {
      await createCategory(payload)
      ElMessage.success('分类已创建')
    } else {
      await updateCategory(editingId.value, payload)
      ElMessage.success('分类已更新')
    }
    dialogVisible.value = false
    await loadCategories()
  } finally {
    saving.value = false
  }
}

async function removeCategory(row: CategoryRow) {
  if ((row.children?.length || 0) > 0 || Number(row.productCount) > 0) {
    ElMessage.warning('分类下仍有商品或子分类，暂不能删除')
    return
  }
  await ElMessageBox.confirm(`删除后无法恢复，确认删除“${row.name}”吗？`, '删除分类', { type: 'warning', confirmButtonText: '确认删除', cancelButtonText: '取消' })
  await deleteCategory(row.id)
  ElMessage.success('分类已删除')
  await loadCategories()
}

async function updateShowStatus(row: CategoryRow, value: number) {
  row._updatingShow = true
  try {
    await updateCategoryShowStatus([row.id], value)
    row.showStatus = value
    ElMessage.success(value === 1 ? '分类已显示' : '分类已隐藏')
  } finally {
    row._updatingShow = false
  }
}

async function updateNavStatus(row: CategoryRow, value: number) {
  row._updatingNav = true
  try {
    await updateCategoryNavStatus([row.id], value)
    row.navStatus = value
    ElMessage.success(value === 1 ? '已加入导航栏' : '已从导航栏移除')
  } finally {
    row._updatingNav = false
  }
}

onMounted(loadCategories)
</script>

<style scoped>
.category-page { gap: 17px; }
.category-page :deep(.page-heading) { margin-bottom: 0; }
.summary-grid { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 13px; }
.summary-card { display: flex; min-height: 96px; align-items: center; gap: 13px; padding: 15px 18px; border: 1px solid #e2edfb; border-radius: 11px; background: #fff; box-shadow: 0 4px 15px rgba(51,91,158,.035); }
.summary-card > span:last-child { display: grid; gap: 3px; }
.summary-card small { color: #7f8ea7; font-size: 12px; }
.summary-card strong { color: #263b61; font-size: 23px; font-weight: 650; font-variant-numeric: tabular-nums; }
.summary-icon { display: grid; width: 40px; height: 40px; flex: 0 0 40px; place-items: center; border-radius: 11px; font-size: 18px; }
.summary-icon--blue { color: #426cf1; background: #eaf0ff; }
.summary-icon--violet { color: #8b68d8; background: #f1edff; }
.summary-icon--cyan { color: #318aa7; background: #e6f6fb; }
.summary-icon--green { color: #278c69; background: #e6f7f0; }
.category-card :deep(.el-card__body) { padding: 0 18px 16px; }
.category-toolbar { display: flex; min-height: 78px; align-items: center; justify-content: space-between; gap: 18px; border-bottom: 1px solid #edf2f9; }
.toolbar-heading { display: flex; align-items: baseline; gap: 10px; white-space: nowrap; }
.toolbar-heading h2 { margin: 0; color: #2a3d60; font-size: 15px; font-weight: 650; }
.toolbar-heading span { color: #8a99b0; font-size: 12px; }
.toolbar-filters { display: flex; align-items: center; gap: 12px; }
.toolbar-filters :deep(.el-input) { width: 240px; }
.category-table { width: 100%; }
.category-name-cell { display: flex; min-height: 48px; align-items: center; gap: 10px; }
.category-name-cell--child { padding-left: 18px; }
.tree-branch { align-self: flex-start; color: #a6b7d1; font-size: 17px; line-height: 1.8; }
.category-name-icon { display: grid; width: 34px; height: 34px; flex: 0 0 34px; place-items: center; border-radius: 9px; color: #416cf3; background: #edf2ff; }
.category-name-cell--child .category-name-icon { color: #677eab; background: #f0f4fb; }
.category-name-copy { display: grid; min-width: 0; gap: 2px; }
.category-name-copy strong { overflow: hidden; color: #304363; font-size: 13px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.category-name-copy small { overflow: hidden; color: #91a0b6; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.status-control { display: inline-flex; align-items: center; gap: 8px; color: #75849c; font-size: 12px; }
.row-actions { display: flex; align-items: center; gap: 1px; white-space: nowrap; }
.row-actions .el-button { padding: 0 5px; }
.category-form :deep(.el-form-item) { margin-bottom: 15px; }
.category-form :deep(.el-form-item__label) { padding-bottom: 5px; color: #4e607e; }
.form-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); column-gap: 18px; }
.form-span { grid-column: 1 / -1; }
@media (max-width: 1000px) { .summary-grid { grid-template-columns: repeat(2,minmax(0,1fr)); } .category-toolbar { align-items: flex-start; flex-direction: column; justify-content: center; gap: 10px; padding: 14px 0; } }
@media (max-width: 620px) { .category-card :deep(.el-card__body) { padding: 0 11px 12px; } .summary-grid { gap: 8px; } .summary-card { min-height: 80px; gap: 9px; padding: 11px; } .summary-icon { width: 34px; height: 34px; flex-basis: 34px; } .summary-card strong { font-size: 19px; } .toolbar-filters { width: 100%; align-items: flex-start; flex-direction: column; } .toolbar-filters :deep(.el-input) { width: 100%; } .form-grid { grid-template-columns: 1fr; } .form-span { grid-column: auto; } }
</style>
