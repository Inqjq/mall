<template>
  <div>
    <PageHeader :title="isEdit ? '编辑商品' : '新增商品'" description="填写商品资料、规格和详情。">
      <el-button @click="router.push('/product')">返回列表</el-button>
    </PageHeader>
    <el-card shadow="never">
      <el-steps :active="step" align-center finish-status="success" class="steps">
        <el-step title="基本信息" />
        <el-step title="规格 / SKU" />
        <el-step title="商品详情" />
      </el-steps>

      <!-- 第一步：基本信息 -->
      <el-form v-if="step === 0" label-width="110px" class="form">
        <el-form-item label="商品分类" required>
          <el-cascader v-model="cascadeValue" :options="categoryOptions" placeholder="请选择商品分类（到二级叶子）" style="width: 360px" />
        </el-form-item>
        <el-form-item label="品牌" required>
          <el-select v-model="form.brandId" filterable placeholder="请选择品牌" style="width: 360px">
            <el-option v-for="brand in brandOptions" :key="brand.id" :label="brand.name" :value="brand.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="商品名称" required>
          <el-input v-model="form.name" placeholder="商品名称" style="width: 360px" />
        </el-form-item>
        <el-form-item label="副标题">
          <el-input v-model="form.subTitle" placeholder="副标题" style="width: 360px" />
        </el-form-item>
        <el-form-item label="货号">
          <el-input v-model="form.productSn" placeholder="留空由后端自动生成" style="width: 360px" />
        </el-form-item>
        <el-form-item label="商品主图">
          <ImageUpload v-model="form.pic" label="商品主图" />
        </el-form-item>
        <el-form-item label="单位">
          <el-input v-model="form.unit" placeholder="如：件" style="width: 360px" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" />
        </el-form-item>
        <el-form-item label="价格(元)">
          <el-input-number v-model="form.price" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="市场价(元)">
          <el-input-number v-model="form.originalPrice" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="库存">
          <el-input-number v-model="form.stock" :min="0" />
        </el-form-item>
        <el-form-item label="低库存预警">
          <el-input-number v-model="form.lowStock" :min="0" />
        </el-form-item>
        <el-form-item label="上架状态">
          <el-switch v-model="form.publishStatus" :active-value="1" :inactive-value="0" active-text="上架" inactive-text="下架" />
        </el-form-item>
      </el-form>

      <!-- 第二步：规格 / SKU -->
      <div v-else-if="step === 1">
        <el-form label-width="110px">
          <el-form-item label="商品规格" required>
            <el-select
              v-model="selectedAttrIds"
              multiple
              filterable
              placeholder="请选择该分类下的规格属性"
              style="width: 360px"
              @change="onAttrChange"
            >
              <el-option v-for="attr in attributeList" :key="attr.id" :label="attr.name" :value="attr.id" />
            </el-select>
          </el-form-item>
          <el-form-item v-for="attr in selectedAttrs" :key="attr.id" :label="attr.name">
            <el-select
              v-model="attrValues[attr.id]"
              multiple
              filterable
              default-first-option
              :allow-create="attr.handAddStatus === 1"
              placeholder="选择或输入属性值，回车确认"
              style="width: 360px"
              @change="buildSkuRows"
            >
              <el-option v-for="item in attrInputOptions(attr)" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
        </el-form>
        <el-table v-if="skuRows.length" :data="skuRows" border stripe class="sku-table">
          <el-table-column v-for="(attr, index) in selectedAttrs" :key="attr.id" :label="attr.name" min-width="110">
            <template #default="{ row }">{{ row.sp[index]?.value }}</template>
          </el-table-column>
          <el-table-column label="价格(元)" width="180">
            <template #default="{ row }">
              <el-input-number v-model="row.price" :min="0" :precision="2" size="small" controls-position="right" />
            </template>
          </el-table-column>
          <el-table-column label="库存" width="160">
            <template #default="{ row }">
              <el-input-number v-model="row.stock" :min="0" size="small" controls-position="right" />
            </template>
          </el-table-column>
          <el-table-column label="预警库存" width="160">
            <template #default="{ row }">
              <el-input-number v-model="row.lowStock" :min="0" size="small" controls-position="right" />
            </template>
          </el-table-column>
          <el-table-column label="锁定库存" width="160">
            <template #default="{ row }">
              <el-input-number v-model="row.lockStock" :min="0" size="small" controls-position="right" />
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-else description="选择规格属性并填写属性值后生成 SKU 列表" />
      </div>

      <!-- 第三步：商品详情 -->
      <div v-else class="editor-wrap">
        <Editor
          v-model="form.detailHtml"
          :default-config="editorConfig"
          mode="default"
          style="height: 400px; overflow-y: hidden"
          @on-created="handleEditorCreated"
        />
      </div>

      <div class="footer">
        <el-button v-if="step > 0" @click="step--">上一步</el-button>
        <el-button v-if="step < 2" type="primary" @click="next">下一步</el-button>
        <el-button v-if="step === 2" type="primary" :loading="submitting" @click="submit">提交</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import ImageUpload from '@/components/ImageUpload.vue'
