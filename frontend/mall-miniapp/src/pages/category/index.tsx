import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import classnames from 'classnames'
import { getProductCategoryTree } from '@/services/home'
import { searchProducts } from '@/services/product'
import type { CategoryNode, Product } from '@/types/api'
import ProductCard from '@/components/ProductCard'
import Empty from '@/components/Empty'
import styles from './index.module.scss'

function CategoryPage() {
  const [tree, setTree] = useState<CategoryNode[]>([])
  const [activeId, setActiveId] = useState<number>(-1)
  const [childId, setChildId] = useState<number>(0)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)

  const loadProducts = async (parentId: number, cId: number) => {
    setLoading(true)
    try {
      const cateId = cId || parentId
      const page = await searchProducts({ productCategoryId: cateId, pageNum: 1, pageSize: 20, sort: 0 })
      setProducts(page.list || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    ;(async () => {
      const list = await getProductCategoryTree().catch((e) => {
        console.error('[Category] load tree failed:', e)
        return [] as CategoryNode[]
      })
      setTree(list)
      if (list.length) {
        setActiveId(list[0].id)
        loadProducts(list[0].id, 0)
      }
    })()
  }, [])

  const selectParent = (id: number) => {
    if (id === activeId) return
    setActiveId(id)
    setChildId(0)
    loadProducts(id, 0)
  }

  const selectChild = (id: number) => {
    if (id === childId) return
    setChildId(id)
    loadProducts(activeId, id)
  }

  const children = tree.find((n) => n.id === activeId)?.childrenList || []

  return (
    <View className={styles.page}>
      <View className={styles.body}>
        {/* 左侧一级分类 */}
        <ScrollView scrollY className={styles.side}>
          {tree.map((parent) => (
            <View
              key={parent.id}
              className={classnames(styles.sideItem, activeId === parent.id && styles.sideItemActive)}
              onClick={() => selectParent(parent.id)}
            >
              <View className={styles.sideBar} />
              <Text className={styles.sideName}>{parent.name}</Text>
            </View>
          ))}
        </ScrollView>

        {/* 右侧子分类 + 商品 */}
        <ScrollView scrollY className={styles.main}>
          <ScrollView scrollX className={styles.chips} showScrollbar={false}>
            <View className={styles.chipsRow}>
              <View
                className={classnames(styles.chip, childId === 0 && styles.chipActive)}
                onClick={() => selectChild(0)}
              >
                <Text className={styles.chipText}>全部</Text>
              </View>
              {children.map((child) => (
                <View
                  key={child.id}
                  className={classnames(styles.chip, childId === child.id && styles.chipActive)}
                  onClick={() => selectChild(child.id)}
                >
                  <Text className={styles.chipText}>{child.name}</Text>
                </View>
              ))}
            </View>
          </ScrollView>

          {loading ? (
            <View className={styles.loading}>
              <Text className={styles.loadingText}>加载中…</Text>
            </View>
          ) : products.length ? (
            <View className={styles.grid}>
              {products.map((product) => (
                <View key={product.id} className={styles.gridItem}>
                  <ProductCard product={product} />
                </View>
              ))}
            </View>
          ) : (
            <Empty text="该分类暂无商品" hint="换个分类看看吧" />
          )}
        </ScrollView>
      </View>
    </View>
  )
}

export default CategoryPage
