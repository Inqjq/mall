import React, { useEffect, useRef, useState } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro, { useReachBottom } from '@tarojs/taro'
import classnames from 'classnames'
import { searchProducts } from '@/services/product'
import type { Product } from '@/types/api'
import ProductCard from '@/components/ProductCard'
import Empty from '@/components/Empty'
import Icon from '@/components/Icon'
import styles from './index.module.scss'

const HISTORY_KEY = 'mall_search_history'
const HOT_WORDS = ['手机', '耳机', '坚果', '毛衣', '空调', '床品', '橙子', '精华']

const SORT_TABS = [
  { key: 0, label: '综合' },
  { key: 1, label: '新品' },
  { key: 2, label: '销量' },
]

function SearchPage() {
  const [keyword, setKeyword] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [searched, setSearched] = useState(false)
  const [sort, setSort] = useState(0)
  const [list, setList] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const pageRef = useRef(1)
  const searchingRef = useRef(false)

  const loadHistory = () => {
    try {
      setHistory((Taro.getStorageSync(HISTORY_KEY) as string[]) || [])
    } catch (e) {
      console.error('[Search] read history failed:', e)
    }
  }

  const saveHistory = (kw: string) => {
    if (!kw) return
    try {
      const next = [kw, ...history.filter((h) => h !== kw)].slice(0, 10)
      Taro.setStorageSync(HISTORY_KEY, next)
      setHistory(next)
    } catch (e) {
      console.error('[Search] save history failed:', e)
    }
  }

  const doSearch = async (kw: string, sortKey: number, pageNum = 1) => {
    if (searchingRef.current) return
    searchingRef.current = true
    setLoading(true)
    try {
      const page = await searchProducts({
        keyword: kw || undefined,
        pageNum,
        pageSize: 10,
        sort: sortKey,
      })
      pageRef.current = pageNum
      setTotal(page.total || 0)
      setList((prev) => (pageNum === 1 ? page.list || [] : [...prev, ...(page.list || [])]))
      setSearched(true)
    } catch (e) {
      console.error('[Search] search failed:', e)
      if (pageNum === 1) setList([])
    } finally {
      setLoading(false)
      searchingRef.current = false
    }
  }

  useEffect(() => {
    const params = Taro.getCurrentInstance().params || {}
    const kw = decodeURIComponent((params.keyword as string) || '')
    const brandId = Number(params.brandId || 0) || undefined
    const categoryId = Number(params.productCategoryId || 0) || undefined
    const initialSort = Number(params.sort || 0) || 0
    loadHistory()
    if (kw) {
      setKeyword(kw)
      setSort(initialSort)
      saveHistory(kw)
      doSearch(kw, initialSort)
    }
    // brandId / categoryId 由首页分类等场景带入时可扩展
    if (!kw && (brandId || categoryId)) {
      setSort(initialSort)
      doSearch('', initialSort)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useReachBottom(() => {
    if (!searched || loading) return
    if (list.length >= total) return
    doSearch(keyword, sort, pageRef.current + 1)
  })

  const handleSearch = () => {
    const kw = keyword.trim()
    if (!kw) {
      Taro.showToast({ title: '请输入搜索关键词', icon: 'none' })
      return
    }
    saveHistory(kw)
    doSearch(kw, sort)
  }

  const handleSort = (key: number) => {
    if (key === sort) return
    setSort(key)
    doSearch(keyword.trim(), key)
  }

  const clearHistory = () => {
    try {
      Taro.removeStorageSync(HISTORY_KEY)
    } catch (e) {
      console.error('[Search] clear history failed:', e)
    }
    setHistory([])
  }

  return (
    <View className={styles.page}>
      {/* 搜索栏 */}
      <View className={styles.searchBar}>
        <View className={styles.searchInputWrap}>
          <View className={styles.searchIconWrap}>
            <Icon name="search" size={30} color="#86909c" />
          </View>
          <Input
            className={styles.searchInput}
            value={keyword}
            placeholder="搜索商品 / 品牌"
            placeholderClass={styles.placeholder}
            confirmType="search"
            focus={!searched}
            onInput={(e) => setKeyword(e.detail.value)}
            onConfirm={handleSearch}
          />
          {!!keyword && (
            <View className={styles.clearBtn} onClick={() => setKeyword('')}>
              <Text className={styles.clearText}>×</Text>
            </View>
          )}
        </View>
        <Text className={styles.searchBtn} onClick={handleSearch}>
          搜索
        </Text>
      </View>

      {!searched ? (
        <View className={styles.prePage}>
          {!!history.length && (
            <View className={styles.preSection}>
              <View className={styles.preHead}>
                <Text className={styles.preTitle}>搜索历史</Text>
                <Text className={styles.preAction} onClick={clearHistory}>
                  清空
                </Text>
              </View>
              <View className={styles.tagWrap}>
                {history.map((item) => (
                  <View key={item} className={styles.tag} onClick={() => { setKeyword(item); saveHistory(item); doSearch(item, 0) }}>
                    <Text className={styles.tagText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          <View className={styles.preSection}>
            <View className={styles.preHead}>
              <Text className={styles.preTitle}>热门搜索</Text>
            </View>
            <View className={styles.tagWrap}>
              {HOT_WORDS.map((word, index) => (
                <View
                  key={word}
                  className={classnames(styles.tag, index < 3 && styles.tagHot)}
                  onClick={() => { setKeyword(word); saveHistory(word); doSearch(word, 0) }}
                >
                  {index < 3 && <Text className={styles.tagRank}>{index + 1}</Text>}
                  <Text className={styles.tagText}>{word}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      ) : (
        <View className={styles.resultPage}>
          {/* 排序栏 */}
          <View className={styles.sortBar}>
            {SORT_TABS.map((tab) => (
              <View
                key={tab.key}
                className={classnames(styles.sortItem, sort === tab.key && styles.sortActive)}
                onClick={() => handleSort(tab.key)}
              >
                <Text className={styles.sortText}>{tab.label}</Text>
                <View className={styles.sortUnderline} />
              </View>
            ))}
            <Text className={styles.resultCount}>{total} 件结果</Text>
          </View>

          {list.length ? (
            <View className={styles.grid}>
              {list.map((product) => (
                <View key={product.id} className={styles.gridItem}>
                  <ProductCard product={product} />
                </View>
              ))}
            </View>
          ) : !loading ? (
            <Empty text="未找到相关商品" hint="换个关键词试试" actionText="清空重搜" onAction={() => { setSearched(false); setKeyword('') }} />
          ) : null}

          {loading && <View className={styles.loadingText}>加载中…</View>}
          {!loading && list.length > 0 && list.length >= total && (
            <View className={styles.loadingText}>— 没有更多了 —</View>
          )}
        </View>
      )}
    </View>
  )
}

export default SearchPage
