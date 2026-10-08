<template>
  <div class="page-stack product-editor-page">
    <div class="page-heading"><div><div class="crumb"><el-button link @click="router.push('/products')">商品管理</el-button><span>/</span>{{ isEdit ? '编辑商品' : '新增商品' }}</div><h1>{{ isEdit ? '编辑商品' : '新增商品' }}</h1><p>完善商品资料后保存，销售状态可随时在列表调整。</p></div><el-button @click="router.push('/products')">返回列表</el-button></div>
    <el-alert v-if="isEdit" title="编辑会直接更新商品资料与默认 SKU；多规格商品请在平台商品编辑页维护 SKU。" type="info" :closable="false" show-icon />
    <section class="surface editor-surface">
      <div class="editor-section"><div class="section-head"><div><b>基础资料</b><small>商品的名称、归属和展示信息</small></div><span class="required-note">带 * 为必填项</span></div>
        <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="editor-form">
          <el-form-item label="商品名称" prop="name"><el-input v-model="form.name" maxlength="100" show-word-limit placeholder="请输入商品名称" /></el-form-item>
          <el-form-item label="商品副标题"><el-input v-model="form.subTitle" maxlength="200" placeholder="补充商品卖点或规格说明" /></el-form-item>
          <el-form-item label="商品分类" prop="productCategoryId"><el-select v-model="form.productCategoryId" filterable placeholder="请选择分类" style="width:100%"><el-option v-for="item in categoryOptions" :key="item.id" :label="item.label" :value="item.id" /></el-select></el-form-item>
          <el-form-item label="商品品牌" prop="brandId"><el-select v-model="form.brandId" filterable placeholder="请选择品牌" style="width:100%"><el-option v-for="item in brandOptions" :key="item.id" :label="item.name" :value="item.id" /></el-select></el-form-item>
          <el-form-item label="商品主图"><ImageUpload v-model="form.pic" label="商品主图" /></el-form-item>
          <el-form-item label="商品货号"><el-input v-model="form.productSn" placeholder="留空由系统生成" /></el-form-item>
        </el-form>
      </div>
      <div class="editor-section"><div class="section-head"><div><b>价格与库存</b><small>维护当前默认规格的销售价格和库存数量</small></div></div>
        <el-form :model="form" label-position="top" class="editor-form editor-form--numbers">
          <el-form-item label="销售价（元）"><el-input-number v-model="form.price" :min="0" :precision="2" :step="1" controls-position="right" /></el-form-item>
          <el-form-item label="市场价（元）"><el-input-number v-model="form.originalPrice" :min="0" :precision="2" :step="1" controls-position="right" /></el-form-item>
          <el-form-item label="库存"><el-input-number v-model="form.stock" :min="0" :precision="0" controls-position="right" /></el-form-item>
          <el-form-item label="低库存提醒"><el-input-number v-model="form.lowStock" :min="0" :precision="0" controls-position="right" /></el-form-item>
          <el-form-item label="计量单位"><el-input v-model="form.unit" placeholder="件" /></el-form-item>
          <el-form-item label="列表排序"><el-input-number v-model="form.sort" :min="0" :precision="0" controls-position="right" /></el-form-item>
          <el-form-item label="销售状态"><el-switch v-model="form.publishStatus" :active-value="1" :inactive-value="0" active-text="上架销售" inactive-text="暂不销售" /></el-form-item>
        </el-form>
      </div>
      <div class="editor-section"><div class="section-head"><div><b>商品详情</b><small>支持填写纯文本或 HTML 内容</small></div></div><el-input v-model="form.detailHtml" type="textarea" :rows="7" maxlength="10000" show-word-limit placeholder="介绍商品特点、材质、使用说明等" /></div>
      <div class="editor-footer"><el-button @click="router.push('/products')">取消</el-button><el-button type="primary" :loading="saving" @click="save">{{ isEdit ? '保存修改' : '创建商品' }}</el-button></div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { brands, categories, createProduct, productUpdateInfo, updateProduct, type Brand, type Category, type ProductParam } from '../api'
