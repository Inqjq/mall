import React, { useCallback, useEffect, useState } from 'react'
import { View, Text, Swiper, SwiperItem, ScrollView, Image } from '@tarojs/components'
import Taro, { usePullDownRefresh } from '@tarojs/taro'
import { getHomeContent, getProductCategoryTree, getRecommendProductList } from '@/services/home'
import type { CategoryNode, FlashPromotionProduct, HomeContent, Product } from '@/types/api'
import { formatPrice, formatSaleCount } from '@/utils/format'
import { categoryImageOf } from '@/utils/visual'
import ProductCard from '@/components/ProductCard'
import CountDown from '@/components/CountDown'
import Empty from '@/components/Empty'
import Icon from '@/components/Icon'
import SmartImage from '@/components/SmartImage'
import styles from './index.module.scss'

function HomePage() {
  const [statusBarHeight, setStatusBarHeight] = useState(0)
  const [content, setContent] = useState<HomeContent | null>(null)
  const [categories, setCategories] = useState<CategoryNode[]>([])
  const [recommends, setRecommends] = useState<Product[]>([])
  const [loaded, setLoaded] = useState(false)

  const load = useCallback(async () => {
    const results = await Promise.allSettled([
      getHomeContent(),
      getProductCategoryTree(),
      getRecommendProductList(1, 10),
    ])
    if (results[0].status === 'fulfilled') setContent(results[0].value)
    if (results[1].status === 'fulfilled') setCategories(results[1].value)
    if (results[2].status === 'fulfilled') setRecommends(results[2].value)
    setLoaded(true)
  }, [])

  useEffect(() => {
    const sys = Taro.getSystemInfoSync()
    setStatusBarHeight(sys.statusBarHeight || 0)
    load()
  }, [load])

  usePullDownRefresh(async () => {
    await load()
    Taro.stopPullDownRefresh()
  })

  const banners = content?.advertiseList || []
  const brands = content?.brandList || []
  const subjects = content?.subjectList || []
  const flashList: FlashPromotionProduct[] = content?.homeFlashPromotion?.productList || []
  const flashEndTime = content?.homeFlashPromotion?.endTime
  const newProducts = content?.newProductList || []
  const hotProducts = content?.hotProductList?.length ? content.hotProductList : flashList
  const quickCategories = categories.slice(0, 7)

  const goSearch = (keyword?: string) => {
    const url = keyword ? `/pages/search/index?keyword=${encodeURIComponent(keyword)}` : '/pages/search/index'
    Taro.navigateTo({ url }).catch((err) => console.error('[Home] navigate search failed:', err))
  }
  const goCategory = () => {
    // switchTab 不支持 query，分类页进入后自行加载
    Taro.switchTab({ url: '/pages/category/index' }).catch((err) =>
      console.error('[Home] switchTab category failed:', err),
    )
  }
  const goAssistant = () => {
    Taro.navigateTo({ url: '/pages/assistant/index' }).catch((err) => console.error('[Home] navigate assistant failed:', err))
  }

  const renderSection = (title: string, sub: string, list: Product[], sort: number) => {
    if (!list.length) return null
    return (
      <View className={styles.section}>
        <View className={styles.sectionHead}>
          <View className={styles.sectionTitle}>
            <View className={styles.sectionBar} />
            <View className={styles.sectionNameCol}>
              <Text className={styles.sectionName}>{title}</Text>
              <Text className={styles.sectionSub}>{sub}</Text>
            </View>
          </View>
          <Text className={styles.sectionMore} onClick={() => goSearchWithSort(sort)}>
            全部 ›
          </Text>
        </View>
        <View className={styles.grid}>
          {list.map((product) => (
            <View key={product.id} className={styles.gridItem}>
              <ProductCard product={product} />
            </View>
          ))}
        </View>
      </View>
    )
  }

  const goSearchWithSort = (sort: number) => {
    Taro.navigateTo({ url: `/pages/search/index?sort=${sort}` }).catch((err) =>
      console.error('[Home] navigate search failed:', err),
    )
  }

  return (
    <View className={styles.page}>
      {/* 沉浸式渐变头部 + 搜索栏 */}
      <View className={styles.hero}>
        <View style={{ height: `${statusBarHeight}px` }} />
        <View className={styles.navRow}>
          <Text className={styles.brand}>Mall</Text>
          <View className={styles.searchBar} onClick={() => goSearch()}>
            <Icon name="search" size={28} color="rgba(255,255,255,0.9)" className={styles.searchIcon} />
            <Text className={styles.searchPlaceholder}>搜索商品 / 品牌</Text>
          </View>
          <View className={styles.serviceBtn} onClick={goAssistant}>
            <Icon name="message-circle" size={34} color="#ffffff" />
          </View>
        </View>

        {banners.length > 0 && (
          <Swiper
            className={styles.banner}
            autoplay
            circular
            indicatorDots
            indicatorColor="rgba(255,255,255,0.4)"
            indicatorActiveColor="#ffffff"
          >
            {banners.map((banner) => (
              <SwiperItem key={banner.id}>
                <View className={styles.bannerItem} onClick={() => goSearch()}>
                  <SmartImage
                    className={styles.bannerPic}
                    type="banner"
                    pic={banner.pic}
                    title={banner.name}
                    name={banner.name}
                  />
                </View>
              </SwiperItem>
            ))}
          </Swiper>
        )}
      </View>

      {/* 分类快捷入口（悬浮卡片） */}
      {!!quickCategories.length && (
        <View className={styles.quickCard}>
          {quickCategories.map((category) => (
            <View key={category.id} className={styles.quickItem} onClick={goCategory}>
              <View className={styles.quickIconWrap}>
                <Image className={styles.quickPic} src={categoryImageOf(category.name)} mode="aspectFill" />
              </View>
              <Text className={styles.quickName}>{category.name}</Text>
            </View>
          ))}
          <View className={styles.quickItem} onClick={() => goCategory()}>
            <View className={styles.quickIconWrap}>
              <Image className={styles.quickPic} src={categoryImageOf('全部分类')} mode="aspectFill" />
            </View>
            <Text className={styles.quickName}>全部分类</Text>
          </View>
        </View>
      )}

      {/* 限时秒杀 */}
      {!!flashList.length && (
        <View className={styles.flashCard}>
          <View className={styles.flashHead}>
            <View className={styles.flashTitle}>
              <Icon name="zap" size={30} color="#ffd66e" className={styles.flashIcon} />
              <Text className={styles.flashName}>限时秒杀</Text>
              <Text className={styles.flashTag}>爆款直降</Text>
            </View>
            <View className={styles.flashRight}>
              <CountDown endTime={flashEndTime} />
              <Text className={styles.flashMore} onClick={() => goSearchWithSort(2)}>
                更多 ›
              </Text>
            </View>
          </View>
          <ScrollView className={styles.flashScroll} scrollX showScrollbar={false}>
            <View className={styles.flashRow}>
              {flashList.map((product) => (
                <View
                  key={product.id}
                  className={styles.flashItem}
                  onClick={() =>
                    Taro.navigateTo({ url: `/pages/product/index?id=${product.id}` })
                  }
                >
                  <SmartImage
                    className={styles.flashPic}
                    type="product"
                    pic={product.pic}
                    name={product.brandName || product.name}
                    lazyLoad
                  />
                  <Text className={styles.flashProductName}>{product.name}</Text>
                  <View className={styles.flashPriceRow}>
                    <Text className={styles.flashPrice}>¥{formatPrice(product.flashPromotionPrice ?? product.price)}</Text>
                    {!!product.originalPrice && (
                      <Text className={styles.flashOriginal}>¥{formatPrice(product.originalPrice)}</Text>
                    )}
                  </View>
                  <Text className={styles.flashLimit}>
                    {product.flashPromotionLimit ? `限购${product.flashPromotionLimit}件` : '限时优惠'}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* 品牌馆 */}
      {!!brands.length && (
        <View className={styles.brandCard}>
          <View className={styles.brandHead}>
            <Text className={styles.brandTitle}>品牌馆</Text>
            <Text className={styles.brandMore} onClick={() => goSearch()}>更多 ›</Text>
          </View>
          <ScrollView className={styles.brandScroll} scrollX showScrollbar={false}>
            <View className={styles.brandRow}>
              {brands.map((brand) => (
                <View
                  key={brand.id}
                  className={styles.brandItem}
                  onClick={() => goSearch(brand.name)}
                >
                  <SmartImage
                    className={styles.brandLogo}
                    type="brand"
                    pic={brand.logo || brand.bigPic}
                    name={brand.name}
                    lazyLoad
                  />
                  <Text className={styles.brandName}>{brand.name}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* 专题精选 */}
      {!!subjects.length && (
        <View className={styles.section}>
          <View className={styles.sectionHead}>
            <View className={styles.sectionTitle}>
              <View className={styles.sectionBar} />
              <View className={styles.sectionNameCol}>
                <Text className={styles.sectionName}>专题精选</Text>
                <Text className={styles.sectionSub}>精选主题 · 好物推荐</Text>
              </View>
            </View>
          </View>
          <ScrollView className={styles.subjectScroll} scrollX showScrollbar={false}>
            <View className={styles.subjectRow}>
              {subjects.map((subject) => (
                <View
                  key={subject.id}
                  className={styles.subjectItem}
                  onClick={() => goSearch(subject.title)}
                >
                  <SmartImage
                    className={styles.subjectPic}
                    type="subject"
                    pic={subject.pic}
                    title={subject.title}
                    tag={subject.categoryName}
                    name={subject.title}
                    lazyLoad
                  />
                  {!!subject.pic && (
                    <View className={styles.subjectInfo}>
                      <Text className={styles.subjectTitle}>{subject.title}</Text>
                      {!!subject.categoryName && <Text className={styles.subjectCate}>{subject.categoryName}</Text>}
                    </View>
                  )}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {renderSection('新品首发', '刚刚上架，抢先看看', newProducts, 1)}
      {renderSection('热销推荐', '本周大家都在买', hotProducts, 2)}
      {renderSection('商城好物', '更多在售商品', recommends, 0)}

      {!loaded && <View className={styles.loading}>正在加载商城好物…</View>}
      {loaded && !newProducts.length && !hotProducts.length && !banners.length && (
        <Empty text="商城商品正在准备中" hint="下拉刷新试试" />
      )}
      {loaded && (newProducts.length > 0 || hotProducts.length > 0) && (
        <View className={styles.footer}>
          <Text className={styles.footerText}>— 已经到底啦 —</Text>
        </View>
      )}

      {/* 热销榜悬浮入口 */}
      {loaded && !!hotProducts.length && (
        <View className={styles.hotFloat} onClick={() => goSearchWithSort(2)}>
          <Icon name="flame" size={36} color="#ffffff" />
          <Text className={styles.hotFloatText}>热销榜</Text>
          <Text className={styles.hotFloatSale}>{formatSaleCount(hotProducts[0]?.sale)}</Text>
        </View>
      )}
    </View>
  )
}

export default HomePage
