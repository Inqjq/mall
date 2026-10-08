import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { clearToken, getToken, getTokenHead, setToken } from '@/utils/request'
import type { MemberAddress } from '@/types/api'

export const useUserStore = defineStore('user', () => {
  const token = ref(getToken())
  const tokenHead = ref(getTokenHead())
  const username = ref(localStorage.getItem('mall_app_username') || '')
  // 结算选中的购物车 id（跨页面传递给确认订单页）
  const checkoutCartIds = ref<number[]>([])
  // 结算选中的地址
  const checkoutAddress = ref<MemberAddress | null>(null)

  const isLogin = computed(() => !!token.value)

  function saveToken(t: string, head: string, name: string) {
    token.value = t
    tokenHead.value = head
    username.value = name
    setToken(t, head)
    localStorage.setItem('mall_app_username', name)
  }

  function logout() {
    token.value = ''
    username.value = ''
    clearToken()
    localStorage.removeItem('mall_app_username')
  }

  function setCheckout(ids: number[], address: MemberAddress | null) {
    checkoutCartIds.value = ids
    checkoutAddress.value = address
  }

  return { token, tokenHead, username, isLogin, checkoutCartIds, checkoutAddress, saveToken, logout, setCheckout }
})
