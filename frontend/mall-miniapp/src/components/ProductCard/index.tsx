import React from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import type { Product } from '@/types/api'
import { formatPrice, formatSaleCount } from '@/utils/format'
import SmartImage from '@/components/SmartImage'
import styles from './index.module.scss'

interface ProductCardProps {
  product: Product
}

/** 商品网格卡片：图 + 名称 + 副标题 + 价格 */
const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const goDetail = () => {
    Taro.navigateTo({ url: `/pages/product/index?id=${product.id}` }).catch((err) =>
      console.error('[ProductCard] navigate failed:', err),
    )
  }

  return (
    <View className={styles.card} onClick={goDetail}>
      <SmartImage
        className={styles.pic}
        type="product"
        pic={product.pic}
        name={product.brandName || product.name}
        lazyLoad
      />
      <View className={styles.info}>
        <Text className={styles.name}>{product.name}</Text>
        {!!product.subTitle && <Text className={styles.sub}>{product.subTitle}</Text>}
        <View className={styles.priceRow}>
          <Text className={styles.priceSymbol}>¥</Text>
          <Text className={styles.price}>{formatPrice(product.price)}</Text>
          {!!product.originalPrice && product.originalPrice > (product.price || 0) && (
            <Text className={styles.original}>¥{formatPrice(product.originalPrice)}</Text>
          )}
        </View>
        {!!product.sale && <Text className={styles.sale}>已售 {formatSaleCount(product.sale)}</Text>}
      </View>
    </View>
  )
}

export default ProductCard
