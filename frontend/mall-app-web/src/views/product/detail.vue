<template>
  <div class="detail page-container" v-if="detail">
    <van-nav-bar :title="detail.product?.name || '商品详情'" left-arrow @click-left="$router.back()" />
    <div class="product-overview">
      <img class="cover" :src="detail.product?.pic" :alt="detail.product?.name" />
      <div class="product-column">
        <div class="head">
          <div class="brand-name">{{ detail.brand?.name || detail.product?.brandName || 'MALL 精选' }}</div>
          <div class="price-row">
            <span class="price">¥{{ (detail.product?.price ?? 0).toFixed(2) }}</span>
            <span class="original" v-if="detail.product?.originalPrice">¥{{ detail.product.originalPrice.toFixed(2) }}</span>
            <span class="sale">已售{{ detail.product?.sale || 0 }}</span>
          </div>
          <div class="name">{{ detail.product?.name }}</div>
          <div class="sub">{{ detail.product?.subTitle }}</div>
          <div class="desktop-badges"><span>精选好物</span><span>品质保障</span><span>贴心售后</span></div>
        </div>
        <div class="spec-card">
          <van-cell title="选择规格" :value="selectedSkuText || '默认规格'" is-link @click="showSku = true" />
          <van-cell title="品牌" :value="detail.brand?.name || '-'" />
          <van-cell title="库存" :value="String(selectedSku?.stock ?? detail.product?.stock ?? '-')" />
        </div>
        <div class="desktop-buy-actions">
          <van-button type="primary" @click="handleAddCart">加入购物车</van-button>
          <van-button type="danger" @click="handleBuy">立即购买</van-button>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">商品详情</div>
      <div class="rich" v-html="detail.product?.detailHtml"></div>
    </div>

    <van-action-bar>
      <van-action-bar-icon icon="cart-o" text="购物车" @click="$router.push('/cart')" />
      <van-action-bar-button type="warning" text="加入购物车" @click="handleAddCart" />
      <van-action-bar-button type="danger" text="立即购买" @click="handleBuy" />
    </van-action-bar>

    <van-popup v-model:show="showSku" position="bottom" round>
      <div class="sku-popup">
        <div class="sku-title">选择规格</div>
        <van-radio-group v-model="selectedSkuId">
          <van-cell v-for="sku in skuList" :key="sku.id" clickable @click="selectedSkuId = sku.id">
            <template #title>
              <span>{{ skuText(sku) }}</span>
            </template>
            <template #right-icon>
              <van-radio :name="sku.id" />
            </template>
          </van-cell>
        </van-radio-group>
        <div style="padding: 12px">
          <van-button type="danger" block round @click="showSku = false">确定</van-button>
        </div>
      </div>
    </van-popup>
  </div>
  <van-loading v-else class="page-loading" vertical>加载中...</van-loading>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showSuccessToast, showToast } from 'vant'
import { getProductDetail } from '@/api/product'
import { addCart } from '@/api/cart'
import { useUserStore } from '@/stores/user'
import type { ProductDetail, SkuStock } from '@/types/api'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const detail = ref<ProductDetail | null>(null)
const showSku = ref(false)
const selectedSkuId = ref<number>(0)

const skuList = computed(() => detail.value?.skuStockList || [])
const selectedSku = computed(() => skuList.value.find((s) => s.id === selectedSkuId.value))
const selectedSkuText = computed(() => (selectedSku.value ? skuText(selectedSku.value) : ''))

function skuText(sku: SkuStock): string {
  try {
    const attrs = JSON.parse(sku.spData || '[]') as { key: string; value: string }[]
    return attrs.map((a) => `${a.value}`).join(' / ') || `SKU#${sku.id}`
  } catch {
    return `SKU#${sku.id}`
  }
}

onMounted(async () => {
  try {
    detail.value = await getProductDetail(Number(route.params.id))
    if (skuList.value.length) {
      selectedSkuId.value = skuList.value[0].id
    }
  } catch {
    /* 拦截器已提示 */
  }
})

function ensureSku(): boolean {
  if (!selectedSku.value) {
    showSku.value = true
    showToast('请先选择规格')
    return false
  }
  return true
}

