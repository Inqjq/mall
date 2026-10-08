<template>
  <div class="order-list page-container">
    <van-nav-bar title="我的订单" left-arrow @click-left="$router.back()" />
    <van-tabs v-model:active="activeTab" @change="onTabChange">
      <van-tab title="全部" :name="-1" />
      <van-tab v-for="(label, key) in STATUS_TABS" :key="key" :title="label" :name="key" />
    </van-tabs>
    <van-list v-model:loading="loading" :finished="finished" finished-text="没有更多了" @load="loadMore">
      <div v-for="order in orders" :key="order.id" class="order-card">
        <div class="head">
          <span class="sn">订单号：{{ order.orderSn }}</span>
          <span class="status">{{ ORDER_STATUS_MAP[order.status ?? -1] || '-' }}</span>
        </div>
        <div v-for="item in order.itemList || []" :key="item.id" class="goods">
          <img :src="item.productPic" />
          <div class="info">
            <div class="name">{{ item.productName }}</div>
            <div class="qty">x{{ item.productQuantity }}</div>
          </div>
          <div class="price">¥{{ item.productPrice?.toFixed(2) }}</div>
        </div>
        <div class="foot">
          <span>{{ order.createTime }}</span>
          <span class="amount">合计：<em>¥{{ order.payAmount?.toFixed(2) ?? order.totalAmount?.toFixed(2) }}</em></span>
        </div>
      </div>
      <van-empty v-if="finished && !orders.length" description="暂无订单" />
    </van-list>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getOrderList } from '@/api/order'
import { ORDER_STATUS_MAP, type Order } from '@/types/api'

const route = useRoute()
const router = useRouter()

// tabs 用到的状态（全部=-1）
const STATUS_TABS: Record<number, string> = {
  0: '待付款',
  1: '待发货',
  2: '已发货',
  3: '已完成',
}

const activeTab = ref<number>(route.query.status === undefined ? -1 : Number(route.query.status))
const orders = ref<Order[]>([])
const pageNum = ref(1)
const pageSize = 10
const loading = ref(false)
const finished = ref(false)

watch(() => route.query.status, (value, oldValue) => {
  if (value === oldValue) return
  const status = value === undefined ? -1 : Number(value)
  activeTab.value = status
  reload()
})

function onTabChange(status: number) {
  activeTab.value = status
  router.replace({ query: { ...route.query, status: status < 0 ? undefined : String(status) } })
}

function reload() {
  orders.value = []
  pageNum.value = 1
  finished.value = false
  loadMore()
}

async function loadMore() {
  loading.value = true
  try {
    const page = await getOrderList({ status: activeTab.value, pageNum: pageNum.value, pageSize })
    const list = page.list || []
    orders.value.push(...list)
    finished.value = list.length < pageSize
    pageNum.value += 1
  } catch {
    finished.value = true
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.order-list { width: min(1020px, calc(100% - 64px)); padding-top: 12px; padding-bottom: 35px; }
.order-card {
  background: #fff;
  border: 1px solid #e7ebe5;
  margin: 12px 0;
  padding: 17px 20px;
}
.head {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  margin-bottom: 8px;
}
.status {
  color: var(--store-primary);
}
.goods {
  display: flex;
  gap: 10px;
  padding: 6px 0;
  align-items: center;
}
.goods img {
  width: 56px;
  height: 56px;
  border-radius: 6px;
  object-fit: cover;
  background: #f5f5f5;
}
.goods .info {
  flex: 1;
  min-width: 0;
}
.goods .name {
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.qty {
  color: #999;
  font-size: 12px;
  margin-top: 4px;
}
.price {
  font-size: 13px;
  font-weight: 600;
}
.foot {
  display: flex;
  justify-content: space-between;
  color: #999;
  font-size: 12px;
  border-top: 1px solid #f5f5f5;
  padding-top: 8px;
  margin-top: 4px;
}
.foot em {
  color: var(--store-primary);
  font-style: normal;
  font-weight: 600;
}
@media (max-width: 760px) {
  .order-list { width: auto; padding: 0 0 25px; }
  .order-list :deep(.van-nav-bar) { margin: 0 -14px; }
  .order-card { margin: 9px 0; padding: 12px; }
  .head { font-size: 11px; }
  .sn { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
}
</style>
