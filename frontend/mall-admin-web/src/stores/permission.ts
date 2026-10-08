import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getAdminInfo } from '@/api/admin'
import type { UmsMenu } from '@/types/api'
import { useUserStore } from '@/stores/user'

/** 超级管理员角色名（拥有全部权限） */
export const SUPER_ROLE = '超级管理员'

export interface MenuNode {
  id: number
  title: string
  name: string
  icon: string
  children: MenuNode[]
}

/** 后端菜单 name -> 前端路由 path（无映射的后端菜单不渲染，如 addProduct 仅作按钮权限点） */
export const MENU_ROUTE_MAP: Record<string, string> = {
  product: '/product',
  productCate: '/product/category',
  brand: '/product/brand',
  productAttr: '/product/type',
  order: '/order',
  orderSetting: '/order/settings',
  returnApply: '/order/returns',
  returnReason: '/order/return-reasons',
  coupon: '/marketing/coupon',
  flash: '/marketing/flash',
  homeAdvertise: '/marketing/advertise',
  homeBrand: '/marketing/home-brand',
  homeNew: '/marketing/new-product',
  homeHot: '/marketing/hot-product',
  homeSubject: '/marketing/subject',
  admin: '/system/user',
  role: '/system/roles',
}

/** 无需权限即可访问的路径 */
export const PUBLIC_PATHS = ['/dashboard', '/search', '/403', '/404']

export const usePermissionStore = defineStore('permission', () => {
  const menus = ref<UmsMenu[]>([])
  const roles = ref<string[]>([])
  const loaded = ref(false)

  /** 权限点集合：全部菜单 name + 角色名 */
  const permissionSet = computed(() => new Set<string>([...menus.value.map((m) => m.name), ...roles.value]))

  /** 已映射到前端路由的路径集合（动态菜单可访问范围） */
  const allowedPaths = computed(() => new Set(Object.values(MENU_ROUTE_MAP)))

  /** 组树后的菜单（仅保留有前端页面映射的节点） */
  const menuTree = computed<MenuNode[]>(() => {
    const top = menus.value.filter((m) => m.level === 0)
    const result: MenuNode[] = []
    for (const parent of top) {
      const children = menus.value
        .filter((m) => m.parentId === parent.id && MENU_ROUTE_MAP[m.name])
        .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
        .map((m) => ({ id: m.id, title: m.title, name: m.name, icon: m.icon, children: [] }))
      if (children.length === 0) continue
      result.push({ id: parent.id, title: parent.title, name: parent.name, icon: parent.icon, children })
    }
    return result
  })

  async function loadInfo() {
    const info = await getAdminInfo()
    const userStore = useUserStore()
    userStore.setInfo(info)
    menus.value = info.menus || []
    roles.value = info.roles || []
    loaded.value = true
  }

  function reset() {
    menus.value = []
    roles.value = []
    loaded.value = false
  }

  /** 是否拥有给定权限点（数组=任一满足） */
  function hasPermission(points: string | string[]): boolean {
    if (roles.value.includes(SUPER_ROLE)) return true
    const list = Array.isArray(points) ? points : [points]
    return list.some((p) => permissionSet.value.has(p))
  }

  /** 路由是否可访问 */
  function canAccess(path: string): boolean {
    if (PUBLIC_PATHS.includes(path)) return true
    if (!allowedPaths.value.has(path)) return true // 未映射路径（如 404）放行
    return hasPermission(Object.keys(MENU_ROUTE_MAP).filter((k) => MENU_ROUTE_MAP[k] === path))
  }

  return { menus, roles, loaded, menuTree, allowedPaths, loadInfo, reset, hasPermission, canAccess }
})
