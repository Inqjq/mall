import React from 'react'
import { View, Text } from '@tarojs/components'
import classnames from 'classnames'
import styles from './index.module.scss'

interface QuantityStepperProps {
  value: number
  min?: number
  max?: number
  small?: boolean
  onChange: (value: number) => void
}

/** 数量步进器 */
const QuantityStepper: React.FC<QuantityStepperProps> = ({ value, min = 1, max = 999, small, onChange }) => {
  const minus = (e) => {
    e.stopPropagation()
    if (value > min) onChange(value - 1)
  }
  const plus = (e) => {
    e.stopPropagation()
    if (value < max) onChange(value + 1)
  }

  return (
    <View className={classnames(styles.stepper, small && styles.stepperSmall)}>
      <View
        className={classnames(styles.btn, value <= min && styles.btnDisabled)}
        onClick={minus}
      >
        <Text className={styles.btnText}>−</Text>
      </View>
      <Text className={styles.value}>{value}</Text>
      <View
        className={classnames(styles.btn, styles.btnPlus, value >= max && styles.btnDisabled)}
        onClick={plus}
      >
        <Text className={classnames(styles.btnText, styles.plusText)}>+</Text>
      </View>
    </View>
  )
}

export default QuantityStepper
