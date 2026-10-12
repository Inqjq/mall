import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import type { ProductDetail, SkuStock } from '@/types/api'
import { formatPrice } from '@/utils/format'
import SmartImage from '@/components/SmartImage'
import QuantityStepper from '@/components/QuantityStepper'
import styles from './index.module.scss'

interface SkuAttr {
  key: string
  value: string
}

interface AttrGroup {
  key: string
  values: string[]
}

interface SkuPickerProps {
  visible: boolean
  detail: ProductDetail | null
  /** cart: 加入购物车；buy: 立即购买 */
  mode: 'cart' | 'buy'
  onClose: () => void
  onConfirm: (sku: SkuStock | null, quantity: number, mode: 'cart' | 'buy') => void
}

function parseSkuAttrs(sku: SkuStock): SkuAttr[] {
  try {
    const attrs = JSON.parse(sku.spData || '[]') as SkuAttr[]
    return Array.isArray(attrs) ? attrs.filter((a) => a && a.key && a.value) : []
  } catch (e) {
    console.error('[SkuPicker] parse spData failed:', sku.id, e)
    return []
  }
}

/** SKU 规格选择弹层（无 SKU 时按默认规格展示） */
const SkuPicker: React.FC<SkuPickerProps> = ({ visible, detail, mode, onClose, onConfirm }) => {
  const skus = useMemo(() => detail?.skuStockList || [], [detail])
  const groups = useMemo(() => {
    const map = new Map<string, string[]>()
    skus.forEach((sku) => {
      parseSkuAttrs(sku).forEach((attr) => {
        const list = map.get(attr.key) || []
        if (!list.includes(attr.value)) list.push(attr.value)
        map.set(attr.key, list)
      })
    })
    return [...map.entries()].map(([key, values]) => ({ key, values }))
  }, [skus])

  const [selected, setSelected] = useState<Record<string, string>>({})
  const [quantity, setQuantity] = useState(1)

  // 打开时以第一个 SKU 的规格初始化
  useEffect(() => {
    if (!visible) return
    setQuantity(1)
    const init: Record<string, string> = {}
    const first = skus.find((s) => parseSkuAttrs(s).length > 0) || skus[0]
    if (first) {
      parseSkuAttrs(first).forEach((attr) => {
        init[attr.key] = attr.value
      })
    }
    setSelected(init)
  }, [visible, skus])

  const matchedSku = useMemo(() => {
    if (!groups.length) return null
    return (
      skus.find((sku) => {
        const attrs = parseSkuAttrs(sku)
        if (attrs.length !== groups.length) return false
        return attrs.every((attr) => selected[attr.key] === attr.value)
      }) || null
    )
  }, [skus, groups, selected])

  const product = detail?.product
  const displayPrice = matchedSku?.price ?? product?.price ?? 0
  const displayStock = matchedSku?.stock ?? product?.stock ?? 0
  const selectedText = groups.length
    ? groups.map((g) => selected[g.key]).filter(Boolean).join(' / ')
    : '默认规格'

  if (!detail || !product) return null

  const pickValue = (key: string, value: string) => {
    setSelected((prev) => ({ ...prev, [key]: value }))
  }

  const handleConfirm = () => {
    if (groups.length && (!matchedSku || Object.keys(selected).length !== groups.length)) {
      Taro.showToast({ title: '请选择完整规格', icon: 'none' })
      return
    }
    onConfirm(matchedSku, quantity, mode)
  }

  return (
    <View className={classnames(styles.mask, visible && styles.maskVisible)} onClick={onClose}>
      <View className={classnames(styles.panel, visible && styles.panelVisible)} onClick={(e) => e.stopPropagation()}>
        <View className={styles.header}>
          <SmartImage className={styles.pic} type="product" pic={matchedSku?.pic || product.pic} name={product.brandName || product.name} />
          <View className={styles.headerInfo}>
            <Text className={styles.price}>
              ¥{formatPrice(displayPrice)}
            </Text>
            <Text className={styles.stock}>库存 {displayStock} 件</Text>
            <Text className={styles.selected}>已选：{selectedText}</Text>
          </View>
          <View className={styles.close} onClick={onClose}>
            <Text className={styles.closeText}>×</Text>
          </View>
        </View>

        <ScrollView className={styles.body}>
          {groups.map((group) => (
            <View key={group.key} className={styles.group}>
              <Text className={styles.groupLabel}>{group.key}</Text>
              <View className={styles.values}>
                {group.values.map((value) => (
                  <View
                    key={value}
                    className={classnames(styles.valueItem, selected[group.key] === value && styles.valueActive)}
                    onClick={() => pickValue(group.key, value)}
                  >
                    <Text className={styles.valueText}>{value}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
          <View className={styles.quantityRow}>
            <Text className={styles.groupLabel}>购买数量</Text>
            <QuantityStepper
              value={quantity}
              min={1}
              max={Math.max(1, displayStock || 999)}
              onChange={setQuantity}
            />
          </View>
        </ScrollView>

        <View className={styles.footer}>
          <View className={styles.confirmBtn} onClick={handleConfirm}>
            <Text className={styles.confirmText}>{mode === 'cart' ? '加入购物车' : '立即购买'}</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

export default SkuPicker
