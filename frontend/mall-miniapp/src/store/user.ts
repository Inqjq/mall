import { create } from 'zustand'
import Taro from '@tarojs/taro'

const TOKEN_KEY = 'mall_token'
const TOKEN_HEAD_KEY = 'mall_token_head'
const USERNAME_KEY = 'mall_username'

function readStorage(key: string): string {
  try {
    return Taro.getStorageSync(key) || ''
  } catch (e) {
    console.error('[Auth] read storage failed:', key, e)
    return ''
  }
}

interface UserState {
  token: string
  tokenHead: string
  username: string
  saveLogin: (token: string, tokenHead: string, username: string) => void
  logout: () => void
}

export const useUserStore = create<UserState>((set) => ({
  token: readStorage(TOKEN_KEY),
  tokenHead: readStorage(TOKEN_HEAD_KEY) || 'Bearer ',
  username: readStorage(USERNAME_KEY),
  saveLogin: (token, tokenHead, username) => {
    try {
      Taro.setStorageSync(TOKEN_KEY, token)
      Taro.setStorageSync(TOKEN_HEAD_KEY, tokenHead || 'Bearer ')
      Taro.setStorageSync(USERNAME_KEY, username)
    } catch (e) {
      console.error('[Auth] save storage failed:', e)
    }
    set({ token, tokenHead: tokenHead || 'Bearer ', username })
  },
  logout: () => {
    try {
      Taro.removeStorageSync(TOKEN_KEY)
      Taro.removeStorageSync(TOKEN_HEAD_KEY)
      Taro.removeStorageSync(USERNAME_KEY)
    } catch (e) {
      console.error('[Auth] clear storage failed:', e)
    }
    set({ token: '', tokenHead: 'Bearer ', username: '' })
  },
}))