import '@wangeditor/editor/dist/css/style.css'
import { Editor } from '@wangeditor/editor-for-vue'
import type { IDomEditor } from '@wangeditor/editor'
import { getAttributeList, getBrandList, getCategoryList, createProduct, getProductUpdateInfo, updateProduct } from '@/api/product'
import type { PmsProductAttribute, PmsProductParam } from '@/types/api'

interface CategoryOption {
  value: number
  label: string
  children?: CategoryOption[]
}

interface SkuRow {
  sp: { key: string; value: string }[]
  price: number
  stock: number
  lowStock: number
  lockStock: number
}

const route = useRoute()
const router = useRouter()
const isEdit = Boolean(route.params.id)
const productId = Number(route.params.id)

const step = ref(0)
const submitting = ref(false)

const form = reactive({
  name: '',
  subTitle: '',
  productSn: '',
  pic: '',
  brandId: undefined as number | undefined,
  unit: '',
  sort: 0,
  price: 0,
  originalPrice: 0,
  stock: 0,
  lowStock: 0,
  publishStatus: 1,
  detailHtml: '',
})

const categoryOptions = ref<CategoryOption[]>([])
const cascadeValue = ref<number[]>([])
const brandOptions = ref<{ id: number; name: string }[]>([])

const attributeList = ref<PmsProductAttribute[]>([])
const selectedAttrIds = ref<number[]>([])
const attrValues = reactive<Record<number, string[]>>({})
const selectedAttrs = computed(() => attributeList.value.filter((attr) => selectedAttrIds.value.includes(attr.id)))

const skuRows = ref<SkuRow[]>([])

// 富文本编辑器
const editorRef = shallowRef<IDomEditor>()
const editorConfig = { placeholder: '请输入商品详情...' }
function handleEditorCreated(editor: IDomEditor) {
  editorRef.value = editor
}
onBeforeUnmount(() => {
  editorRef.value?.destroy()
})

function attrInputOptions(attr: PmsProductAttribute) {
  return attr.inputList ? attr.inputList.split(',') : []
}

async function loadCategoryTree() {
  const firstPage = await getCategoryList(0, { pageNum: 1, pageSize: 100 })
  const options: CategoryOption[] = []
  for (const first of firstPage.list) {
    const childPage = await getCategoryList(first.id, { pageNum: 1, pageSize: 100 })
    options.push({
      value: first.id,
      label: first.name,
      children: childPage.list.map((child) => ({ value: child.id, label: child.name })),
    })
  }
  categoryOptions.value = options
}

async function loadBrands() {
  const page = await getBrandList({ pageNum: 1, pageSize: 100 })
  brandOptions.value = page.list || []
}

async function loadAttributes(cid: number) {
  const page = await getAttributeList(cid, 0, { pageNum: 1, pageSize: 100 })
  attributeList.value = page.list || []
}

function onAttrChange() {
  const ids = selectedAttrIds.value
  for (const key of Object.keys(attrValues)) {
    if (!ids.includes(Number(key))) delete attrValues[Number(key)]
  }
  for (const id of ids) {
    if (!attrValues[id]) {
      const attr = attributeList.value.find((item) => item.id === id)
      attrValues[id] = attr?.inputList ? attr.inputList.split(',') : []
    }
  }
  buildSkuRows()
}

function spSignature(sp: { key: string; value: string }[]) {
  return sp.map((item) => `${item.key}:${item.value}`).join('|')
}

/** 按所选规格的属性值做笛卡尔积生成 SKU 行，已有行按签名保留编辑值 */
function buildSkuRows() {
  const attrs = selectedAttrs.value
  const valueLists = attrs.map((attr) => attrValues[attr.id] || [])
  if (!attrs.length || valueLists.some((list) => list.length === 0)) {
    skuRows.value = []
    return
  }
  let combos: string[][] = [[]]
  for (const list of valueLists) {
    const next: string[][] = []
    for (const combo of combos) {
      for (const value of list) next.push([...combo, value])
    }
    combos = next
  }
  if (combos.length > 100) combos = combos.slice(0, 100)
  const prevMap = new Map(skuRows.value.map((row) => [spSignature(row.sp), row]))
  skuRows.value = combos.map((combo) => {
    const sp = combo.map((value, index) => ({ key: attrs[index].name || '', value }))
    const prev = prevMap.get(spSignature(sp))
    return {
      sp,
      price: prev?.price ?? form.price ?? 0,
      stock: prev?.stock ?? form.stock ?? 0,
      lowStock: prev?.lowStock ?? form.lowStock ?? 0,
      lockStock: prev?.lockStock ?? 0,
    }
  })
}

