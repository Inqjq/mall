import type { Directive } from 'vue'
import { usePermissionStore } from '@/stores/permission'

/**
 * 按钮级权限指令：v-permission="'addProduct'" 或 v-permission="['addProduct', 'brand']"
 * 无权限时直接移除元素
 */
export const permission: Directive<HTMLElement, string | string[]> = {
  mounted(el, binding) {
    const store = usePermissionStore()
    if (!store.hasPermission(binding.value)) {
      el.parentNode?.removeChild(el)
    }
  },
}
