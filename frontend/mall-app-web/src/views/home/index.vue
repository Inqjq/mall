<template>
  <div class="home-page">
    <section class="market-hero page-container">
      <aside class="category-menu">
        <div class="menu-title">全部商品分类 <van-icon name="bars" /></div>
        <router-link v-for="category in categories.slice(0, 9)" :key="category.id" :to="{ path: '/category', query: { categoryId: category.id } }" class="menu-category">
          <span>{{ category.name }}</span><small v-if="category.childrenList?.length">{{ category.childrenList.slice(0, 2).map(item => item.name).join(' / ') }}</small><van-icon name="arrow" />
        </router-link>
        <router-link v-if="!categories.length" to="/category" class="menu-empty">服装 · 数码 · 家居 · 更多好物 <van-icon name="arrow" /></router-link>
      </aside>

      <div class="hero-center">
        <div class="banner-frame">
          <van-swipe v-if="banners.length" class="banner-carousel" :autoplay="4500" indicator-color="#e1251b" lazy-render>
            <van-swipe-item v-for="banner in banners" :key="banner.id"><a :href="banner.url || undefined" @click.prevent="onBannerClick(banner)"><img :src="banner.pic" :alt="banner.name" /><span class="banner-title">{{ banner.name }}</span></a></van-swipe-item>
          </van-swipe>
          <div v-else class="default-banner" :style="heroImage ? { backgroundImage: `linear-gradient(90deg, rgba(0,0,0,.46), rgba(0,0,0,.02)), url('${heroImage}')` } : undefined">
            <div class="default-banner-copy"><span>新品推荐</span><strong>本周上新<br />好价直达</strong><router-link to="/search?sort=1">查看新品 <van-icon name="arrow" /></router-link></div>
          </div>
        </div>
        <div class="promo-tiles">
          <router-link to="/search?sort=1" class="promo-tile promo-new"><span>新品推荐</span><strong>查看最近上架</strong><small>新品好物</small><van-icon name="arrow" /></router-link>
          <router-link to="/search?sort=2" class="promo-tile promo-hot"><span>热销榜单</span><strong>查看热卖商品</strong><small>销量排行</small><van-icon name="arrow" /></router-link>
          <router-link to="/category" class="promo-tile promo-life"><span>全部分类</span><strong>按分类找商品</strong><small>商品分类</small><van-icon name="arrow" /></router-link>
        </div>
      </div>

      <aside class="right-rail">
        <div class="member-panel">
          <div class="member-heading"><div class="avatar"><van-icon name="user-o" /></div><div><strong>{{ userStore.isLogin ? `Hi，${userStore.username}` : 'Hi，欢迎来到 Mall' }}</strong><small>{{ userStore.isLogin ? '欢迎回来，继续逛逛吧' : '登录后享受更多会员服务' }}</small></div></div>
          <div v-if="!userStore.isLogin" class="member-actions"><router-link to="/login">会员登录</router-link><router-link to="/category">去逛逛</router-link></div>
          <div v-else class="member-actions"><router-link to="/order/list">我的订单</router-link><router-link to="/cart">购物车</router-link></div>
          <div class="member-shortcuts"><router-link to="/order/list?status=0"><van-icon name="pending-payment" /><span>待付款</span></router-link><router-link to="/order/list?status=2"><van-icon name="logistics" /><span>待收货</span></router-link><router-link to="/order/list?status=3"><van-icon name="passed" /><span>已完成</span></router-link></div>
        </div>
        <div class="hot-panel">
          <div class="hot-heading"><strong>人气热卖</strong><router-link to="/search?sort=2">更多 <van-icon name="arrow" /></router-link></div>
          <router-link v-for="(product, index) in hotProducts.slice(0, 3)" :key="product.id" :to="`/product/${product.id}`" class="hot-item"><span class="rank" :class="`rank-${index + 1}`">{{ index + 1 }}</span><img :src="product.pic" :alt="product.name" loading="lazy" /><span class="hot-info"><strong>{{ product.name }}</strong><small>¥{{ Number(product.price || 0).toFixed(2) }}</small></span></router-link>
          <div v-if="!hotProducts.length" class="hot-empty">好物正在上架中</div>
        </div>
      </aside>
    </section>

    <section v-if="flashProducts.length" class="flash-section page-container">
      <div class="flash-heading"><div class="flash-title"><van-icon name="clock-o" /><strong>限时秒杀</strong><span>活动商品</span></div><router-link to="/search?sort=2">更多秒杀商品 <van-icon name="arrow" /></router-link></div>
      <div class="flash-products">
        <router-link v-for="product in flashProducts.slice(0, 5)" :key="product.id" :to="`/product/${product.id}`" class="flash-product">
          <img :src="product.pic" :alt="product.name" loading="lazy" />
          <div class="flash-info"><strong>{{ product.name }}</strong><div class="flash-price"><span>¥{{ Number(product.flashPromotionPrice ?? product.price ?? 0).toFixed(2) }}</span><del v-if="product.originalPrice">¥{{ Number(product.originalPrice).toFixed(2) }}</del></div><small v-if="product.flashPromotionLimit">每人限购 {{ product.flashPromotionLimit }} 件</small><small v-else>限时优惠</small></div>
        </router-link>
      </div>
    </section>

    <section v-if="brands.length" class="brand-strip page-container"><div class="brand-label"><strong>品牌推荐</strong><small>品牌商品</small></div><router-link v-for="brand in brands.slice(0, 7)" :key="brand.id" :to="{ path: '/search', query: { keyword: brand.name } }" :title="brand.name"><img v-if="brand.logo || brand.bigPic" :src="brand.logo || brand.bigPic" :alt="brand.name" loading="lazy" /><span v-else>{{ brand.name }}</span></router-link><router-link to="/category" class="brand-more">更多 <van-icon name="arrow" /></router-link></section>

    <section v-if="newProducts.length" class="goods-section page-container">
      <div class="section-head"><div class="section-title"><i></i><div><strong>新品首发</strong><small>刚刚上架，抢先看看</small></div></div><router-link to="/search?sort=1">全部新品 <van-icon name="arrow" /></router-link></div>
      <div class="goods-grid"><ProductCard v-for="product in newProducts.slice(0, 10)" :key="product.id" :product="product" /></div>
    </section>

    <section v-if="hotProducts.length" class="goods-section page-container hot-goods-section">
      <div class="section-head"><div class="section-title"><i></i><div><strong>热销推荐</strong><small>本周大家都在买</small></div></div><router-link to="/search?sort=2">查看热销榜 <van-icon name="arrow" /></router-link></div>
      <div class="goods-grid"><ProductCard v-for="product in hotProducts.slice(0, 10)" :key="product.id" :product="product" /></div>
    </section>

    <section v-if="recommendProducts.length" class="goods-section page-container recommend-section">
      <div class="section-head"><div class="section-title"><i></i><div><strong>商城好物</strong><small>更多在售商品</small></div></div><router-link to="/search">查看全部 <van-icon name="arrow" /></router-link></div>
      <div class="goods-grid"><ProductCard v-for="product in recommendProducts" :key="product.id" :product="product" /></div>
    </section>

    <div v-if="!loaded" class="home-loading"><van-loading color="#e1251b" /> 正在加载商城商品…</div>
    <van-empty v-else-if="!newProducts.length && !hotProducts.length && !banners.length" description="商城商品正在准备中" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getHomeContent, getProductCategoryTree, getRecommendProductList } from '@/api/home'
