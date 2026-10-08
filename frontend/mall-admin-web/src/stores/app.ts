import { defineStore } from 'pinia'
import { ref } from 'vue'

/** 应用 UI 状态 */
export const useAppStore = defineStore('app', () => {
  const collapsed = ref(localStorage.getItem('sidebar_collapsed') === '1')

  function toggleSidebar() {
    collapsed.value = !collapsed.value
    localStorage.setItem('sidebar_collapsed', collapsed.value ? '1' : '0')
  }

  return { collapsed, toggleSidebar }
})
