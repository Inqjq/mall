import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from '@/utils/request'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('@/views/home/index.vue'),
      meta: { title: '首页', tabbar: true },
    },
    {
      path: '/category',
      component: () => import('@/views/category/index.vue'),
      meta: { title: '分类', tabbar: true },
    },
    {
      path: '/cart',
      component: () => import('@/views/cart/index.vue'),
      meta: { title: '购物车', tabbar: true, auth: true },
    },
    {
      path: '/mine',
      component: () => import('@/views/mine/index.vue'),
      meta: { title: '我的', tabbar: true, auth: true },
    },
    { path: '/search', component: () => import('@/views/search/index.vue'), meta: { title: '搜索' } },
    { path: '/product/:id', component: () => import('@/views/product/detail.vue'), meta: { title: '商品详情' } },
    { path: '/order/confirm', component: () => import('@/views/order/confirm.vue'), meta: { title: '确认订单', auth: true } },
    { path: '/order/list', component: () => import('@/views/order/list.vue'), meta: { title: '我的订单', auth: true } },
    { path: '/login', component: () => import('@/views/login/index.vue'), meta: { title: '登录' } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to) => {
  document.title = `${to.meta.title || 'mall 商城'}`
  if (to.meta.auth && !getToken()) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  return true
})

export default router
