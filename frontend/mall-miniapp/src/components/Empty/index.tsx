import React from 'react'
import { View, Text } from '@tarojs/components'
import Icon, { type IconName } from '@/components/Icon'
import styles from './index.module.scss'

interface EmptyProps {
  icon?: IconName
  text: string
  hint?: string
  actionText?: string
  onAction?: () => void
}

/** 通用空态组件 */
const Empty: React.FC<EmptyProps> = ({ icon = 'shopping-bag', text, hint, actionText, onAction }) => {
  return (
    <View className={styles.empty}>
      <View className={styles.iconWrap}>
        <Icon name={icon} size={64} color="#c9cdd4" strokeWidth={1.6} />
      </View>
      <Text className={styles.text}>{text}</Text>
      {!!hint && <Text className={styles.hint}>{hint}</Text>}
      {!!actionText && (
        <View className={styles.action} onClick={onAction}>
          <Text className={styles.actionText}>{actionText}</Text>
        </View>
      )}
    </View>
  )
}

export default Empty