async function loadProduct() {
  const result = await getProductUpdateInfo(productId)
  form.name = result.name || ''
  form.subTitle = result.subTitle || ''
  form.productSn = result.productSn || ''
  form.pic = result.pic || ''
  form.brandId = result.brandId
  form.unit = result.unit || ''
  form.sort = result.sort ?? 0
  form.price = result.price ?? 0
  form.originalPrice = result.originalPrice ?? 0
  form.stock = result.stock ?? 0
  form.lowStock = result.lowStock ?? 0
  form.publishStatus = result.publishStatus ?? 1
  form.detailHtml = result.detailHtml || ''
  cascadeValue.value = result.cateParentId
    ? [result.cateParentId, result.productCategoryId ?? 0]
    : [result.productCategoryId ?? 0]
  await loadAttributes(result.productCategoryId ?? 0)
  const attrValueList = result.productAttributeValueList || []
  selectedAttrIds.value = attrValueList.map((item) => item.productAttributeId)
  for (const item of attrValueList) {
    attrValues[item.productAttributeId] = item.value ? item.value.split(',') : []
  }
  buildSkuRows()
  // 回显已有 SKU 的价格库存（按 spData 签名匹配）
  for (const sku of result.skuStockList || []) {
    let sp: { key: string; value: string }[] = []
    try {
      sp = JSON.parse(sku.spData || '[]')
    } catch {
      sp = []
    }
    const row = skuRows.value.find((item) => spSignature(item.sp) === spSignature(sp))
    if (row) {
      row.price = sku.price ?? row.price
      row.stock = sku.stock ?? row.stock
      row.lowStock = sku.lowStock ?? row.lowStock
      row.lockStock = sku.lockStock ?? 0
    }
  }
}

function next() {
  if (step.value === 0) {
    if (!form.name) return ElMessage.warning('请输入商品名称')
    if (!cascadeValue.value.length) return ElMessage.warning('请选择商品分类')
    if (!form.brandId) return ElMessage.warning('请选择品牌')
    step.value = 1
    loadAttributes(cascadeValue.value[cascadeValue.value.length - 1])
  } else if (step.value === 1) {
    if (!skuRows.value.length) return ElMessage.warning('请选择规格属性并填写属性值以生成 SKU')
    step.value = 2
  }
}

async function submit() {
  if (!form.detailHtml) return ElMessage.warning('请输入商品详情')
  const payload: PmsProductParam = {
    name: form.name,
    subTitle: form.subTitle || undefined,
    productSn: form.productSn || undefined,
    pic: form.pic || undefined,
    brandId: form.brandId,
    productCategoryId: cascadeValue.value[cascadeValue.value.length - 1],
    unit: form.unit || undefined,
    sort: form.sort,
    price: form.price,
    originalPrice: form.originalPrice,
    stock: form.stock,
    lowStock: form.lowStock,
    publishStatus: form.publishStatus ? 1 : 0,
    detailHtml: form.detailHtml,
    skuStockList: skuRows.value.map((row) => ({
      price: row.price,
      stock: row.stock,
      lowStock: row.lowStock,
      lockStock: row.lockStock,
      spData: JSON.stringify(row.sp),
    })),
    productAttributeValueList: selectedAttrs.value.map((attr) => ({
      productAttributeId: attr.id,
      value: (attrValues[attr.id] || []).join(','),
    })),
  }
  submitting.value = true
  try {
    if (isEdit) {
      await updateProduct(productId, payload)
      ElMessage.success('更新成功')
    } else {
      await createProduct(payload)
      ElMessage.success('创建成功')
    }
    router.push('/product')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadCategoryTree(), loadBrands()])
  if (isEdit) await loadProduct()
})
</script>

<style scoped>
.steps { max-width: 760px; margin: 4px auto 28px; }
.form { max-width: 760px; margin: 0 auto; }
.form :deep(.el-form-item) { margin-bottom: 18px; }
.sku-table { margin-top: 18px; }
.editor-wrap { z-index: 1; overflow: hidden; border: 1px solid #dfeafa; border-radius: 10px; background: #fff; }
.footer { display: flex; justify-content: flex-end; gap: 9px; margin: 24px -18px -18px; padding: 15px 18px; border-top: 1px solid #e9f0fa; background: #f8fbff; }
@media (max-width: 560px) {
  .steps { margin-bottom: 18px; }
  .form :deep(.el-form-item) { margin-bottom: 14px; }
  .form :deep(.el-form-item__label) { width: 100% !important; justify-content: flex-start; }
  .form :deep(.el-form-item__content) { margin-left: 0 !important; }
  .form :deep(.el-form-item__content > .el-input), .form :deep(.el-form-item__content > .el-select), .form :deep(.el-form-item__content > .el-cascader) { width: 100% !important; }
  .footer { margin-right: -14px; margin-left: -14px; margin-bottom: -14px; padding: 12px 14px; }
}
</style>
