import { defineStore } from 'pinia'
import { ref } from 'vue'
import { clearToken, getToken, getTokenHead, setToken } from '@/utils/request'
import type { AdminInfo } from '@/types/api'

export const useUserStore = defineStore('user', () => {
  const token = ref(getToken())
  const tokenHead = ref(getTokenHead())
  const username = ref('')
  const roles = ref<string[]>([])

  function saveToken(t: string, head: string) {
    token.value = t
    tokenHead.value = head
    setToken(t, head)
  }

  function setInfo(info: AdminInfo) {
    username.value = info.username
    roles.value = info.roles || []
  }

  function logout() {
    token.value = ''
    username.value = ''
    roles.value = []
    clearToken()
  }

  return { token, tokenHead, username, roles, saveToken, setInfo, logout }
})