import type { Brand, HomeAdvertise, Product, FlashPromotionProduct, CategoryNode } from '@/types/api'
import { useUserStore } from '@/stores/user'
import ProductCard from '@/components/ProductCard.vue'

const router = useRouter()
const userStore = useUserStore()
const banners = ref<HomeAdvertise[]>([])
const brands = ref<Brand[]>([])
const newProducts = ref<Product[]>([])
const hotProducts = ref<Product[]>([])
const flashProducts = ref<FlashPromotionProduct[]>([])
const recommendProducts = ref<Product[]>([])
const categories = ref<CategoryNode[]>([])
const loaded = ref(false)
const heroImage = computed(() => newProducts.value[0]?.pic || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1400&q=85')

onMounted(async () => {
  const results = await Promise.allSettled([getHomeContent(), getProductCategoryTree(), getRecommendProductList(1, 10)])
  if (results[0].status === 'fulfilled') {
    const content = results[0].value
    banners.value = content.advertiseList || []
    brands.value = content.brandList || []
    newProducts.value = content.newProductList || []
    hotProducts.value = content.hotProductList?.length ? content.hotProductList : content.homeFlashPromotion?.productList || []
    flashProducts.value = content.homeFlashPromotion?.productList || []
  }
  if (results[1].status === 'fulfilled') categories.value = results[1].value || []
  if (results[2].status === 'fulfilled') recommendProducts.value = results[2].value || []
  loaded.value = true
})

function onBannerClick(banner: HomeAdvertise) {
  if (!banner.url) return
  const target = new URL(banner.url, window.location.origin)
  if (target.pathname.includes('/pages/brand/brandDetail')) {
    const brandId = Number(target.searchParams.get('id'))
    const brand = brands.value.find((item) => item.id === brandId)
    if (brand) router.push({ path: '/search', query: { keyword: brand.name, brandId: String(brand.id) } })
    else router.push('/category')
    return
  }
  if (target.origin === window.location.origin && ['/search', '/category', '/order/list', '/cart'].some((path) => target.pathname.startsWith(path))) {
    router.push({ path: target.pathname, query: Object.fromEntries(target.searchParams.entries()) })
  } else if (target.origin !== window.location.origin) {
    window.open(target.href, '_blank', 'noopener,noreferrer')
  }
}
</script>

<style scoped>
.home-page { padding: 0 0 35px; }
.market-hero { display: grid; grid-template-columns: 218px minmax(0,1fr) 230px; gap: 12px; padding-top: 14px; }
.category-menu, .right-rail { min-width: 0; }
.category-menu { align-self: stretch; padding: 0 0 8px; background: #fff; border: 1px solid #eee; }
.menu-title { height: 41px; display: flex; justify-content: space-between; align-items: center; padding: 0 14px; border-bottom: 1px solid #f2f2f2; color: #333; font-size: 14px; font-weight: 600; }
.menu-title .van-icon { color: #999; }
.menu-category { min-height: 49px; position: relative; display: flex; flex-direction: column; justify-content: center; gap: 4px; padding: 6px 24px 6px 15px; color: #444; transition: background .16s, color .16s; }
.menu-category:hover { color: var(--store-primary); background: #fff4f2; }
.menu-category > span { font-size: 13px; font-weight: 550; }
.menu-category small { overflow: hidden; color: #999; font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
.menu-category > .van-icon { position: absolute; top: 16px; right: 10px; color: #aaa; font-size: 11px; }
.menu-empty { min-height: 130px; display: flex; align-items: center; justify-content: center; gap: 6px; color: #999; font-size: 11px; }
.hero-center { min-width: 0; }
.banner-frame { height: 314px; overflow: hidden; background: #eee; }
.banner-carousel, .banner-carousel :deep(.van-swipe-item), .banner-carousel a { width: 100%; height: 100%; display: block; position: relative; }
.banner-carousel img { width: 100%; height: 100%; display: block; object-fit: cover; }
.banner-title { position: absolute; left: 22px; bottom: 23px; max-width: 70%; padding: 8px 12px; color: #fff; background: rgba(0,0,0,.36); font-size: 13px; }
.default-banner { height: 100%; display: flex; align-items: center; background-color: #aaa; background-size: cover; background-position: center; }
.default-banner-copy { display: flex; flex-direction: column; align-items: flex-start; gap: 11px; padding: 30px 42px; color: #fff; }
.default-banner-copy > span { font-size: 12px; letter-spacing: .1em; }
.default-banner-copy strong { font-size: clamp(28px,3vw,42px); line-height: 1.25; }
.default-banner-copy a { margin-top: 5px; padding: 9px 15px; color: #fff; background: var(--store-primary); font-size: 12px; }
.promo-tiles { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 8px; margin-top: 9px; }
.promo-tile { min-height: 93px; position: relative; display: flex; flex-direction: column; justify-content: center; gap: 4px; overflow: hidden; padding: 10px 12px; background: #fff; border: 1px solid #eee; transition: border-color .18s, transform .18s; }
.promo-tile:hover { border-color: #f1b6af; transform: translateY(-2px); }
.promo-tile span { color: #e1251b; font-size: 11px; }
.promo-tile strong { color: #333; font-size: 13px; }
.promo-tile small { color: #aaa; font-size: 8px; letter-spacing: .08em; }
.promo-tile .van-icon { position: absolute; right: 10px; bottom: 11px; color: #bbb; }
.promo-new { background: linear-gradient(110deg,#fff,#fff2ef); }
.promo-hot { background: linear-gradient(110deg,#fff,#fff8e9); }
.promo-life { background: linear-gradient(110deg,#fff,#f4f7ff); }
.right-rail { display: flex; flex-direction: column; gap: 10px; }
.member-panel, .hot-panel { padding: 14px; border: 1px solid #eee; background: #fff; }
.member-heading { display: flex; align-items: center; gap: 10px; padding-bottom: 13px; border-bottom: 1px solid #f1f1f1; }
.avatar { width: 40px; height: 40px; display: grid; place-items: center; flex: 0 0 auto; border-radius: 50%; color: #fff; background: #f3a37d; font-size: 20px; }
.member-heading > div:last-child { min-width: 0; display: flex; flex-direction: column; gap: 5px; }
.member-heading strong { overflow: hidden; color: #444; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.member-heading small { color: #999; font-size: 10px; }
.member-actions { display: flex; gap: 8px; padding: 12px 0; }
.member-actions a { min-height: 30px; flex: 1; display: grid; place-items: center; border: 1px solid var(--store-primary); color: var(--store-primary); font-size: 11px; }
.member-actions a:first-child { color: #fff; background: var(--store-primary); }
.member-shortcuts { display: grid; grid-template-columns: repeat(3,1fr); padding-top: 11px; border-top: 1px solid #f1f1f1; }
.member-shortcuts a { display: flex; flex-direction: column; align-items: center; gap: 6px; color: #777; font-size: 10px; }
.member-shortcuts a:hover { color: var(--store-primary); }
.member-shortcuts .van-icon { font-size: 17px; }
.hot-panel { flex: 1; }
.hot-heading { display: flex; align-items: center; justify-content: space-between; padding-bottom: 7px; border-bottom: 1px solid #f1f1f1; }
.hot-heading strong { font-size: 13px; }
.hot-heading a { color: #999; font-size: 10px; }
.hot-item { min-height: 58px; display: flex; align-items: center; gap: 7px; border-bottom: 1px dashed #eee; }
.hot-item:last-child { border: 0; }
.rank { width: 15px; color: #999; font-size: 10px; font-weight: 700; text-align: center; }
.rank-1 { color: #f05a42; }
.rank-2 { color: #f09739; }
.rank-3 { color: #d6a145; }
.hot-item img { width: 44px; height: 44px; object-fit: cover; background: #f5f5f5; }
.hot-info { min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.hot-info strong { overflow: hidden; color: #555; font-size: 10px; font-weight: 500; text-overflow: ellipsis; white-space: nowrap; }
.hot-info small { color: var(--store-primary); font-size: 11px; font-weight: 600; }
.hot-empty { padding: 26px 0; color: #aaa; font-size: 11px; text-align: center; }
.flash-section { margin-top: 13px; padding: 0; background: #fff; border: 1px solid #eee; }
.flash-heading { min-height: 47px; display: flex; align-items: center; justify-content: space-between; padding: 0 15px; border-bottom: 1px solid #f2f2f2; }
.flash-title { display: flex; align-items: center; gap: 8px; }
.flash-title .van-icon { color: var(--store-primary); font-size: 18px; }
.flash-title strong { color: var(--store-primary); font-size: 16px; }
.flash-title span { padding: 3px 7px; color: #e25c3d; background: #fff1ed; font-size: 10px; }
.flash-heading > a { color: #888; font-size: 11px; }
.flash-products { display: grid; grid-template-columns: repeat(5,minmax(0,1fr)); }
.flash-product { min-width: 0; display: flex; align-items: center; gap: 10px; padding: 13px; border-right: 1px solid #f2f2f2; }
.flash-product:last-child { border: 0; }
.flash-product:hover { background: #fff9f7; }
.flash-product img { width: 82px; height: 82px; flex: 0 0 auto; object-fit: contain; background: #fafafa; }
.flash-info { min-width: 0; display: flex; flex-direction: column; gap: 8px; }
.flash-info strong { height: 32px; overflow: hidden; color: #555; font-size: 11px; font-weight: 500; line-height: 1.5; }
.flash-price { display: flex; align-items: baseline; gap: 5px; }
.flash-price span { color: var(--store-primary); font-size: 16px; font-weight: 700; }
.flash-price del { color: #aaa; font-size: 9px; }
.flash-info small { color: #999; font-size: 9px; }
.brand-strip { min-height: 78px; display: flex; align-items: center; gap: 14px; margin-top: 13px; padding: 11px 15px; border: 1px solid #eee; background: #fff; }
.brand-label { min-width: 106px; display: flex; flex-direction: column; gap: 4px; padding-right: 13px; border-right: 1px solid #eee; }
.brand-label strong { font-size: 12px; }
.brand-label small { color: #aaa; font-size: 8px; }
.brand-strip > a:not(.brand-more) { min-width: 0; flex: 1; display: grid; place-items: center; height: 48px; overflow: hidden; color: #666; font-size: 11px; }
.brand-strip > a:not(.brand-more):hover { color: var(--store-primary); }
.brand-strip img { max-width: 100%; max-height: 42px; object-fit: contain; }
.brand-more { display: flex; align-items: center; gap: 5px; color: #999; font-size: 10px; white-space: nowrap; }
.goods-section { margin-top: 21px; }
.section-head { min-height: 54px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; padding: 0 14px; background: #fff; border: 1px solid #eee; border-bottom: 2px solid #e1251b; }
.section-title { display: flex; align-items: center; gap: 10px; }
.section-title i { width: 4px; height: 23px; background: var(--store-primary); }
.section-title > div { display: flex; align-items: baseline; gap: 12px; }
.section-title strong { color: #333; font-size: 17px; }
.section-title small { color: #999; font-size: 11px; }
.section-head > a { display: inline-flex; align-items: center; gap: 6px; color: #777; font-size: 11px; }
.section-head > a:hover { color: var(--store-primary); }
.goods-grid { display: grid; grid-template-columns: repeat(5,minmax(0,1fr)); gap: 10px; }
.home-loading { min-height: 160px; display: flex; align-items: center; justify-content: center; gap: 10px; color: #999; font-size: 12px; }
@media (max-width: 1100px) and (min-width: 761px) {
 .market-hero { grid-template-columns: 185px minmax(0,1fr); }
 .right-rail { grid-column: 1 / -1; display: grid; grid-template-columns: 1fr 1fr; }
 .banner-frame { height: 280px; }
 .promo-tile { min-height: 82px; }
 .flash-products { grid-template-columns: repeat(3,minmax(0,1fr)); }
 .flash-product:nth-child(n+4) { display: none; }
 .flash-product { padding: 9px; }
 .flash-product img { width: 60px; height: 60px; }
 .goods-grid { grid-template-columns: repeat(4,minmax(0,1fr)); }
}
@media (max-width: 760px) {
 .market-hero { display: flex; flex-direction: column; gap: 8px; width: auto; padding: 9px 10px 0; }
 .category-menu { order: 2; display: flex; overflow-x: auto; padding: 0; border: 0; background: #fff; scrollbar-width: none; }
 .category-menu::-webkit-scrollbar { display: none; }
 .menu-title { display: none; }
 .menu-category { min-width: 76px; min-height: 56px; align-items: center; justify-content: center; gap: 0; padding: 6px 9px; text-align: center; }
 .menu-category > span { font-size: 11px; }
 .menu-category small, .menu-category > .van-icon, .menu-empty { display: none; }
 .hero-center { order: 1; }
 .banner-frame { height: 190px; }
 .default-banner-copy { gap: 8px; padding: 20px 22px; }
 .default-banner-copy > span { font-size: 10px; }
 .default-banner-copy strong { font-size: 25px; }
 .default-banner-copy a { padding: 7px 10px; font-size: 10px; }
 .banner-title { left: 10px; bottom: 10px; padding: 5px 8px; font-size: 10px; }
 .promo-tiles { gap: 5px; margin-top: 6px; }
 .promo-tile { min-height: 70px; gap: 3px; padding: 7px; }
 .promo-tile span { font-size: 9px; }
 .promo-tile strong { font-size: 10px; }
 .promo-tile small { font-size: 6px; }
 .promo-tile .van-icon { right: 5px; bottom: 6px; font-size: 10px; }
 .right-rail { order: 3; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
 .member-panel, .hot-panel { padding: 9px; }
 .member-heading { gap: 6px; padding-bottom: 8px; }
 .avatar { width: 30px; height: 30px; font-size: 15px; }
 .member-heading strong { font-size: 9px; }
 .member-heading small { font-size: 8px; }
 .member-actions { gap: 5px; padding: 8px 0; }
 .member-actions a { min-height: 25px; font-size: 9px; }
 .member-shortcuts { padding-top: 7px; }
 .member-shortcuts a { gap: 3px; font-size: 8px; }
 .member-shortcuts .van-icon { font-size: 13px; }
 .hot-heading strong { font-size: 10px; }
 .hot-heading a { font-size: 8px; }
 .hot-item { min-height: 45px; gap: 4px; }
 .rank { width: 10px; font-size: 8px; }
 .hot-item img { width: 34px; height: 34px; }
 .hot-info { gap: 2px; }
 .hot-info strong { font-size: 8px; }
 .hot-info small { font-size: 9px; }
 .flash-section { width: auto; margin: 8px 10px 0; }
 .flash-heading { min-height: 38px; padding: 0 9px; }
 .flash-title { gap: 5px; }
 .flash-title strong { font-size: 13px; }
 .flash-title .van-icon { font-size: 15px; }
 .flash-title span { font-size: 8px; }
 .flash-heading > a { font-size: 9px; }
 .flash-products { grid-template-columns: repeat(2,minmax(0,1fr)); }
 .flash-product { gap: 6px; padding: 7px; }
 .flash-product:nth-child(n+3) { display: none; }
 .flash-product img { width: 54px; height: 54px; }
 .flash-info { gap: 4px; }
 .flash-info strong { height: 27px; font-size: 9px; }
 .flash-price span { font-size: 13px; }
 .flash-info small { font-size: 8px; }
 .brand-strip { min-height: 63px; gap: 7px; margin: 8px 10px 0; padding: 8px; }
 .brand-label { min-width: 54px; padding-right: 7px; }
 .brand-label strong { font-size: 9px; }
 .brand-label small { font-size: 6px; }
 .brand-strip > a:not(.brand-more) { height: 36px; font-size: 8px; }
 .brand-strip img { max-height: 31px; }
 .brand-more { font-size: 8px; }
 .goods-section { width: auto; margin: 14px 10px 0; }
 .section-head { min-height: 44px; margin-bottom: 7px; padding: 0 9px; }
 .section-title { gap: 7px; }
 .section-title i { height: 19px; }
 .section-title > div { gap: 6px; }
 .section-title strong { font-size: 13px; }
 .section-title small { font-size: 8px; }
 .section-head > a { gap: 3px; font-size: 9px; }
 .goods-grid { grid-template-columns: repeat(2,minmax(0,1fr)); gap: 7px; }
 .home-loading { min-height: 120px; font-size: 10px; }
}
</style>
