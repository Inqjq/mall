<template>
  <div class="cart page-container">
    <van-nav-bar title="购物车" />
    <van-checkbox-group v-model="checkedIds">
      <div v-for="item in items" :key="item.id" class="cart-item">
        <van-checkbox :name="item.id" />
        <img :src="item.productPic" @click="$router.push(`/product/${item.productId}`)" />
        <div class="info">
          <div class="name" @click="$router.push(`/product/${item.productId}`)">{{ item.productName }}</div>
          <div class="attr">{{ item.productAttr }}</div>
          <div class="bottom">
            <span class="price">¥{{ item.price?.toFixed(2) }}</span>
            <van-stepper :model-value="item.quantity" min="1" integer @change="(q: number) => changeQty(item, q)" />
          </div>
        </div>
      </div>
    </van-checkbox-group>
    <van-empty v-if="!items.length" description="购物车是空的，去逛逛吧">
      <van-button round type="danger" size="small" @click="$router.push('/')">去逛逛</van-button>
    </van-empty>

    <div class="submit-bar" v-if="items.length">
      <van-checkbox v-model="checkAll">全选</van-checkbox>
      <button class="delete-selected" :disabled="!checkedIds.length" @click="deleteChecked">删除所选</button>
      <div class="total">
        合计：<span class="price">¥{{ totalPrice.toFixed(2) }}</span>
      </div>
      <van-button type="danger" round :disabled="!checkedIds.length" @click="goConfirm">去结算({{ checkedIds.length }})</van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { showConfirmDialog, showSuccessToast } from 'vant'
import { getCartList, deleteCartItems, updateCartQuantity } from '@/api/cart'
import { useUserStore } from '@/stores/user'
import type { CartItem } from '@/types/api'

const router = useRouter()
const userStore = useUserStore()
const items = ref<CartItem[]>([])
const checkedIds = ref<number[]>([])
const checkAll = ref(false)

const totalPrice = computed(() =>
  items.value.filter((i) => checkedIds.value.includes(i.id)).reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0),
)

watch(checkAll, (val) => {
  checkedIds.value = val ? items.value.map((i) => i.id) : []
})

onMounted(load)

async function load() {
  try {
    items.value = (await getCartList()) || []
  } catch {
    /* 拦截器已提示 */
  }
}

async function changeQty(item: CartItem, quantity: number) {
  await updateCartQuantity(item.id, quantity)
  item.quantity = quantity
}

function goConfirm() {
  const selected = items.value.filter((i) => checkedIds.value.includes(i.id))
  userStore.setCheckout(checkedIds.value, null)
  router.push({ path: '/order/confirm', query: { total: totalPrice.value.toFixed(2) } })
  void selected
}

// 暴露长按删除（简化为数量为0不允许；提供清空勾选删除入口在"我的"页）
async function deleteChecked() {
  await showConfirmDialog({ title: '提示', message: '删除所选购物车商品？' })
  await deleteCartItems(checkedIds.value)
  showSuccessToast('已删除')
  checkedIds.value = []
  await load()
}
defineExpose({ deleteChecked })
</script>

<style scoped>
.cart {
  width: min(1000px, calc(100% - 64px));
  padding-top: 12px;
  padding-bottom: 95px;
  min-height: calc(100vh - 50px);
}
.cart-item {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff;
  padding: 10px;
  margin-top: 8px;
}
.cart-item img {
  width: 80px;
  height: 80px;
  border-radius: 6px;
  object-fit: cover;
  background: #f5f5f5;
  cursor: pointer;
}
.info {
  flex: 1;
  min-width: 0;
}
.name {
  font-size: 13px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  cursor: pointer;
}
.attr {
  color: #999;
  font-size: 12px;
  margin: 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.price {
  color: var(--store-primary);
  font-weight: 600;
}
.submit-bar {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  width: min(1000px, calc(100% - 64px));
  bottom: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  background: #fff;
  padding: 14px 18px;
  border: 1px solid #e6eae4;
  box-shadow: 0 -8px 25px rgba(31,55,43,.06);
}
.submit-bar .van-button {
  padding: 0 24px;
  border-radius: 2px;
  background: var(--store-primary);
}
.delete-selected { margin-right: auto; border: 0; color: #8b6558; background: transparent; font-size: 12px; cursor: pointer; }
.delete-selected:disabled { color: #adb4af; cursor: not-allowed; }
.total { color: #606b64; font-size: 13px; }
@media (max-width: 760px) {
  .cart { width: auto; padding: 0 0 110px; }
  .cart :deep(.van-nav-bar) { margin: 0 -14px; }
  .cart-item { margin-top: 8px; }
  .submit-bar { left: 0; bottom: 50px; width: 100%; transform: none; gap: 8px; padding: 8px 10px; }
  .submit-bar .van-checkbox { flex: 0 0 auto; }
  .delete-selected { display: none; }
  .total { margin-left: auto; font-size: 11px; white-space: nowrap; }
  .submit-bar .van-button { padding: 0 13px; min-width: 94px; height: 36px; font-size: 12px; }
}
</style>
