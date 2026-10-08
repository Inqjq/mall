<template>
  <div class="category-page page-container">
    <div class="category-title"><div class="breadcrumb"><router-link to="/">首页</router-link><van-icon name="arrow" /><span>全部分类</span></div><h1>全部商品分类</h1><p>选择分类，查看对应商品</p></div>
    <div class="category-layout">
      <aside class="category-rail" aria-label="商品分类">
        <button class="rail-item" :class="{ active: !selectedCategory }" @click="selectCategory(null)"><span>全部好物</span><van-icon name="arrow" /></button>
        <button v-for="category in categories" :key="category.id" class="rail-item" :class="{ active: selectedCategory?.id === category.id }" @click="selectCategory(category)"><span>{{ category.name }}</span><van-icon name="arrow" /></button>
      </aside>
      <section class="category-main">
        <div class="category-main-head">
          <div><span class="category-overline">商品分类</span><h2>{{ selectedCategory?.name || '全部商品' }}</h2><p>共 {{ total }} 件商品</p></div>
          <router-link to="/search">搜索商品 <van-icon name="search" /></router-link>
        </div>
        <div v-if="activeChildren.length" class="subcategory-list"><button :class="{ selected: !selectedChild }" @click="selectChild(null)">全部</button><button v-for="child in activeChildren" :key="child.id" :class="{ selected: selectedChild?.id === child.id }" @click="selectChild(child)">{{ child.name }}</button></div>
        <div class="filter-toolbar">
          <div class="result-line"><strong>{{ selectedChild?.name || selectedCategory?.name || '全部商品' }}</strong><span>共 {{ total }} 件</span></div>
          <div class="sort-options"><span>排序</span><button v-for="option in sortOptions" :key="option.value" :class="{ active: sort === option.value }" @click="changeSort(option.value)">{{ option.label }}<van-icon v-if="option.value === 3" name="arrow-down" /><van-icon v-if="option.value === 4" name="arrow-up" /></button></div>
        </div>
        <van-skeleton v-if="loading && !products.length" title :row="3" />
        <van-list v-else v-model:loading="listLoading" :finished="finished" finished-text="已经看到这里了" @load="loadMore">
          <div class="product-grid"><ProductCard v-for="product in products" :key="product.id" :product="product" /></div>
          <van-empty v-if="finished && !products.length" description="这个分类还没有商品，换个分类看看吧" />
        </van-list>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProductCategoryTree } from '@/api/home'
import { searchProducts } from '@/api/product'
import type { CategoryNode, Product } from '@/types/api'
import ProductCard from '@/components/ProductCard.vue'

const route = useRoute()
const router = useRouter()
const categories = ref<CategoryNode[]>([])
const selectedCategory = ref<CategoryNode | null>(null)
const selectedChild = ref<CategoryNode | null>(null)
const products = ref<Product[]>([])
const pageNum = ref(0)
const pageSize = 12
const sort = ref(Number(route.query.sort) || 0)
const total = ref(0)
const loading = ref(false)
const listLoading = ref(false)
const finished = ref(false)
let requestVersion = 0
const inFlight = new Set<number>()
const activeCategoryIds = computed(() => {
  if (selectedChild.value) return [selectedChild.value.id]
  if (selectedCategory.value?.childrenList?.length) return selectedCategory.value.childrenList.map((child) => child.id)
  return selectedCategory.value ? [selectedCategory.value.id] : []
})
const activeChildren = computed(() => selectedCategory.value?.childrenList || [])
const sortOptions = [{ label: '综合', value: 0 }, { label: '新品', value: 1 }, { label: '销量', value: 2 }, { label: '价格', value: 3 }, { label: '价格', value: 4 }]

onMounted(async () => {
  try {
    categories.value = (await getProductCategoryTree()) || []
    const categoryId = Number(route.query.categoryId)
    if (categoryId) {
      const parent = categories.value.find((item) => item.id === categoryId)
      const childParent = categories.value.find((item) => item.childrenList?.some((child) => child.id === categoryId))
      if (parent) selectedCategory.value = parent
      else if (childParent) { selectedCategory.value = childParent; selectedChild.value = childParent.childrenList?.find((item) => item.id === categoryId) || null }
    }
  } catch { /* request interceptor displays the error */ }
  await reload()
})

