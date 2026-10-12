import React, { useEffect, useState } from 'react'
import { View, Text, Swiper, SwiperItem, RichText } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { getProductDetail } from '@/services/product'
import { addCart, refreshCartBadge } from '@/services/cart'
import { useUserStore } from '@/store/user'
import type { ProductDetail, SkuStock } from '@/types/api'
import { formatPrice, formatSaleCount } from '@/utils/format'
import SkuPicker from '@/components/SkuPicker'
import Empty from '@/components/Empty'
import Icon from '@/components/Icon'
import SmartImage from '@/components/SmartImage'
import styles from './index.module.scss'

function skuText(sku: SkuStock): string {
  try {
    const attrs = JSON.parse(sku.spData || '[]') as { key: string; value: string }[]
    return attrs.map((a) => a.value).join(' / ') || `SKU#${sku.id}`
  } catch (e) {
    console.error('[Product] parse sku spData failed:', sku.id, e)
    return `SKU#${sku.id}`
  }
}

function ProductPage() {
  const [detail, setDetail] = useState<ProductDetail | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [skuVisible, setSkuVisible] = useState(false)
  const [skuMode, setSkuMode] = useState<'cart' | 'buy'>('cart')
  const [selectedSkuId, setSelectedSkuId] = useState<number>(0)
  const isLogin = useUserStore((s) => !!s.token)

  useEffect(() => {
    const params = Taro.getCurrentInstance().params || {}
    const id = Number(params.id || 0)
    ;(async () => {
      try {
        const data = await getProductDetail(id)
        setDetail(data)
        if (data.skuStockList?.length) setSelectedSkuId(data.skuStockList[0].id)
      } catch (e) {
        console.error('[Product] load detail failed:', e)
      } finally {
        setLoaded(true)
      }
    })()
  }, [])

  if (!detail || !detail.product) {
    return loaded ? <Empty text="商品不存在或已下架" actionText="返回首页" onAction={() => Taro.switchTab({ url: '/pages/index/index' })} /> : <View className={styles.pageLoading}>加载中…</View>
  }

  const { product, brand } = detail
  const skuList = detail.skuStockList || []
  const selectedSku = skuList.find((s) => s.id === selectedSkuId)
  const images = [product.pic, ...(product.albumPics || '').split(',').filter(Boolean)].filter(Boolean)

  const requireLogin = (): boolean => {
    if (isLogin) return true
    Taro.navigateTo({ url: '/pages/login/index' }).catch((err) => console.error('[Product] navigate login failed:', err))
    return false
  }

  const openSku = (mode: 'cart' | 'buy') => {
    if (!requireLogin()) return
    setSkuMode(mode)
    setSkuVisible(true)
  }

  const addToCart = async (sku: SkuStock | null, quantity: number, silent = false): Promise<number | null> => {
    try {
      const cartId = await addCart({
        productId: product.id,
        productSkuId: sku?.id || 0,
        quantity,
      })
      refreshCartBadge()
      if (!silent) Taro.showToast({ title: '已加入购物车', icon: 'success' })
      return cartId
    } catch (e) {
      console.error('[Product] add cart failed:', e)
      return null
    }
  }

  const handleSkuConfirm = async (sku: SkuStock | null, quantity: number, mode: 'cart' | 'buy') => {
    if (!sku && skuList.length) {
      Taro.showToast({ title: '请选择规格', icon: 'none' })
      return
    }
    if (sku) setSelectedSkuId(sku.id)
    setSkuVisible(false)
    if (mode === 'cart') {
      await addToCart(sku, quantity)
    } else {
      const cartId = await addToCart(sku, quantity, true)
      if (cartId) {
        Taro.navigateTo({ url: `/pages/order-confirm/index?cartIds=${cartId}` }).catch((err) =>
          console.error('[Product] navigate confirm failed:', err),
        )
      }
    }
  }

  return (
    <View className={styles.page}>
      {/* 商品图轮播 */}
      <Swiper className={styles.gallery} autoplay circular indicatorDots indicatorColor="rgba(0,0,0,0.2)" indicatorActiveColor="#e1251b">
        {(images.length ? images : ['']).map((src, index) => (
          <SwiperItem key={index}>
            <View onClick={() => openSku('cart')}>
              <SmartImage
                className={styles.galleryPic}
                type="product"
                pic={src}
                name={product.brandName || product.name}
              />
            </View>
          </SwiperItem>
        ))}
      </Swiper>

      {/* 价格 + 标题 */}
      <View className={styles.mainCard}>
        <View className={styles.priceRow}>
          <Text className={styles.priceSymbol}>¥</Text>
          <Text className={styles.price}>{formatPrice(selectedSku?.price ?? product.price)}</Text>
          {!!product.originalPrice && product.originalPrice > (product.price || 0) && (
            <Text className={styles.original}>¥{formatPrice(product.originalPrice)}</Text>
          )}
          {!!product.sale && <Text className={styles.sale}>已售 {formatSaleCount(product.sale)}</Text>}
        </View>
        <Text className={styles.name}>{product.name}</Text>
        {!!product.subTitle && <Text className={styles.subTitle}>{product.subTitle}</Text>}
        <View className={styles.badges}>
          <Text className={styles.badge}>精选好物</Text>
          <Text className={styles.badge}>品质保障</Text>
          <Text className={styles.badge}>七天无理由退换</Text>
        </View>
      </View>

      {/* 规格信息 */}
      <View className={styles.specCard}>
        <View className={styles.specRow} onClick={() => openSku('cart')}>
          <Text className={styles.specLabel}>选择规格</Text>
          <View className={styles.specValueCol}>
            <Text className={styles.specValue}>{selectedSku ? skuText(selectedSku) : '默认规格'}</Text>
          </View>
          <Text className={styles.specArrow}>›</Text>
        </View>
        <View className={styles.specDivider} />
        <View className={styles.specRow}>
          <Text className={styles.specLabel}>品牌</Text>
          <Text className={styles.specValue}>{brand?.name || product.brandName || 'MALL 精选'}</Text>
        </View>
        <View className={styles.specDivider} />
        <View className={styles.specRow}>
          <Text className={styles.specLabel}>库存</Text>
          <Text className={styles.specValue}>{selectedSku?.stock ?? product.stock ?? '-'} 件</Text>
        </View>
      </View>

      {/* 商品详情（富文本） */}
      {!!product.detailHtml && (
        <View className={styles.detailCard}>
          <Text className={styles.detailTitle}>商品详情</Text>
          <RichText className={styles.richContent} nodes={product.detailHtml} />
        </View>
      )}

      <View className={styles.bottomSpace} />

      {/* 底部操作栏 */}
      <View className={styles.actionBar}>
        <View className={styles.actionIconCol} onClick={() => Taro.navigateTo({ url: '/pages/assistant/index' })}>
          <Icon name="message-circle" size={40} color="#4e5969" />
          <Text className={styles.actionIconText}>客服</Text>
        </View>
        <View className={styles.actionIconCol} onClick={() => Taro.switchTab({ url: '/pages/cart/index' })}>
          <Icon name="cart" size={40} color="#4e5969" />
          <Text className={styles.actionIconText}>购物车</Text>
        </View>
        <View className={styles.actionBtnCart} onClick={() => openSku('cart')}>
          <Text className={styles.actionBtnCartText}>加入购物车</Text>
        </View>
        <View className={styles.actionBtnBuy} onClick={() => openSku('buy')}>
          <Text className={styles.actionBtnBuyText}>立即购买</Text>
        </View>
      </View>

      <SkuPicker
        visible={skuVisible}
        detail={detail}
        mode={skuMode}
        onClose={() => setSkuVisible(false)}
        onConfirm={handleSkuConfirm}
      />
    </View>
  )
}

export default ProductPage
