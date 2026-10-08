<template>
  <div class="confirm page-container">
    <van-nav-bar title="确认订单" left-arrow @click-left="$router.back()" />

    <van-cell-group inset title="收货地址" style="margin-top: 12px">
      <van-cell
        :title="address ? address.name : '请选择收货地址'"
        :label="address ? `${address.phoneNumber} ${address.province || ''}${address.city || ''}${address.region || ''}${address.detailAddress || ''}` : '点击选择'"
        is-link
        @click="showPicker = true"
      />
    </van-cell-group>

    <van-cell-group inset title="商品清单" style="margin-top: 12px">
      <div v-for="item in items" :key="item.id" class="goods-item">
        <img :src="item.productPic" />
        <div class="info">
          <div class="name">{{ item.productName }}</div>
          <div class="attr">{{ item.productAttr }}</div>
          <div class="bottom">
            <span class="price">¥{{ item.price?.toFixed(2) }}</span>
            <span>x{{ item.quantity }}</span>
          </div>
        </div>
      </div>
    </van-cell-group>

    <van-cell-group inset title="支付方式" style="margin-top: 12px">
      <van-radio-group v-model="payType">
        <van-cell title="支付宝" clickable @click="payType = 1">
          <template #right-icon><van-radio :name="1" /></template>
        </van-cell>
        <van-cell title="微信支付" clickable @click="payType = 2">
          <template #right-icon><van-radio :name="2" /></template>
        </van-cell>
      </van-radio-group>
    </van-cell-group>

    <div class="submit-bar">
      <div class="total">
        合计：<span class="price">¥{{ totalPrice.toFixed(2) }}</span>
      </div>
      <van-button type="danger" round :loading="submitting" :disabled="!address" @click="handleSubmit">提交订单</van-button>
    </div>

    <van-popup v-model:show="showPicker" position="bottom" round>
      <van-picker
        :columns="addressColumns"
        @confirm="onAddressConfirm"
        @cancel="showPicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showSuccessToast, showToast } from 'vant'
import { getAddressList, generateOrder } from '@/api/order'
import { deleteCartItems } from '@/api/cart'
import { useUserStore } from '@/stores/user'
import type { CartItem, MemberAddress } from '@/types/api'

const router = useRouter()
const userStore = useUserStore()

const items = ref<CartItem[]>([])
const addresses = ref<MemberAddress[]>([])
const address = ref<MemberAddress | null>(null)
const showPicker = ref(false)
const payType = ref(1)
const submitting = ref(false)

const addressColumns = computed(() =>
  addresses.value.map((a) => ({ text: `${a.name} ${a.phoneNumber}`, value: a.id })),
)

const totalPrice = computed(() => items.value.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0))

onMounted(async () => {
  const ids = userStore.checkoutCartIds
  if (!ids.length) {
    showToast('请先在购物车选择商品')
    router.replace('/cart')
    return
  }
  // 从购物车接口拉取选中项明细用于展示
  try {
    const all = (await import('@/api/cart')).getCartList
    const list = (await all()) || []
    items.value = list.filter((i) => ids.includes(i.id))
  } catch {
    /* 拦截器已提示 */
  }
  try {
    addresses.value = (await getAddressList()) || []
    // 默认选中默认地址
    address.value = addresses.value.find((a) => a.defaultStatus === 1) || addresses.value[0] || null
  } catch {
    /* 无地址时提示用户选择 */
  }
})

function onAddressConfirm({ selectedOptions }: { selectedOptions: { text: string; value: number }[] }) {
  address.value = addresses.value.find((a) => a.id === selectedOptions[0]?.value) || null
  showPicker.value = false
}

async function handleSubmit() {
  if (!address.value) {
    showToast('请选择收货地址')
    return
  }
  submitting.value = true
  try {
    await generateOrder({
      memberReceiveAddressId: address.value.id,
      cartIds: userStore.checkoutCartIds,
      payType: payType.value,
    })
    showSuccessToast('下单成功')
    // 下单成功后移除已结算的购物车项
    try {
      await deleteCartItems([...userStore.checkoutCartIds])
    } catch {
      /* 忽略清理失败 */
    }
    userStore.setCheckout([], null)
    router.replace('/order/list')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.confirm {
  width: min(920px, calc(100% - 64px));
  padding-top: 12px;
  padding-bottom: 100px;
}
.goods-item {
  display: flex;
  gap: 10px;
  padding: 10px 16px;
  background: #fff;
}
.goods-item img {
  width: 70px;
  height: 70px;
  border-radius: 6px;
  object-fit: cover;
  background: #f5f5f5;
}
.info {
  flex: 1;
  min-width: 0;
}
.name {
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.attr {
  color: #999;
  font-size: 12px;
  margin: 4px 0;
}
.bottom {
  display: flex;
  justify-content: space-between;
}
.price {
  color: var(--store-primary);
  font-weight: 600;
}
.submit-bar {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  width: min(920px, calc(100% - 64px));
  bottom: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  padding: 8px 16px;
  border: 1px solid #e6eae4;
  box-shadow: 0 -8px 25px rgba(31,55,43,.06);
}
.total .price {
  color: var(--store-primary);
  font-weight: 600;
  font-size: 18px;
}
.submit-bar .van-button { border-radius: 2px; background: var(--store-primary); }
@media (max-width: 760px) {
  .confirm { width: auto; padding: 0 0 80px; }
  .confirm :deep(.van-nav-bar) { margin: 0 -14px; }
  .confirm :deep(.van-cell-group--inset) { margin-left: 0; margin-right: 0; }
  .submit-bar { left: 0; width: 100%; transform: none; }
}
</style>
