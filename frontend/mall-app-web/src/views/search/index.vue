<template>
  <div class="search-page page-container">
    <div class="search-intro">
      <div class="breadcrumb"><router-link to="/">首页</router-link><van-icon name="arrow" /><span>搜索商品</span></div>
      <div class="search-title-row"><div><span class="overline">商品搜索</span><h1>搜索商品</h1><p>{{ keyword ? `“${keyword}” 的搜索结果` : '输入商品名称或品牌' }}</p></div><router-link to="/category">全部分类 <van-icon name="arrow" /></router-link></div>
      <form class="search-form" @submit.prevent="submitSearch"><van-icon name="search" /><input v-model="keyword" aria-label="搜索商品名称" placeholder="商品名称 / 品牌" /><button type="submit">搜索</button></form>
    </div>
    <div class="results-header"><div><strong>{{ keyword ? `“${keyword}”` : '全部商品' }}</strong><span>{{ total }} 件好物</span></div><div class="sort-options"><button v-for="option in sortOptions" :key="option.value" :class="{ active: sort === option.value }" @click="setSort(option.value)">{{ option.label }}<van-icon v-if="option.value === 3" name="arrow-down" /><van-icon v-if="option.value === 4" name="arrow-up" /></button></div></div>
    <van-skeleton v-if="loading && !products.length" title :row="3" />
    <van-list v-else v-model:loading="listLoading" :finished="finished" finished-text="已经看到这里了" @load="loadMore">
      <div class="product-grid"><ProductCard v-for="product in products" :key="product.id" :product="product" /></div>
      <van-empty v-if="finished && !products.length" description="暂时没有找到相关商品，试试换个关键词" />
    </van-list>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { searchProducts } from '@/api/product'
import type { Product } from '@/types/api'
import ProductCard from '@/components/ProductCard.vue'

const route = useRoute()
const router = useRouter()
const keyword = ref((route.query.keyword as string) || '')
const sort = ref(Number(route.query.sort) || 0)
const brandId = ref(Number(route.query.brandId) || undefined)
const products = ref<Product[]>([])
const pageNum = ref(0)
const pageSize = 12
const total = ref(0)
const loading = ref(false)
const listLoading = ref(false)
const finished = ref(false)
let requestVersion = 0
const inFlight = new Set<number>()
const sortOptions = [{ label: '综合', value: 0 }, { label: '新品', value: 1 }, { label: '销量', value: 2 }, { label: '价格', value: 3 }, { label: '价格', value: 4 }]

onMounted(() => { void reload() })
watch(() => [route.query.keyword, route.query.sort, route.query.brandId], ([nextKeyword, nextSort, nextBrandId]) => {
  keyword.value = (nextKeyword as string) || ''
  sort.value = Number(nextSort) || 0
  brandId.value = Number(nextBrandId) || undefined
  void reload()
})

function submitSearch() {
  router.push({ path: '/search', query: { ...route.query, keyword: keyword.value.trim() || undefined } })
}

function setSort(value: number) {
  sort.value = value
  router.replace({ query: { ...route.query, sort: value || undefined } })
  if (Number(route.query.sort || 0) === value) void reload()
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

async function loadMore(version = requestVersion) {
  if (finished.value) { listLoading.value = false; return }
  if (inFlight.has(version)) return
  inFlight.add(version)
  loading.value = true
  listLoading.value = true
  try {
    const page = await searchProducts({ keyword: keyword.value || undefined, brandId: brandId.value, pageNum: pageNum.value, pageSize, sort: sort.value })
    if (version !== requestVersion) return
    const items = page.list || []
    products.value.push(...items)
    total.value = page.total || products.value.length
    finished.value = pageNum.value + 1 >= (page.totalPage || 1) || items.length < pageSize
    pageNum.value += 1
  } catch { if (version === requestVersion) finished.value = true }
  finally {
    inFlight.delete(version)
    if (version === requestVersion) { loading.value = false; listLoading.value = false }
  }
}
</script>

<style scoped>
.search-page { padding-top: 24px; }
.search-intro { padding: 4px 0 27px; border-bottom: 1px solid #e6eae4; }
.breadcrumb { display: flex; align-items: center; gap: 8px; color: #929a94; font-size: 11px; }
.breadcrumb a:hover { color: var(--store-primary); }
.breadcrumb .van-icon { font-size: 9px; }
.search-title-row { display: flex; align-items: end; justify-content: space-between; margin-top: 20px; }
.overline { color: #8c978f; font-size: 9px; letter-spacing: .17em; }
.search-title-row h1 { margin: 6px 0; font-size: 24px; font-weight: 600; }
.search-title-row p { margin: 0; color: var(--store-muted); font-size: 12px; }
.search-title-row > a { display: inline-flex; align-items: center; gap: 7px; color: var(--store-primary); font-size: 12px; }
.search-form { width: min(640px,100%); height: 46px; display: flex; align-items: center; gap: 11px; margin-top: 20px; padding: 4px 5px 4px 14px; border: 1px solid #e3e8e2; background: #fff; }
.search-form > .van-icon { color: #8b968f; font-size: 17px; }
.search-form input { min-width: 0; flex: 1; border: 0; outline: none; color: var(--store-ink); background: transparent; font-size: 13px; }
.search-form button { height: 36px; min-width: 70px; border: 0; color: #fff; background: var(--store-primary); cursor: pointer; }
.results-header { display: flex; align-items: center; justify-content: space-between; padding: 19px 0 15px; }
.results-header > div:first-child { display: flex; align-items: center; gap: 12px; }
.results-header strong { font-size: 13px; font-weight: 550; }
.results-header span { color: #929a94; font-size: 11px; }
.sort-options { display: flex; align-items: center; gap: 5px; }
.sort-options button { min-height: 32px; display: inline-flex; align-items: center; gap: 4px; padding: 0 12px; border: 1px solid transparent; color: #737e77; background: transparent; font-size: 11px; cursor: pointer; }
.sort-options button:hover, .sort-options button.active { border-color: #dce5dc; color: var(--store-primary); background: #eef3ef; }
.sort-options button .van-icon { font-size: 10px; }
.product-grid { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 16px; }
@media (max-width: 980px) and (min-width: 761px) { .product-grid { grid-template-columns: repeat(3,minmax(0,1fr)); } }
@media (max-width: 760px) {
 .search-page { padding: 15px 14px 25px; }
 .search-intro { padding-bottom: 18px; }
 .search-title-row { margin-top: 15px; }
 .search-title-row h1 { font-size: 24px; }
 .search-title-row p { max-width: 230px; font-size: 11px; }
 .search-title-row > a { font-size: 10px; white-space: nowrap; }
 .search-form { height: 42px; margin-top: 14px; }
 .search-form button { height: 32px; min-width: 58px; font-size: 12px; }
 .results-header { align-items: flex-start; flex-direction: column; gap: 9px; padding: 14px 0 10px; }
 .sort-options { width: 100%; gap: 0; }
 .sort-options button { min-height: 30px; padding: 0 10px; }
 .product-grid { grid-template-columns: repeat(2,minmax(0,1fr)); gap: 9px; }
}
</style>
