import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { getAddressList } from '@/services/order'
import { refreshCartBadge } from '@/services/cart'
import { useUserStore } from '@/store/user'
import type { MemberAddress } from '@/types/api'
import Empty from '@/components/Empty'
import Icon, { type IconName } from '@/components/Icon'
import styles from './index.module.scss'

const ORDER_ENTRIES: Array<{ status: number; icon: IconName; color: string; label: string }> = [
  { status: 0, icon: 'credit-card', color: '#ffa940', label: '待付款' },
  { status: 1, icon: 'package', color: '#5b8cff', label: '待发货' },
  { status: 2, icon: 'truck', color: '#2fbf91', label: '已发货' },
  { status: 3, icon: 'award', color: '#e1251b', label: '已完成' },
]

function MinePage() {
  const token = useUserStore((s) => s.token)
  const username = useUserStore((s) => s.username)
  const logout = useUserStore((s) => s.logout)
  const [statusBarHeight, setStatusBarHeight] = useState(0)
  const [showAddress, setShowAddress] = useState(false)
  const [addresses, setAddresses] = useState<MemberAddress[] | null>(null)
  const [addressLoading, setAddressLoading] = useState(false)

  const isLogin = !!token

  useEffect(() => {
    const sys = Taro.getSystemInfoSync()
    setStatusBarHeight(sys.statusBarHeight || 0)
  }, [])

  useDidShow(() => {
    refreshCartBadge()
  })

  const goLogin = () => {
    Taro.navigateTo({ url: '/pages/login/index' }).catch((err) =>
      console.error('[Mine] navigate login failed:', err),
    )
  }

  const goOrderList = (status: number) => {
    if (!isLogin) {
      goLogin()
      return
    }
    Taro.navigateTo({ url: `/pages/order-list/index?status=${status}` }).catch((err) =>
      console.error('[Mine] navigate order list failed:', err),
    )
  }

  const openAddress = async () => {
    if (!isLogin) {
      goLogin()
      return
    }
    setShowAddress(true)
    if (addresses || addressLoading) return
    setAddressLoading(true)
    try {
      const list = await getAddressList()
      setAddresses(list || [])
    } catch (e) {
      // 请求层已提示错误
      console.error('[Mine] load addresses failed:', e)
      setAddresses([])
    } finally {
      setAddressLoading(false)
    }
  }

  const goAssistant = () => {
    Taro.navigateTo({ url: '/pages/assistant/index' }).catch((err) =>
      console.error('[Mine] navigate assistant failed:', err),
    )
  }

  const showAbout = () => {
    Taro.showModal({
      title: '关于 Mall 商城',
      content: 'Mall 商城小程序 v1.0.0\n精选好物 · 品质保障 · 贴心售后',
      showCancel: false,
      confirmColor: '#e1251b',
    })
  }

  const handleLogout = () => {
    Taro.showModal({
      title: '退出登录',
      content: '确定要退出当前账号吗？',
      confirmText: '退出',
      confirmColor: '#e1251b',
      success: (res) => {
        if (!res.confirm) return
        logout()
        setAddresses(null)
        refreshCartBadge()
        Taro.showToast({ title: '已退出登录', icon: 'none' })
      },
    })
  }

  return (
    <View className={styles.page}>
      {/* 沉浸式渐变头部 + 用户信息 */}
      <View className={styles.hero}>
        <View style={{ height: `${statusBarHeight}px` }} />
        <View className={styles.navRow}>
          <Text className={styles.navTitle}>我的</Text>
        </View>
        <View className={styles.userCard} onClick={!isLogin ? goLogin : undefined}>
          <View className={styles.avatar}>
            {isLogin ? (
              <Text className={styles.avatarText}>{(username || 'M').slice(0, 1).toUpperCase()}</Text>
            ) : (
              <Icon name="user" size={52} color="rgba(255,255,255,0.9)" />
            )}
          </View>
          <View className={styles.userCol}>
            <Text className={styles.username}>{isLogin ? username || '会员用户' : '点击登录'}</Text>
            <Text className={styles.userSub}>{isLogin ? '欢迎回来，祝您购物愉快' : '登录后享受更多会员权益'}</Text>
          </View>
          {!isLogin && <Text className={styles.userArrow}>›</Text>}
        </View>
      </View>

      <View className={styles.body}>
        {/* 我的订单 */}
        <View className={styles.card}>
          <View className={styles.cardHead} onClick={() => goOrderList(-1)}>
            <Text className={styles.cardTitle}>我的订单</Text>
            <Text className={styles.cardMore}>全部订单 ›</Text>
          </View>
          <View className={styles.orderEntries}>
            {ORDER_ENTRIES.map((entry) => (
              <View key={entry.status} className={styles.orderEntry} onClick={() => goOrderList(entry.status)}>
                <View className={styles.entryIcon}>
                  <Icon name={entry.icon} size={44} color={entry.color} strokeWidth={1.8} />
                </View>
                <Text className={styles.entryLabel}>{entry.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 服务入口 */}
        <View className={styles.card}>
          <View className={styles.serviceItem} onClick={openAddress}>
            <View className={styles.serviceIconWrap}>
              <Icon name="map-pin" size={36} color="#4e5969" />
            </View>
            <Text className={styles.serviceLabel}>收货地址</Text>
            <Text className={styles.serviceArrow}>›</Text>
          </View>
          <View className={styles.serviceDivider} />
          <View className={styles.serviceItem} onClick={goAssistant}>
            <View className={styles.serviceIconWrap}>
              <Icon name="message-circle" size={36} color="#4e5969" />
            </View>
            <Text className={styles.serviceLabel}>在线客服</Text>
            <Text className={styles.serviceArrow}>›</Text>
          </View>
          <View className={styles.serviceDivider} />
          <View className={styles.serviceItem} onClick={showAbout}>
            <View className={styles.serviceIconWrap}>
              <Icon name="info" size={36} color="#4e5969" />
            </View>
            <Text className={styles.serviceLabel}>关于商城</Text>
            <Text className={styles.serviceArrow}>›</Text>
          </View>
        </View>

        {isLogin && (
          <View className={styles.logoutBtn} onClick={handleLogout}>
            <Text className={styles.logoutText}>退出登录</Text>
          </View>
        )}
      </View>

      {/* 收货地址弹层 */}
      {showAddress && (
        <View className={styles.mask} onClick={() => setShowAddress(false)}>
          <View className={styles.popup} onClick={(e) => e.stopPropagation()}>
            <View className={styles.popupHead}>
              <Text className={styles.popupTitle}>收货地址</Text>
              <Text className={styles.popupClose} onClick={() => setShowAddress(false)}>
                ✕
              </Text>
            </View>
            <ScrollView className={styles.popupBody} scrollY style={{ height: '48vh' }}>
              {addressLoading ? (
                <View className={styles.popupTip}>加载中…</View>
              ) : addresses && addresses.length > 0 ? (
                addresses.map((addr) => (
                  <View key={addr.id} className={styles.addressItem}>
                    <View className={styles.addressRow}>
                      <Text className={styles.addressName}>{addr.name}</Text>
                      <Text className={styles.addressPhone}>{addr.phoneNumber}</Text>
                      {addr.defaultStatus === 1 && <Text className={styles.defaultTag}>默认</Text>}
                    </View>
                    <Text className={styles.addressDetail}>
                      {[addr.province, addr.city, addr.region, addr.detailAddress].filter(Boolean).join(' ')}
                    </Text>
                  </View>
                ))
              ) : (
                <Empty icon="inbox" text="暂无收货地址" hint="下单时可在确认订单页选择地址" />
              )}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  )
}

export default MinePage
