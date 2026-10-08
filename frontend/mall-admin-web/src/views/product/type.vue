<template>
  <div class="page-stack">
    <PageHeader title="商品类型" description="维护商品规格和商品参数模板，商品发布时将按类型生成可选规格。">
      <el-button :icon="Refresh" :loading="loading" @click="load">刷新</el-button>
      <el-button type="primary" :icon="Plus" :disabled="!selected" @click="openCreateAttribute">新增{{ activeType === 0 ? '规格' : '参数' }}</el-button>
    </PageHeader>
    <div class="type-layout">
      <el-card shadow="never" class="type-side">
        <div class="side-heading"><b>类型目录</b><el-button link type="primary" :icon="Plus" @click="openCategory()">新增</el-button></div>
        <button v-for="item in categories" :key="item.id" class="category-choice" :class="{ selected: selected?.id === item.id }" @click="selectedId = item.id">
          <span><b>{{ item.name }}</b><small>{{ Number(item.attributeCount || 0) }} 个规格 · {{ Number(item.paramCount || 0) }} 个参数</small></span><el-icon><ArrowRight /></el-icon>
        </button>
        <el-empty v-if="!loading && !categories.length" description="还没有商品类型" :image-size="68"><el-button type="primary" @click="openCategory()">创建商品类型</el-button></el-empty>
      </el-card>
      <el-card shadow="never" class="type-main">
        <template v-if="selected">
          <div class="type-heading"><div><span class="eyebrow">商品类型</span><h2>{{ selected.name }}</h2><p>规格用于商品 SKU；参数用于详情页属性展示。</p></div><el-dropdown @command="handleCategoryCommand"><el-button>类型设置<el-icon class="el-icon--right"><MoreFilled /></el-icon></el-button><template #dropdown><el-dropdown-menu><el-dropdown-item command="rename">修改名称</el-dropdown-item><el-dropdown-item command="delete" :disabled="selected.attributeCount! + selected.paramCount! > 0">删除类型</el-dropdown-item></el-dropdown-menu></template></el-dropdown></div>
          <el-tabs v-model="activeType" @tab-change="load">
            <el-tab-pane label="商品规格" :name="0" /><el-tab-pane label="商品参数" :name="1" />
          </el-tabs>
          <div class="table-caption"><span>{{ activeType === 0 ? '规格定义' : '参数定义' }}</span><small>{{ visibleAttributes.length }} 项</small></div>
          <el-table v-loading="loading" :data="visibleAttributes" row-key="id">
            <el-table-column prop="name" label="名称" min-width="180" />
            <el-table-column label="录入方式" width="130"><template #default="{ row }">{{ row.inputType === 1 ? '从列表选择' : '手动录入' }}</template></el-table-column>
            <el-table-column label="可选值" min-width="190" show-overflow-tooltip><template #default="{ row }">{{ row.inputList || '未配置' }}</template></el-table-column>
            <el-table-column prop="sort" label="排序" width="80" />
            <el-table-column label="操作" width="130" fixed="right"><template #default="{ row }"><el-button link type="primary" @click="openEditAttribute(row)">编辑</el-button><el-popconfirm title="删除后商品编辑页将不能继续使用该属性，确认删除？" @confirm="removeAttribute(row.id)"><template #reference><el-button link type="danger">删除</el-button></template></el-popconfirm></template></el-table-column>
            <template #empty><el-empty :description="`该类型还没有${activeType === 0 ? '规格' : '参数'}`" :image-size="72"><el-button type="primary" @click="openCreateAttribute">立即添加</el-button></el-empty></template>
          </el-table>
        </template>
        <el-empty v-else-if="!loading" description="选择或新建一个商品类型" :image-size="90" />
      </el-card>
    </div>
    <el-dialog v-model="categoryDialog" :title="categoryEditing ? '修改类型名称' : '新增商品类型'" width="430px">
      <el-form><el-form-item label="类型名称"><el-input v-model="categoryName" maxlength="30" show-word-limit @keyup.enter="saveCategory" /></el-form-item></el-form>
      <template #footer><el-button @click="categoryDialog = false">取消</el-button><el-button type="primary" :loading="saving" @click="saveCategory">保存</el-button></template>
    </el-dialog>
    <el-dialog v-model="attributeDialog" :title="editingAttribute ? '编辑属性' : `新增${activeType === 0 ? '规格' : '参数'}`" width="560px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="105px">
        <el-form-item label="属性名称" prop="name"><el-input v-model="form.name" maxlength="50" /></el-form-item>
        <el-form-item label="录入方式"><el-radio-group v-model="form.inputType"><el-radio :value="0">手动录入</el-radio><el-radio :value="1">从列表选择</el-radio></el-radio-group></el-form-item>
        <el-form-item v-if="form.inputType === 1" label="可选值"><el-input v-model="form.inputList" type="textarea" :rows="3" placeholder="多个选项用英文逗号分隔" /></el-form-item>
        <el-form-item v-if="activeType === 0" label="选择方式"><el-select v-model="form.selectType"><el-option label="唯一" :value="0" /><el-option label="单选" :value="1" /><el-option label="多选" :value="2" /></el-select></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.sort" :min="0" /></el-form-item>
        <el-form-item label="允许手动新增"><el-switch v-model="form.handAddStatus" :active-value="1" :inactive-value="0" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="attributeDialog = false">取消</el-button><el-button type="primary" :loading="saving" @click="saveAttribute">保存属性</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { ArrowRight, MoreFilled, Plus, Refresh } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import { createAttribute, createAttributeCategory, deleteAttributeCategory, deleteAttributes, getAttributeCategories, updateAttribute, updateAttributeCategory, type PmsAttributeCategory, type PmsProductAttributeParam } from '@/api/product'
