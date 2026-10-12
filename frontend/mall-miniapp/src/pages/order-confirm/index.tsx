import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import { getAddressList, generateOrder } from '@/services/order'
import { deleteCartItems, getCartList, refreshCartBadge } from '@/services/cart'
import type { CartItem, MemberAddress } from '@/types/api'
import { formatPrice } from '@/utils/format'
import Empty from '@/components/Empty'
import Icon from '@/components/Icon'
import SmartImage from '@/components/SmartImage'
import styles from './index.module.scss'

const PAY_OPTIONS = [
  { key: 2, label: '微信支付', icon: 'wallet', color: '#07c160' },
  { key: 1, label: '支付宝', icon: 'wallet', color: '#1677ff' },
]

function OrderConfirmPage() {
  const [cartIds, setCartIds] = useState<number[]>([])
  const [items, setItems] = useState<CartItem[]>([])
  const [addresses, setAddresses] = useState<MemberAddress[]>([])
  const [address, setAddress] = useState<MemberAddress | null>(null)
  const [addressVisible, setAddressVisible] = useState(false)
  const [payType, setPayType] = useState(2)
  const [submitting, setSubmitting] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const params = Taro.getCurrentInstance().params || {}
    const ids = String(params.cartIds || '')
      .split(',')
      .map((v) => Number(v))
      .filter((v) => v > 0)
    setCartIds(ids)
    ;(async () => {
      if (!ids.length) {
        Taro.showToast({ title: '请先在购物车选择商品', icon: 'none' })
        setTimeout(() => Taro.redirectTo({ url: '/pages/cart/index' }), 800)
        return
      }
      try {
        const list = await getCartList()
        setItems((list || []).filter((i) => ids.includes(i.id)))
      } catch (e) {
        console.error('[Confirm] load cart failed:', e)
      }
      try {
        const list = await getAddressList()
        setAddresses(list || [])
        setAddress((list || []).find((a) => a.defaultStatus === 1) || list?.[0] || null)
      } catch (e) {
        console.error('[Confirm] load address failed:', e)
      } finally {
        setLoaded(true)
      }
    })()
  }, [])

  const totalQuantity = items.reduce((sum, i) => sum + (i.quantity || 1), 0)
  const totalAmount = items.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0)

  const handleSubmit = async () => {
    if (!address) {
      Taro.showToast({ title: '请选择收货地址', icon: 'none' })
      return
    }
    if (!items.length || submitting) return
    setSubmitting(true)
    try {
      await generateOrder({
        memberReceiveAddressId: address.id,
        cartIds,
        payType,
      })
      Taro.showToast({ title: '下单成功', icon: 'success' })
      // 下单成功后移除已结算的购物车项（失败忽略）
      try {
        await deleteCartItems(cartIds)
      } catch (e) {
        console.error('[Confirm] clean cart failed:', e)
      }
      refreshCartBadge()
      setTimeout(() => {
        Taro.redirectTo({ url: '/pages/order-list/index?status=1' })
      }, 900)
    } catch (e) {
      console.error('[Confirm] generate order failed:', e)
    } finally {
      setSubmitting(false)
    }
  }

  const addressText = address
    ? `${address.province || ''}${address.city || ''}${address.region || ''}${address.detailAddress || ''}`
    : ''

  if (!loaded && !items.length) {
    return (
      <View className={styles.page}>
        <View className={styles.loading}>
          <Text className={styles.loadingText}>加载中…</Text>
        </View>
      </View>
    )
  }

  if (loaded && !items.length) {
    return (
      <View className={styles.page}>
        <Empty text="没有待结算的商品" actionText="去购物车" onAction={() => Taro.redirectTo({ url: '/pages/cart/index' })} />
      </View>
    )
  }

  return (
    <View className={styles.page}>
      {/* 收货地址 */}
      <View className={styles.addressCard} onClick={() => setAddressVisible(true)}>
        <View className={styles.addressIconWrap}>
          <Icon name="map-pin" size={36} color="#e1251b" />
        </View>
        {address ? (
          <View className={styles.addressInfo}>
            <View className={styles.addressRow}>
              <Text className={styles.addressName}>{address.name}</Text>
              <Text className={styles.addressPhone}>{address.phoneNumber}</Text>
              {!!address.defaultStatus && <Text className={styles.defaultTag}>默认</Text>}
            </View>
            <Text className={styles.addressText}>{addressText}</Text>
          </View>
        ) : (
          <View className={styles.addressInfo}>
            <Text className={styles.addressEmpty}>请选择收货地址</Text>
          </View>
        )}
        <Text className={styles.addressArrow}>›</Text>
      </View>

      {/* 商品清单 */}
      <View className={styles.goodsCard}>
        <Text className={styles.cardTitle}>商品清单</Text>
        {items.map((item) => (
          <View key={item.id} className={styles.goodsItem}>
            <SmartImage className={styles.goodsPic} type="product" pic={item.productPic} name={item.productName} lazyLoad />
            <View className={styles.goodsInfo}>
              <Text className={styles.goodsName}>{item.productName}</Text>
              {!!item.productAttr && <Text className={styles.goodsAttr}>{item.productAttr}</Text>}
              <View className={styles.goodsBottom}>
                <Text className={styles.goodsPrice}>¥{formatPrice(item.price)}</Text>
                <Text className={styles.goodsQty}>×{item.quantity || 1}</Text>
              </View>
            </View>
          </View>
        ))}
        <View className={styles.amountRow}>
          <Text className={styles.amountLabel}>共 {totalQuantity} 件</Text>
          <Text className={styles.amountLabel}>商品合计：</Text>
          <Text className={styles.amountValue}>¥{formatPrice(totalAmount)}</Text>
        </View>
      </View>

      {/* 支付方式 */}
      <View className={styles.payCard}>
        <Text className={styles.cardTitle}>支付方式</Text>
        <View className={styles.payOptions}>
          {PAY_OPTIONS.map((option) => (
            <View
              key={option.key}
              className={classnames(styles.payOption, payType === option.key && styles.payOptionActive)}
              onClick={() => setPayType(option.key)}
            >
              <View className={styles.payIcon}>
                <Icon name={option.icon} size={36} color={option.color} />
              </View>
              <Text className={styles.payLabel}>{option.label}</Text>
              <View className={classnames(styles.payRadio, payType === option.key && styles.payRadioActive)}>
                {payType === option.key && <View className={styles.payRadioDot} />}
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.bottomSpace} />

      {/* 底部提交栏 */}
      <View className={styles.bottomBar}>
        <View className={styles.totalCol}>
          <Text className={styles.totalLabel}>合计：</Text>
          <Text className={styles.totalAmount}>¥{formatPrice(totalAmount)}</Text>
        </View>
        <View
          className={classnames(styles.submitBtn, (!address || submitting) && styles.submitDisabled)}
          onClick={handleSubmit}
        >
          <Text className={styles.submitText}>{submitting ? '提交中…' : '提交订单'}</Text>
        </View>
      </View>

      {/* 地址选择弹层 */}
      {addressVisible && (
        <View className={styles.sheetMask} onClick={() => setAddressVisible(false)}>
          <View className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <View className={styles.sheetHead}>
              <Text className={styles.sheetTitle}>选择收货地址</Text>
              <Text className={styles.sheetClose} onClick={() => setAddressVisible(false)}>×</Text>
            </View>
            <ScrollView className={styles.sheetBody} scrollY>
              {addresses.length ? (
                addresses.map((a) => (
                  <View
                    key={a.id}
                    className={classnames(styles.addressOption, address?.id === a.id && styles.addressOptionActive)}
                    onClick={() => {
                      setAddress(a)
                      setAddressVisible(false)
                    }}
                  >
                    <View className={styles.addressRow}>
                      <Text className={styles.addressName}>{a.name}</Text>
                      <Text className={styles.addressPhone}>{a.phoneNumber}</Text>
                      {!!a.defaultStatus && <Text className={styles.defaultTag}>默认</Text>}
                    </View>
                    <Text className={styles.addressText}>
                      {`${a.province || ''}${a.city || ''}${a.region || ''}${a.detailAddress || ''}`}
                    </Text>
                  </View>
                ))
              ) : (
                <View className={styles.sheetEmpty}>
                  <Text className={styles.sheetEmptyText}>暂无收货地址</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  )
}

export default OrderConfirmPage