watch(() => route.query.categoryId, async (value, oldValue) => {
  if (value === oldValue || !categories.value.length) return
  const id = Number(value)
  if (!id) { selectedCategory.value = null; selectedChild.value = null }
  else {
    const parent = categories.value.find((item) => item.id === id)
    const childParent = categories.value.find((item) => item.childrenList?.some((child) => child.id === id))
    if (parent) { selectedCategory.value = parent; selectedChild.value = null }
    else if (childParent) { selectedCategory.value = childParent; selectedChild.value = childParent.childrenList?.find((item) => item.id === id) || null }
  }
  await reload()
})

async function selectCategory(category: CategoryNode | null) {
  selectedCategory.value = category
  selectedChild.value = null
  const categoryId = category?.id ? String(category.id) : undefined
  if ((route.query.categoryId as string | undefined) === categoryId) await reload()
  else await router.replace({ query: { ...route.query, categoryId } })
}

async function selectChild(category: CategoryNode | null) {
  selectedChild.value = category
  const categoryId = category?.id ? String(category.id) : selectedCategory.value?.id ? String(selectedCategory.value.id) : undefined
  if ((route.query.categoryId as string | undefined) === categoryId) await reload()
  else await router.replace({ query: { ...route.query, categoryId } })
}

async function reload() {
  requestVersion += 1
  products.value = []
  pageNum.value = 0
  total.value = 0
  finished.value = false
  listLoading.value = false
  await loadMore(requestVersion)
}

async function changeSort(value: number) {
  sort.value = value
  await reload()
}

async function loadMore(version = requestVersion) {
  if (finished.value) { listLoading.value = false; return }
  if (inFlight.has(version)) return
  inFlight.add(version)
  loading.value = true
  listLoading.value = true
  try {
    const categoryIds = activeCategoryIds.value
    const categoryPageSize = categoryIds.length > 1 ? 4 : pageSize
    const pages = await Promise.all(categoryIds.length > 1
      ? categoryIds.map((id) => searchProducts({ productCategoryId: id, pageNum: pageNum.value, pageSize: categoryPageSize, sort: sort.value }))
      : [searchProducts({ productCategoryId: categoryIds[0], pageNum: pageNum.value, pageSize, sort: sort.value })])
    if (version !== requestVersion) return
    const items = categoryIds.length > 1 ? interleave(pages.map((page) => page.list || [])) : pages[0]?.list || []
    products.value.push(...items.filter((item) => !products.value.some((existing) => existing.id === item.id)))
    total.value = categoryIds.length > 1
      ? pages.reduce((sum, page) => sum + (page.total || 0), 0)
      : pages[0]?.total || products.value.length
    const maxPageCount = Math.max(0, ...pages.map((page) => page.totalPage || 0))
    finished.value = pageNum.value + 1 >= maxPageCount || items.length === 0
    pageNum.value += 1
  } catch { if (version === requestVersion) finished.value = true }
  finally {
    inFlight.delete(version)
    if (version === requestVersion) { loading.value = false; listLoading.value = false }
  }
}

function interleave<T>(lists: T[][]): T[] {
  const merged: T[] = []
  const maxLength = Math.max(0, ...lists.map((list) => list.length))
  for (let index = 0; index < maxLength; index += 1) {
    for (const list of lists) if (list[index]) merged.push(list[index])
  }
  return merged
}
</script>