import type { PmsProductAttribute } from '@/types/api'

const categories = ref<PmsAttributeCategory[]>([])
const selectedId = ref<number>()
const selected = computed(() => categories.value.find((item) => item.id === selectedId.value))
const activeType = ref(0)
const loading = ref(false)
const saving = ref(false)
const categoryDialog = ref(false)
const categoryEditing = ref(false)
const categoryName = ref('')
const attributeDialog = ref(false)
const editingAttribute = ref<PmsProductAttribute>()
const formRef = ref<FormInstance>()
const form = reactive<PmsProductAttributeParam>({ productAttributeCategoryId: 0, name: '', selectType: 0, inputType: 0, inputList: '', sort: 0, filterType: 0, searchType: 0, relatedStatus: 0, handAddStatus: 0, type: 0 })
const rules: FormRules = { name: [{ required: true, message: '请输入属性名称', trigger: 'blur' }] }
const visibleAttributes = computed(() => (selected.value?.productAttributeList || []).filter((item) => Number(item.type) === activeType.value))
async function load() { loading.value = true; try { categories.value = await getAttributeCategories(); if (!selectedId.value || !categories.value.some(item => item.id === selectedId.value)) selectedId.value = categories.value[0]?.id } finally { loading.value = false } }
function openCategory(edit = false) { categoryEditing.value = edit; categoryName.value = edit ? selected.value?.name || '' : ''; categoryDialog.value = true }
async function handleCategoryCommand(command: string) {
  if (command === 'rename') return openCategory(true)
  if (command === 'delete' && selected.value) { await ElMessageBox.confirm(`删除类型“${selected.value.name}”？`, '删除确认', { type: 'warning' }); await deleteAttributeCategory(selected.value.id); ElMessage.success('商品类型已删除'); selectedId.value = undefined; await load() }
}
async function saveCategory() { const name = categoryName.value.trim(); if (!name) return ElMessage.warning('请填写类型名称'); saving.value = true; try { if (categoryEditing.value && selected.value) await updateAttributeCategory(selected.value.id, name); else await createAttributeCategory(name); ElMessage.success('类型已保存'); categoryDialog.value = false; await load() } finally { saving.value = false } }
function openCreateAttribute() { editingAttribute.value = undefined; Object.assign(form, { productAttributeCategoryId: selected.value?.id || 0, name: '', selectType: 0, inputType: 0, inputList: '', sort: 0, filterType: 0, searchType: 0, relatedStatus: 0, handAddStatus: 0, type: activeType.value }); attributeDialog.value = true }
function openEditAttribute(row: PmsProductAttribute) { editingAttribute.value = row; Object.assign(form, { productAttributeCategoryId: selected.value?.id || 0, name: row.name, selectType: row.selectType ?? 0, inputType: row.inputType ?? 0, inputList: row.inputList || '', sort: row.sort ?? 0, filterType: row.filterType ?? 0, searchType: row.searchType ?? 0, relatedStatus: row.relatedStatus ?? 0, handAddStatus: row.handAddStatus ?? 0, type: activeType.value }); attributeDialog.value = true }
async function saveAttribute() { if (!await formRef.value?.validate().catch(() => false)) return; saving.value = true; try { if (editingAttribute.value) await updateAttribute(editingAttribute.value.id, { ...form }); else await createAttribute({ ...form }); ElMessage.success('属性已保存'); attributeDialog.value = false; await load() } finally { saving.value = false } }
async function removeAttribute(id: number) { await deleteAttributes([id]); ElMessage.success('属性已删除'); await load() }
onMounted(load)
</script>

<style scoped>
.type-layout{display:grid;grid-template-columns:265px minmax(0,1fr);gap:15px;align-items:start}.type-side,.type-main{border-radius:10px;border-color:#e6ebf2}.type-side :deep(.el-card__body){padding:14px}.type-main :deep(.el-card__body){padding:20px}.side-heading{display:flex;align-items:center;justify-content:space-between;padding:2px 2px 12px;color:#303d50;font-size:13px}.category-choice{display:flex;width:100%;align-items:center;justify-content:space-between;gap:8px;margin:3px 0;padding:11px 10px;border:1px solid transparent;border-radius:7px;color:#3c4a5d;background:transparent;text-align:left;cursor:pointer}.category-choice:hover{background:#f5f8fd}.category-choice.selected{border-color:#d8e4ff;color:#285ce7;background:#f0f5ff}.category-choice span{display:grid;gap:5px}.category-choice b{font-size:12px;font-weight:600}.category-choice small{color:#919cab;font-size:10px}.category-choice>.el-icon{color:#98a4b3}.type-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:13px}.type-heading h2{margin:5px 0;color:#27364a;font-size:19px}.type-heading p{margin:0;color:#8b96a5;font-size:11px}.eyebrow{color:#8b96a5;font-size:10px;letter-spacing:.04em}.table-caption{display:flex;align-items:center;justify-content:space-between;margin:2px 0 11px;color:#48566a;font-size:12px}.table-caption small{color:#929dad;font-size:10px}@media(max-width:800px){.type-layout{grid-template-columns:1fr}.type-side{max-height:250px;overflow:auto}.type-main :deep(.el-card__body){padding:13px}.type-heading{align-items:flex-start}}
</style>