import ImageUpload from '../components/ImageUpload.vue'

const route = useRoute()
const router = useRouter()
const isEdit = Boolean(route.params.id)
const formRef = ref<FormInstance>()
const saving = ref(false)
const brandOptions = ref<Brand[]>([])
const categoryOptions = ref<(Category & { label: string })[]>([])
const form = reactive<ProductParam>({ name: '', brandId: 0, productCategoryId: 0, sort: 0, price: 0, originalPrice: 0, stock: 0, lowStock: 0, publishStatus: 0, detailHtml: '', pic: '', skuStockList: [] })
const rules: FormRules = {
  name: [{ required: true, message: '请填写商品名称', trigger: 'blur' }],
  brandId: [{ required: true, type: 'number', min: 1, message: '请选择商品品牌', trigger: 'change' }],
  productCategoryId: [{ required: true, type: 'number', min: 1, message: '请选择商品分类', trigger: 'change' }],
}

async function loadOptions() {
  const [firstPage, brandList] = await Promise.all([categories(0), brands()])
  const all: (Category & { label: string })[] = []
  for (const parent of firstPage.list || []) {
    const children = await categories(parent.id)
    all.push(...(children.list || []).map(child => ({ ...child, label: `${parent.name} / ${child.name}` })))
    if (!(children.list || []).length) all.push({ ...parent, label: parent.name })
  }
  categoryOptions.value = all
  brandOptions.value = brandList || []
}

async function loadProduct() {
  const data = await productUpdateInfo(Number(route.params.id))
  Object.assign(form, {
    name: data.name || '', subTitle: data.subTitle || '', productSn: data.productSn || '', brandId: data.brandId || 0,
    productCategoryId: data.productCategoryId || 0, unit: data.unit || '', sort: data.sort ?? 0, price: data.price ?? 0,
    originalPrice: data.originalPrice ?? 0, stock: data.stock ?? 0, lowStock: data.lowStock ?? 0,
    publishStatus: data.publishStatus ?? 0, detailHtml: data.detailHtml || '', pic: data.pic || '', skuStockList: data.skuStockList || [],
  })
}

async function save() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    const payload: ProductParam = {
      ...form,
      productSn: form.productSn?.trim() || undefined,
      skuStockList: form.skuStockList?.length ? form.skuStockList : [{ price: form.price, stock: form.stock, lowStock: form.lowStock, lockStock: 0, spData: '[]' }],
    }
    if (isEdit) await updateProduct(Number(route.params.id), payload)
    else await createProduct(payload)
    ElMessage.success(isEdit ? '商品资料已保存' : '商品已创建')
    await router.push('/products')
  } finally { saving.value = false }
}

onMounted(async () => {
  await loadOptions()
  if (isEdit) await loadProduct()
})
</script>

<style scoped>
.crumb { display:flex; align-items:center; gap:8px; margin-bottom:6px; color:#87919a; font-size:11px; }
.editor-surface { padding:0 22px; }
.editor-section { padding:22px 0; border-bottom:1px solid #edf0f2; }
.section-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:19px; }
.section-head div { display:grid; gap:5px; }
.section-head b { color:#333b42; font-size:14px; }
.section-head small,.required-note { color:#929ba3; font-size:10px; }
.editor-form { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:0 22px; max-width:920px; }
.editor-form--numbers { grid-template-columns:repeat(3,minmax(0,1fr)); }
.editor-form :deep(.el-form-item) { margin-bottom:17px; }
.editor-form :deep(.el-input-number) { width:100%; }
.editor-section > :deep(.el-textarea) { max-width:920px; }
.editor-footer { display:flex; justify-content:flex-end; gap:9px; padding:17px 0; }
@media(max-width:700px) { .editor-surface{padding:0 14px}.editor-form,.editor-form--numbers{grid-template-columns:1fr}.section-head{align-items:flex-start;gap:10px}.editor-section{padding:17px 0} }
</style>
