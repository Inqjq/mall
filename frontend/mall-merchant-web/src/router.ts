import { createRouter, createWebHistory } from 'vue-router'

const tokenKey = 'mall_merchant_token'
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: () => import('./views/Login.vue'), meta: { title: '商家登录' } },
    { path: '/', component: () => import('./Shell.vue'), redirect: '/overview', children: [
      { path: 'overview', component: () => import('./views/Overview.vue'), meta: { title: '经营概况' } },
      { path: 'products', component: () => import('./views/Products.vue'), meta: { title: '商品管理' } },
      { path: 'products/create', component: () => import('./views/ProductEditor.vue'), meta: { title: '新增商品' } },
      { path: 'products/edit/:id', component: () => import('./views/ProductEditor.vue'), meta: { title: '编辑商品' } },
      { path: 'orders', component: () => import('./views/Orders.vue'), meta: { title: '订单履约' } },
      { path: 'marketing', component: () => import('./views/Marketing.vue'), meta: { title: '营销活动' } },
    ] },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})
router.beforeEach((to) => {
  document.title = `${to.meta.title || '商家工作台'} - 商城商家中心`
  const token = localStorage.getItem(tokenKey)
  if (to.path !== '/login' && !token) return { path: '/login', query: { redirect: to.fullPath } }
  if (to.path === '/login' && token) return '/overview'
})
export default router
