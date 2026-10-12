import React, { useEffect, useState } from 'react'
import { View, Text } from '@tarojs/components'
import styles from './index.module.scss'

interface CountDownProps {
  endTime?: string
}

function parseEnd(endTime?: string): number {
  if (!endTime) return 0
  try {
    if (/^\d{1,2}:\d{2}/.test(endTime)) {
      // 'HH:mm:ss'：按今天该时刻解析，已过则顺延到明天
      const now = new Date()
      const [h, m, s] = endTime.split(':').map(Number)
      const t = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, s || 0).getTime()
      return t <= Date.now() ? t + 24 * 3600 * 1000 : t
    }
    const t = new Date(endTime.replace(/-/g, '/')).getTime()
    return Number.isNaN(t) ? 0 : t
  } catch (e) {
    console.error('[CountDown] parse endTime failed:', endTime, e)
    return 0
  }
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** 秒杀倒计时：时间无效/已结束时显示「限时优惠」标签 */
const CountDown: React.FC<CountDownProps> = ({ endTime }) => {
  const [text, setText] = useState('')

  useEffect(() => {
    const target = parseEnd(endTime)
    if (!target || target <= Date.now()) {
      setText('')
      return
    }
    const tick = () => {
      const diff = target - Date.now()
      if (diff <= 0) {
        setText('')
        return
      }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setText(`${pad(h)}:${pad(m)}:${pad(s)}`)
    }
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [endTime])

  if (!text) {
    return (
      <View className={styles.wrap}>
        <Text className={styles.label}>限时优惠</Text>
      </View>
    )
  }

  return (
    <View className={styles.wrap}>
      <Text className={styles.prefix}>距结束</Text>
      <Text className={styles.time}>{text}</Text>
    </View>
  )
}

export default CountDown
