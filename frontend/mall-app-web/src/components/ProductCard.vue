<template>
  <router-link class="product-card" :to="`/product/${product.id}`" :aria-label="`${product.name}，¥${price}`">
    <div class="product-image">
      <img v-if="product.pic" :src="product.pic" :alt="product.name" loading="lazy" />
      <div v-else class="image-placeholder"><span>M</span><small>MALL SELECT</small></div>
      <span v-if="product.originalPrice && product.originalPrice > (product.price || 0)" class="product-badge">精选好价</span>
      <span class="view-product"><van-icon name="arrow" /></span>
    </div>
    <div class="product-info">
      <div class="product-category">{{ product.brandName || product.productCategoryName || 'Mall 商城' }}</div>
      <div class="product-name">{{ product.name }}</div>
      <div v-if="product.subTitle" class="product-subtitle">{{ product.subTitle }}</div>
      <div class="product-meta"><strong>¥{{ price }}</strong><del v-if="product.originalPrice && product.originalPrice > (product.price || 0)">¥{{ Number(product.originalPrice).toFixed(2) }}</del><span v-if="product.sale">已售 {{ product.sale }}</span></div>
    </div>
  </router-link>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Product } from '@/types/api'

const props = defineProps<{ product: Product }>()
const price = computed(() => Number(props.product.price || 0).toFixed(2))
</script>

<style scoped>
.product-card { min-width: 0; display: block; overflow: hidden; border: 1px solid #e8ebe5; background: #fff; color: var(--store-ink); transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease; }
.product-card:hover { transform: translateY(-4px); border-color: #d3ddd4; box-shadow: 0 12px 26px rgba(41,65,50,.09); }
.product-image { position: relative; overflow: hidden; aspect-ratio: 1 / 1.08; background: #eff1ed; }
.product-image img { width: 100%; height: 100%; display: block; object-fit: cover; transition: transform .45s cubic-bezier(.2,.7,.2,1); }
.product-card:hover .product-image img { transform: scale(1.045); }
.image-placeholder { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 7px; background: linear-gradient(135deg,#e9eee7,#f4f2eb); color: #839387; }
.image-placeholder span { font: 38px Georgia,serif; }
.image-placeholder small { font-size: 8px; letter-spacing: .2em; }
.product-badge { position: absolute; top: 12px; left: 12px; padding: 5px 8px; color: #fff; background: var(--store-accent); font-size: 10px; letter-spacing: .04em; }
.view-product { position: absolute; right: 12px; bottom: 12px; width: 34px; height: 34px; display: grid; place-items: center; border-radius: 50%; color: var(--store-primary); background: rgba(255,255,255,.94); opacity: 0; transform: translateY(4px); transition: opacity .2s, transform .2s; }
.product-card:hover .view-product { opacity: 1; transform: translateY(0); }
.product-info { padding: 15px 15px 16px; }
.product-category { overflow: hidden; color: #829087; font-size: 9px; letter-spacing: .12em; text-overflow: ellipsis; white-space: nowrap; }
.product-name { margin-top: 7px; overflow: hidden; font-size: 14px; font-weight: 550; line-height: 1.55; text-overflow: ellipsis; white-space: nowrap; }
.product-subtitle { margin-top: 3px; overflow: hidden; color: #89928c; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.product-meta { display: flex; align-items: baseline; gap: 8px; margin-top: 11px; }
.product-meta strong { color: var(--store-primary); font-size: 17px; font-weight: 650; }
.product-meta del { color: #a2aaa4; font-size: 11px; }
.product-meta span { margin-left: auto; color: #969e98; font-size: 10px; }
@media (max-width: 760px) {
  .product-card:hover { transform: none; box-shadow: none; }
  .product-badge { top: 7px; left: 7px; padding: 4px 6px; font-size: 9px; }
  .product-info { padding: 10px 9px 11px; }
  .product-category { font-size: 8px; }
  .product-name { margin-top: 5px; font-size: 12px; }
  .product-subtitle { font-size: 10px; }
  .product-meta { gap: 5px; margin-top: 8px; }
  .product-meta strong { font-size: 15px; }
  .product-meta span { font-size: 9px; }
  .view-product { display: none; }
}
@media (prefers-reduced-motion: reduce) { .product-card, .product-image img, .view-product { transition: none; } }
</style>
