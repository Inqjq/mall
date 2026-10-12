import React, { useState } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import { login } from '@/services/member'
import { refreshCartBadge } from '@/services/cart'
import { useUserStore } from '@/store/user'
import Icon from '@/components/Icon'
import styles from './index.module.scss'

function LoginPage() {
  const saveLogin = useUserStore((s) => s.saveLogin)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const backToPrev = () => {
    const pages = Taro.getCurrentPages()
    if (pages.length > 1) {
      Taro.navigateBack()
    } else {
      Taro.switchTab({ url: '/pages/index/index' })
    }
  }

  const handleSubmit = async () => {
    if (submitting) return
    const name = username.trim()
    if (!name) {
      Taro.showToast({ title: '请输入用户名', icon: 'none' })
      return
    }
    if (!password) {
      Taro.showToast({ title: '请输入密码', icon: 'none' })
      return
    }
    setSubmitting(true)
    try {
      const result = await login(name, password)
      saveLogin(result.token, result.tokenHead, name)
      refreshCartBadge()
      Taro.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(backToPrev, 600)
    } catch (e) {
      // 请求层已提示错误原因
      console.error('[Login] login failed:', e)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View className={styles.page}>
      {/* 品牌区 */}
      <View className={styles.hero}>
        <View className={styles.logo}>
          <Text className={styles.logoText}>M</Text>
        </View>
        <Text className={styles.title}>Mall 商城</Text>
        <Text className={styles.subtitle}>精选好物 · 品质保障 · 贴心售后</Text>
      </View>

      {/* 登录表单 */}
      <View className={styles.formCard}>
        <View className={styles.inputRow}>
          <View className={styles.inputIconWrap}>
            <Icon name="user" size={36} color="#86909c" />
          </View>
          <Input
            className={styles.input}
            type="text"
            value={username}
            placeholder="请输入用户名"
            placeholderClass={styles.placeholder}
            maxlength={32}
            onInput={(e) => setUsername(e.detail.value)}
          />
        </View>
        <View className={styles.formDivider} />
        <View className={styles.inputRow}>
          <View className={styles.inputIconWrap}>
            <Icon name="lock" size={36} color="#86909c" />
          </View>
          <Input
            className={styles.input}
            type="text"
            password
            value={password}
            placeholder="请输入密码"
            placeholderClass={styles.placeholder}
            maxlength={64}
            onInput={(e) => setPassword(e.detail.value)}
            onConfirm={handleSubmit}
          />
        </View>
      </View>

      {/* 登录按钮 */}
      <View
        className={classnames(styles.submitBtn, submitting && styles.submitDisabled)}
        onClick={handleSubmit}
      >
        <Text className={styles.submitText}>{submitting ? '登录中…' : '登 录'}</Text>
      </View>

      <View className={styles.agreement}>
        <Text className={styles.agreementText}>登录即代表同意</Text>
        <Text className={styles.agreementLink} onClick={() => Taro.showToast({ title: '协议页面即将上线', icon: 'none' })}>
          《用户协议》
        </Text>
        <Text className={styles.agreementText}>与</Text>
        <Text className={styles.agreementLink} onClick={() => Taro.showToast({ title: '协议页面即将上线', icon: 'none' })}>
          《隐私政策》
        </Text>
      </View>

      <View className={styles.skipRow} onClick={backToPrev}>
        <Text className={styles.skipText}>暂不登录，先逛逛 ›</Text>
      </View>
    </View>
  )
}

export default LoginPage
