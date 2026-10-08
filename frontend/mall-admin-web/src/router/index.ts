import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from '@/utils/request'
import { usePermissionStore } from '@/stores/permission'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('@/views/login/index.vue'), meta: { title: '登录' } },
    {
      path: '/',
      component: () => import('@/layout/index.vue'),
      redirect: '/dashboard',
      children: [
        { path: 'dashboard', name: 'dashboard', component: () => import('@/views/dashboard/index.vue'), meta: { title: '首页' } },
        { path: 'product', name: 'product', component: () => import('@/views/product/list.vue'), meta: { title: '商品列表' } },
        { path: 'product/create', name: 'productCreate', component: () => import('@/views/product/edit.vue'), meta: { title: '新增商品' } },
        { path: 'product/edit/:id', name: 'productEdit', component: () => import('@/views/product/edit.vue'), meta: { title: '编辑商品' } },
        { path: 'product/category', name: 'productCategory', component: () => import('@/views/product/category.vue'), meta: { title: '商品分类' } },
        { path: 'product/brand', name: 'productBrand', component: () => import('@/views/product/brand.vue'), meta: { title: '品牌管理' } },
        { path: 'product/type', name: 'productType', component: () => import('@/views/product/type.vue'), meta: { title: '商品类型' } },
        { path: 'order', name: 'order', component: () => import('@/views/order/list.vue'), meta: { title: '订单管理' } },
        { path: 'order/detail/:id', name: 'orderDetail', component: () => import('@/views/order/detail.vue'), meta: { title: '订单详情' } },
        { path: 'order/settings', name: 'orderSettings', component: () => import('@/views/order/settings.vue'), meta: { title: '订单设置' } },
        { path: 'order/returns', name: 'orderReturns', component: () => import('@/views/order/returns.vue'), meta: { title: '售后申请' } },
        { path: 'order/return-reasons', name: 'returnReasons', component: () => import('@/views/order/return-reasons.vue'), meta: { title: '退货原因设置' } },
        { path: 'marketing/coupon', name: 'marketingCoupon', component: () => import('@/views/marketing/index.vue'), meta: { title: '优惠券' } },
        { path: 'marketing/flash', name: 'marketingFlash', component: () => import('@/views/marketing/index.vue'), meta: { title: '秒杀活动' } },
        { path: 'marketing/advertise', name: 'marketingAdvertise', component: () => import('@/views/marketing/index.vue'), meta: { title: '首页广告' } },
        { path: 'marketing/home-brand', name: 'homeBrand', component: () => import('@/views/marketing/recommend.vue'), meta: { title: '品牌推荐' } },
        { path: 'marketing/new-product', name: 'homeNew', component: () => import('@/views/marketing/recommend.vue'), meta: { title: '新品推荐' } },
        { path: 'marketing/hot-product', name: 'homeHot', component: () => import('@/views/marketing/recommend.vue'), meta: { title: '人气推荐' } },
        { path: 'marketing/subject', name: 'homeSubject', component: () => import('@/views/marketing/recommend.vue'), meta: { title: '专题推荐' } },
        { path: 'system/user', name: 'systemUser', component: () => import('@/views/system/user.vue'), meta: { title: '系统用户' } },
        { path: 'system/roles', name: 'systemRoles', component: () => import('@/views/system/roles.vue'), meta: { title: '角色管理' } },
        { path: 'search', name: 'search', component: () => import('@/views/search/index.vue'), meta: { title: 'ES 搜索测试' } },
        { path: '403', name: 'forbidden', component: () => import('@/views/error/403.vue'), meta: { title: '无权限' } },
      ],
    },
    { path: '/404', name: 'notFound', component: () => import('@/views/error/404.vue'), meta: { title: '页面不存在' } },
    { path: '/:pathMatch(.*)*', redirect: '/404' },
  ],
})

router.beforeEach(async (to) => {
  document.title = `${to.meta.title || ''} - mall 后台管理`
  const token = getToken()
  if (to.path !== '/login' && !token) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  if (to.path === '/login' && token) {
    return '/dashboard'
  }
  // 登录后首次导航：拉取菜单/角色，做路径级访问控制
  const permissionStore = usePermissionStore()
  if (token && !permissionStore.loaded) {
    try {
      await permissionStore.loadInfo()
    } catch {
      return true // 拦截器已提示；失败放行，由接口层兜底
    }
    if (!permissionStore.canAccess(to.path)) {
      return '/403'
    }
  }
  return true
})

export default router