async function addSelectedToCart(): Promise<number | null> {
  if (!ensureSku() || !detail.value) return null
  if (!userStore.isLogin) {
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return null
  }
  return addCart({
    productId: detail.value.product.id,
    productSkuId: selectedSku.value!.id,
    quantity: 1,
  })
}

async function handleAddCart() {
  const cartId = await addSelectedToCart()
  if (!cartId) return
  showSuccessToast('已加入购物车')
}

async function handleBuy() {
  const cartId = await addSelectedToCart()
  if (!cartId) return
  userStore.setCheckout([cartId], null)
  router.push('/order/confirm')
}
</script>

<style scoped>
.detail { padding-top: 10px; }
.product-overview { display: grid; grid-template-columns: minmax(0,1.08fr) minmax(400px,.92fr); align-items: start; gap: 42px; padding: 24px; background: #fff; }
.cover {
  width: 100%;
  aspect-ratio: 1 / .92;
  object-fit: cover;
  display: block;
  background: #f5f5f5;
}
.product-column { min-width: 0; }
.head {
  background: #fff;
  padding: 16px 5px 21px;
  border-bottom: 1px solid #e9ece7;
}
.brand-name { margin-bottom: 20px; color: #819087; font-size: 10px; letter-spacing: .16em; }
.price-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.price {
  color: var(--store-primary);
  font-size: 28px;
  font-weight: 600;
}
.original {
  color: #999;
  text-decoration: line-through;
  font-size: 13px;
}
.sale {
  margin-left: auto;
  color: #999;
  font-size: 12px;
}
.name {
  margin-top: 12px;
  font-size: 21px;
  font-weight: 600;
  line-height: 1.45;
}
.sub {
  margin-top: 7px;
  color: #7e8881;
  font-size: 13px;
  line-height: 1.7;
}
.desktop-badges { display: flex; gap: 8px; margin-top: 18px; }
.desktop-badges span { padding: 6px 10px; color: #557062; background: #f0f4ef; font-size: 10px; }
.spec-card { padding: 5px 0; border-bottom: 1px solid #e9ece7; }
.desktop-buy-actions { display: flex; gap: 10px; padding: 20px 0; }
.desktop-buy-actions .van-button { min-width: 140px; height: 44px; border-radius: 2px; }
.desktop-buy-actions .van-button--primary { color: var(--store-primary); border-color: var(--store-primary); background: #fff; }
.desktop-buy-actions .van-button--danger { background: var(--store-primary); border-color: var(--store-primary); }
.section {
  margin-top: 22px;
  background: #fff;
  padding: 26px 34px;
}
.section-title {
  padding-bottom: 15px;
  border-bottom: 1px solid #e9ece7;
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 18px;
}
.rich :deep(img) {
  max-width: 100%;
  display: block;
  margin: 0 auto;
}
.rich :deep(p) { line-height: 1.8; }
.sku-popup {
  padding: 16px 0 8px;
}
.sku-title {
  text-align: center;
  font-weight: 600;
  margin-bottom: 8px;
}
.page-loading {
  padding: 100px 0;
}
@media (min-width: 761px) {
  .detail > :deep(.van-nav-bar) { display: none; }
  .detail > :deep(.van-action-bar) { display: none; }
  .detail > :deep(.van-popup) { max-width: 640px; left: 50%; transform: translateX(-50%); }
}
@media (max-width: 760px) {
  .detail { padding-top: 0; padding-bottom: 60px; }
  .product-overview { display: block; padding: 0; background: transparent; }
  .cover { aspect-ratio: 1; }
  .head { margin: 8px 0; padding: 15px; }
  .brand-name { margin-bottom: 12px; }
  .price { font-size: 22px; }
  .name { margin-top: 7px; font-size: 16px; font-weight: 600; }
  .sub { font-size: 12px; }
  .desktop-badges, .desktop-buy-actions { display: none; }
  .spec-card { margin-top: 8px; border: 0; background: #fff; }
  .section { margin-top: 9px; padding: 16px 13px; }
  .section-title { padding-bottom: 10px; font-size: 16px; }
  .detail :deep(.van-action-bar) { bottom: 0; }
}
</style>
