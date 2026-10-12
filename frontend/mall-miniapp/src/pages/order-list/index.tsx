import React, { useEffect, useRef, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { usePullDownRefresh, useReachBottom } from '@tarojs/taro'
import classnames from 'classnames'
import { getOrderList } from '@/services/order'
import { useUserStore } from '@/store/user'
import { ORDER_STATUS_COLOR, ORDER_STATUS_MAP, type Order } from '@/types/api'
import { formatPrice } from '@/utils/format'
import dayjs from 'dayjs'
import Empty from '@/components/Empty'
import SmartImage from '@/components/SmartImage'
import styles from './index.module.scss'

const STATUS_TABS = [
  { key: -1, label: '全部' },
  { key: 0, label: '待付款' },
  { key: 1, label: '待发货' },
  { key: 2, label: '已发货' },
  { key: 3, label: '已完成' },
]

const PAGE_SIZE = 5

function OrderListPage() {
  const isLogin = useUserStore((s) => !!s.token)
  const [active, setActive] = useState(-1)
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const pageRef = useRef(1)

  const load = async (status: number, pageNum: number) => {
    setLoading(true)
    try {
      const page = await getOrderList({ status, pageNum, pageSize: PAGE_SIZE })
      pageRef.current = pageNum
      setTotal(page.total || 0)
      setOrders((prev) => (pageNum === 1 ? page.list || [] : [...prev, ...(page.list || [])]))
    } catch (e) {
      console.error('[Order] load list failed:', e)
      if (pageNum === 1) setOrders([])
    } finally {
      setLoading(false)
      setLoaded(true)
      Taro.stopPullDownRefresh()
    }
  }

  useEffect(() => {
    const params = Taro.getCurrentInstance().params || {}
    const status = Number(params.status ?? -1)
    const tab = STATUS_TABS.some((t) => t.key === status) ? status : -1
    setActive(tab)
    if (useUserStore.getState().token) {
      load(tab, 1)
    } else {
      setLoaded(true)
    }
  }, [])

  usePullDownRefresh(() => {
    if (isLogin) load(active, 1)
  })

  useReachBottom(() => {
    if (!isLogin || loading) return
    if (orders.length >= total) return
    load(active, pageRef.current + 1)
  })

  const selectTab = (key: number) => {
    if (key === active) return
    setActive(key)
    setOrders([])
    load(key, 1)
  }

  const handlePay = () => {
    Taro.showToast({ title: '在线支付即将开通，敬请期待', icon: 'none' })
  }

  const goProduct = (productId: number) => {
    if (!productId) return
    Taro.navigateTo({ url: `/pages/product/index?id=${productId}` }).catch((err) =>
      console.error('[Order] navigate product failed:', err),
    )
  }

  if (!isLogin) {
    return (
      <View className={styles.page}>
        <Empty
          icon="lock"
          text="登录后查看订单"
          hint="登录后可查看订单状态和物流"
          actionText="去登录"
          onAction={() => Taro.navigateTo({ url: '/pages/login/index' })}
        />
      </View>
    )
  }

  return (
    <View className={styles.page}>
      {/* 状态 tab */}
      <ScrollView className={styles.tabBar} scrollX showScrollbar={false}>
        <View className={styles.tabRow}>
          {STATUS_TABS.map((tab) => (
            <View
              key={tab.key}
              className={classnames(styles.tabItem, active === tab.key && styles.tabActive)}
              onClick={() => selectTab(tab.key)}
            >
              <Text className={styles.tabText}>{tab.label}</Text>
              <View className={styles.tabUnderline} />
            </View>
          ))}
        </View>
      </ScrollView>

      {orders.length ? (
        <View className={styles.list}>
          {orders.map((order) => {
            const statusText = ORDER_STATUS_MAP[order.status ?? 0] || '未知状态'
            const statusColor = ORDER_STATUS_COLOR[order.status ?? 0] || '#86909c'
            return (
              <View key={order.id} className={styles.orderCard}>
                <View className={styles.orderHead}>
                  <Text className={styles.orderSn}>订单号 {order.orderSn || order.id}</Text>
                  <Text className={styles.orderStatus} style={{ color: statusColor }}>
                    {statusText}
                  </Text>
                </View>
                {!!order.createTime && (
                  <Text className={styles.orderTime}>{dayjs(order.createTime).format('YYYY-MM-DD HH:mm:ss')}</Text>
                )}
                {(order.itemList || []).map((item) => (
                  <View key={item.id} className={styles.orderItem} onClick={() => goProduct(item.productId || 0)}>
                    <SmartImage className={styles.itemPic} type="product" pic={item.productPic} name={item.productName} lazyLoad />
                    <View className={styles.itemInfo}>
                      <Text className={styles.itemName}>{item.productName}</Text>
                      {!!item.productAttr && <Text className={styles.itemAttr}>{item.productAttr}</Text>}
                      <View className={styles.itemBottom}>
                        <Text className={styles.itemPrice}>¥{formatPrice(item.productPrice)}</Text>
                        <Text className={styles.itemQty}>×{item.productQuantity || 1}</Text>
                      </View>
                    </View>
                  </View>
                ))}
                <View className={styles.orderFooter}>
                  <Text className={styles.orderTotalLabel}>
                    共 {(order.itemList || []).reduce((sum, i) => sum + (i.productQuantity || 1), 0)} 件
                  </Text>
                  <Text className={styles.orderTotalLabel}>合计：</Text>
                  <Text className={styles.orderTotalAmount}>¥{formatPrice(order.payAmount ?? order.totalAmount)}</Text>
                  {order.status === 0 && (
                    <View className={styles.payBtn} onClick={handlePay}>
                      <Text className={styles.payBtnText}>去支付</Text>
                    </View>
                  )}
                </View>
              </View>
            )
          })}
        </View>
      ) : loaded && !loading ? (
        <Empty
          icon="package"
          text="暂无相关订单"
          hint="去逛逛心仪的好物吧"
          actionText="去逛逛"
          onAction={() => Taro.switchTab({ url: '/pages/index/index' })}
        />
      ) : null}

      {loading && <View className={styles.loadingText}>加载中…</View>}
      {!loading && orders.length > 0 && orders.length >= total && (
        <View className={styles.loadingText}>— 没有更多了 —</View>
      )}
    </View>
  )
}

export default OrderListPage
