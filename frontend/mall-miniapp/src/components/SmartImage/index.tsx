import React from 'react'
import { View, Text, Image } from '@tarojs/components'
import Icon from '@/components/Icon'
import { categoryIconOf, gradientOf, initialOf } from '@/utils/visual'
import styles from './index.module.scss'

export interface SmartImageProps {
  /** 图片地址；为空时渲染矢量占位卡 */
  pic?: string | null
  /** 占位类型 */
  type: 'product' | 'brand' | 'banner' | 'subject'
  /** 名称（选色 / 品类图标 / 首字母依据） */
  name?: string
  /** banner / subject 主标题 */
  title?: string
  /** banner 副标题 */
  subtitle?: string
  /** subject 分类标签 */
  tag?: string
  className?: string
  style?: React.CSSProperties
  lazyLoad?: boolean
}

/**
 * 智能媒体组件：
 * - pic 有值 → 正常渲染网络图片
 * - pic 为空 → 渐变矢量占位卡（商品品类图标 / 品牌首字母 / 活动横幅 / 专题卡）
 */
function SmartImage({ pic, type, name, title, subtitle, tag, className, style, lazyLoad }: SmartImageProps) {
  if (pic) {
    return <Image className={className} style={style} src={pic} mode="aspectFill" lazyLoad={lazyLoad} />
  }

  const key = name || title || 'mall'
  const [c1, c2] = gradientOf(key)

  if (type === 'product') {
    return (
      <View
        className={className ? `${styles.productHolder} ${className}` : styles.productHolder}
        style={{ ...style, background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)` }}
      >
        <View className={styles.holderGlow} />
        <Icon name={categoryIconOf(key)} size={72} color="rgba(255,255,255,0.92)" strokeWidth={1.6} />
        {!!name && <Text className={styles.holderBrand}>{name}</Text>}
      </View>
    )
  }

  if (type === 'brand') {
    return (
      <View
        className={className ? `${styles.brandHolder} ${className}` : styles.brandHolder}
        style={{ ...style, background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)` }}
      >
        <Text className={styles.brandInitial}>{initialOf(key)}</Text>
      </View>
    )
  }

  if (type === 'banner') {
    const parts = (title || '').split(/\s*·\s*/)
    const main = parts[0] || '精彩活动'
    const sub = subtitle || parts.slice(1).join(' · ')
    return (
      <View
        className={className ? `${styles.bannerHolder} ${className}` : styles.bannerHolder}
        style={{ ...style, background: `linear-gradient(120deg, ${c2} 0%, ${c1} 100%)` }}
      >
        <View className={styles.bannerDecorA} />
        <View className={styles.bannerDecorB} />
        <View className={styles.bannerText}>
          <Text className={styles.bannerTitle}>{main}</Text>
          {!!sub && <Text className={styles.bannerSubtitle}>{sub}</Text>}
        </View>
        <View className={styles.bannerIconWrap}>
          <Icon name={categoryIconOf(key)} size={88} color="rgba(255,255,255,0.35)" strokeWidth={1.4} />
        </View>
      </View>
    )
  }

  // subject
  return (
    <View
      className={className ? `${styles.subjectHolder} ${className}` : styles.subjectHolder}
      style={{ ...style, background: `linear-gradient(150deg, ${c1} 0%, ${c2} 100%)` }}
    >
      <View className={styles.holderGlow} />
      {!!tag && (
        <View className={styles.subjectTag}>
          <Text className={styles.subjectTagText}>{tag}</Text>
        </View>
      )}
      <Text className={styles.subjectTitle}>{title || '专题精选'}</Text>
      <View className={styles.subjectIconWrap}>
        <Icon name={categoryIconOf(key)} size={56} color="rgba(255,255,255,0.5)" strokeWidth={1.5} />
      </View>
    </View>
  )
}

export default SmartImage