<style scoped>
.category-page { padding-top: 24px; }
.category-title { padding: 4px 0 29px; border-bottom: 1px solid #e6eae4; }
.breadcrumb { display: flex; align-items: center; gap: 8px; color: #929a94; font-size: 11px; }
.breadcrumb a:hover { color: var(--store-primary); }
.breadcrumb .van-icon { font-size: 9px; }
.category-title h1 { margin: 18px 0 6px; font-size: 24px; font-weight: 600; }
.category-title p { margin: 0; color: var(--store-muted); font-size: 13px; }
.category-layout { display: grid; grid-template-columns: 230px minmax(0,1fr); gap: 44px; padding-top: 27px; }
.category-rail { align-self: start; position: sticky; top: 155px; padding: 8px 0; border-right: 1px solid var(--store-line); }
.rail-item { width: calc(100% - 14px); min-height: 45px; display: flex; align-items: center; justify-content: space-between; padding: 0 17px; border: 0; border-left: 2px solid transparent; color: #58645d; background: transparent; text-align: left; cursor: pointer; transition: color .2s, background .2s; }
.rail-item:hover { color: var(--store-primary); background: #fff6f5; }
.rail-item.active { border-left-color: var(--store-accent); color: var(--store-primary); background: #fff1ef; font-weight: 600; }
.rail-item .van-icon { color: #a0a9a3; font-size: 12px; }
.category-main-head { display: flex; align-items: end; justify-content: space-between; padding: 3px 0 19px; }
.category-overline { color: #8c978f; font-size: 9px; letter-spacing: .17em; }
.category-main-head h2 { margin: 6px 0 4px; font-size: 20px; font-weight: 600; }
.category-main-head p { margin: 0; color: #89928c; font-size: 12px; }
.category-main-head > a { display: inline-flex; align-items: center; gap: 7px; padding: 8px 11px; border: 1px solid #dfe5de; color: #50675a; font-size: 12px; }
.subcategory-list { display: flex; flex-wrap: wrap; gap: 8px; padding: 15px 0; border-top: 1px solid #e9ece7; border-bottom: 1px solid #e9ece7; }
.subcategory-list button { min-height: 32px; padding: 0 13px; border: 1px solid #e4e8e2; border-radius: 18px; color: #67726b; background: #fff; font-size: 11px; cursor: pointer; }
.subcategory-list button:hover, .subcategory-list button.selected { border-color: var(--store-primary); color: var(--store-primary); background: #fff3f1; }
.filter-toolbar { min-height: 48px; display: flex; align-items: center; justify-content: space-between; margin: 14px 0; padding: 0 12px; border: 1px solid #eee; background: #fff; }
.result-line { display: flex; align-items: baseline; gap: 12px; color: #888; font-size: 11px; }
.result-line strong { color: #444; font-size: 12px; font-weight: 550; }
.sort-options { display: flex; align-items: center; gap: 3px; }
.sort-options > span { margin-right: 5px; color: #999; font-size: 11px; }
.sort-options button { min-height: 30px; display: inline-flex; align-items: center; gap: 3px; padding: 0 10px; border: 0; color: #777; background: transparent; font-size: 11px; cursor: pointer; }
.sort-options button.active, .sort-options button:hover { color: var(--store-primary); }
.sort-options .van-icon { font-size: 10px; }
.product-grid { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 12px; }
@media (max-width: 1100px) and (min-width: 761px) { .category-layout { grid-template-columns: 180px minmax(0,1fr); gap: 25px; } .product-grid { grid-template-columns: repeat(3,minmax(0,1fr)); } }
@media (max-width: 760px) {
  .category-page { padding: 0 14px 25px; }
  .category-title { padding: 16px 0 20px; }
  .category-title h1 { margin-top: 13px; font-size: 24px; }
  .category-title p { font-size: 11px; }
  .category-layout { display: block; padding-top: 12px; }
  .category-rail { position: static; display: flex; gap: 6px; overflow-x: auto; padding: 4px 0 12px; border: 0; scrollbar-width: none; }
  .category-rail::-webkit-scrollbar { display: none; }
  .rail-item { width: auto; min-height: 34px; flex: 0 0 auto; gap: 5px; padding: 0 11px; border: 1px solid #e3e8e2; border-radius: 20px; background: #fff; font-size: 11px; }
  .rail-item.active { border-color: var(--store-primary); background: var(--store-primary); color: #fff; }
  .rail-item .van-icon { display: none; }
  .category-main-head { padding: 5px 0 13px; }
  .category-main-head h2 { font-size: 20px; }
  .category-main-head > a { padding: 7px; font-size: 10px; }
  .subcategory-list { gap: 6px; padding: 11px 0; }
  .subcategory-list button { min-height: 29px; padding: 0 10px; font-size: 10px; }
  .filter-toolbar { min-height: 42px; flex-direction: column; align-items: stretch; margin: 9px 0; padding: 7px 8px; }
  .result-line { padding: 3px 0 6px; }
  .sort-options { margin: 0 -4px; border-top: 1px solid #f3f3f3; }
  .sort-options > span { display: none; }
  .sort-options button { flex: 1; justify-content: center; min-height: 29px; padding: 0 4px; font-size: 10px; }
  .product-grid { grid-template-columns: repeat(2,minmax(0,1fr)); gap: 9px; }
}
</style>
