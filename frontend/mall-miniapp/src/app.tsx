import React from 'react'
import { useDidShow } from '@tarojs/taro'
import { useUserStore } from '@/store/user'
import { refreshCartBadge } from '@/services/cart'
import './app.scss'

interface AppProps {
  children?: React.ReactNode
}

function App(props: AppProps) {
  useDidShow(() => {
    // 已登录用户刷新购物车 tab 角标（延迟以避开启动期 tabBar 未就绪）
    if (useUserStore.getState().token) {
      setTimeout(() => {
        refreshCartBadge().catch((err) => console.error('[App] refresh cart badge failed:', err))
      }, 600)
    }
  })
  return props.children ?? null
}

export default App
