import React, { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro'
import classnames from 'classnames'
import { deleteCartItems, getCartList, refreshCartBadge, updateCartQuantity } from '@/services/cart'
import { useUserStore } from '@/store/user'
import type { CartItem } from '@/types/api'
import { formatPrice } from '@/utils/format'
import QuantityStepper from '@/components/QuantityStepper'
import Empty from '@/components/Empty'
import SmartImage from '@/components/SmartImage'
import styles from './index.module.scss'

function CartPage() {
  const isLogin = useUserStore((s) => !!s.token)
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [checked, setChecked] = useState<Set<number>>(new Set())

  const load = async () => {
    if (!useUserStore.getState().token) {
      setItems([])
      return
    }
    setLoading(true)
    try {
      const list = await getCartList()
      setItems(list || [])
      setChecked(new Set((list || []).map((i) => i.id)))
    } catch (e) {
      console.error('[Cart] load list failed:', e)
    } finally {
      setLoading(false)
      Taro.stopPullDownRefresh()
    }
  }

  useDidShow(() => {
    load()
    refreshCartBadge()
  })

  usePullDownRefresh(() => {
    load()
  })

  const toggleItem = (id: number) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allChecked = items.length > 0 && items.every((i) => checked.has(i.id))

  const toggleAll = () => {
    setChecked(allChecked ? new Set() : new Set(items.map((i) => i.id)))
  }

  const changeQuantity = async (item: CartItem, quantity: number) => {
    // 乐观更新
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, quantity } : i)))
    try {
      await updateCartQuantity(item.id, quantity)
      refreshCartBadge()
    } catch (e) {
      console.error('[Cart] update quantity failed:', e)
      load()
    }
  }

  const deleteChecked = async () => {
    const ids = [...checked]
    if (!ids.length) {
      Taro.showToast({ title: '请先选择商品', icon: 'none' })
      return
    }
    const res = await Taro.showModal({ title: '提示', content: `确定删除选中的 ${ids.length} 类商品吗？` })
    if (!res.confirm) return
    try {
      await deleteCartItems(ids)
      Taro.showToast({ title: '删除成功', icon: 'success' })
      await load()
      refreshCartBadge()
    } catch (e) {
      console.error('[Cart] delete failed:', e)
    }
  }

  const checkedItems = items.filter((i) => checked.has(i.id))
  const totalQuantity = checkedItems.reduce((sum, i) => sum + (i.quantity || 1), 0)
  const totalAmount = checkedItems.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0)

  const goCheckout = () => {
    if (!totalQuantity) {
      Taro.showToast({ title: '请先选择商品', icon: 'none' })
      return
    }
    const ids = checkedItems.map((i) => i.id).join(',')
    Taro.navigateTo({ url: `/pages/order-confirm/index?cartIds=${ids}` }).catch((err) =>
      console.error('[Cart] navigate confirm failed:', err),
    )
  }

  const goLogin = () => {
    Taro.navigateTo({ url: '/pages/login/index' }).catch((err) => console.error('[Cart] navigate login failed:', err))
  }

  if (!isLogin) {
    return (
      <View className={styles.page}>
        <Empty
          icon="lock"
          text="登录后查看购物车"
          hint="登录后可同步购物车、下单结算"
          actionText="去登录"
          onAction={goLogin}
        />
      </View>
    )
  }

  return (
    <View className={styles.page}>
      {!!items.length && (
        <View className={styles.topBar}>
          <Text className={styles.topCount}>共 {items.length} 类商品</Text>
          <Text className={styles.editBtn} onClick={() => setEditing(!editing)}>
            {editing ? '完成' : '管理'}
          </Text>
        </View>
      )}

      {loading && !items.length ? (
        <View className={styles.loading}>
          <Text className={styles.loadingText}>加载中…</Text>
        </View>
      ) : items.length ? (
        <View className={styles.list}>
          {items.map((item) => (
            <View key={item.id} className={styles.itemCard}>
              <View
                className={classnames(styles.checkbox, checked.has(item.id) && styles.checkboxChecked)}
                onClick={() => toggleItem(item.id)}
              >
                {checked.has(item.id) && <Text className={styles.checkMark}>✓</Text>}
              </View>
              <View onClick={() => Taro.navigateTo({ url: `/pages/product/index?id=${item.productId}` })}>
                <SmartImage
                  className={styles.itemPic}
                  type="product"
                  pic={item.productPic}
                  name={item.productName}
                  lazyLoad
                />
              </View>
              <View className={styles.itemInfo}>
                <Text className={styles.itemName}>{item.productName}</Text>
                {!!item.productAttr && <Text className={styles.itemAttr}>{item.productAttr}</Text>}
                <View className={styles.itemBottom}>
                  <Text className={styles.itemPrice}>¥{formatPrice(item.price)}</Text>
                  <QuantityStepper
                    small
                    value={item.quantity || 1}
                    min={1}
                    max={999}
                    onChange={(v) => changeQuantity(item, v)}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <Empty
          icon="cart"
          text="购物车还是空的"
          hint="快去挑选心仪的好物吧"
          actionText="去逛逛"
          onAction={() => Taro.switchTab({ url: '/pages/index/index' })}
        />
      )}

      {!!items.length && (
        <View className={styles.bottomBar}>
          <View className={styles.checkAll} onClick={toggleAll}>
            <View className={classnames(styles.checkbox, allChecked && styles.checkboxChecked)}>
              {allChecked && <Text className={styles.checkMark}>✓</Text>}
            </View>
            <Text className={styles.checkAllText}>全选</Text>
          </View>
          {editing ? (
        <View className={styles.deleteBtn} onClick={deleteChecked}>
            <Text className={styles.deleteBtnText}>删除({checkedItems.length})</Text>
        </View>
      ) : (
        <View className={styles.checkoutBtn} onClick={goCheckout}>
          <Text className={styles.checkoutText}>去结算({totalQuantity})</Text>
          <Text className={styles.checkoutAmount}>¥{formatPrice(totalAmount)}</Text>
        </View>
      )}
        </View>
      )}
    </View>
  )
}

export default CartPage
