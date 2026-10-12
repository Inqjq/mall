import React, { useEffect, useRef, useState } from 'react'
import { View, Text, ScrollView, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import { chatWithAgent, getAgentSessionId, type AgentLink } from '@/services/agent'
import { mapWebPath, smartNavigate } from '@/utils/navigate'
import Icon from '@/components/Icon'
import styles from './index.module.scss'

interface ChatMessage {
  id: number
  role: 'user' | 'agent'
  text: string
  links?: AgentLink[]
}

const WELCOME_TEXT = '您好，我是 Mall 商城的 AI 客服小蜜，可以帮您找商品、查订单物流、了解优惠券使用方式。请问有什么可以帮您？'

const SUGGESTIONS = ['怎么查我的订单？', '想退货怎么办？', '怎么领优惠券？', '帮我推荐好物']

let msgSeq = 0
function nextId(): number {
  msgSeq += 1
  return msgSeq
}

function AssistantPage() {
  const sessionRef = useRef('')
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: nextId(), role: 'agent', text: WELCOME_TEXT },
  ])
  const [typing, setTyping] = useState(false)
  const [input, setInput] = useState('')
  const [scrollId, setScrollId] = useState('')

  useEffect(() => {
    sessionRef.current = getAgentSessionId()
    setScrollId(`msg-${messages[0].id}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // 消息或输入状态变化时滚动到底部
    if (typing) {
      setScrollId('msg-typing')
    } else {
      const last = messages[messages.length - 1]
      if (last) setScrollId(`msg-${last.id}`)
    }
  }, [messages, typing])

  const pushMessage = (msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg])
  }

  const send = async (rawText?: string) => {
    const text = (rawText ?? input).trim()
    if (!text || typing) return
    setInput('')
    pushMessage({ id: nextId(), role: 'user', text })
    setTyping(true)
    try {
      const reply = await chatWithAgent(text, sessionRef.current)
      pushMessage({ id: nextId(), role: 'agent', text: reply.reply, links: reply.links })
    } catch (e) {
      // chatWithAgent 内部已做本地知识库降级，一般不会走到这里
      console.error('[Assistant] chat error:', e)
      pushMessage({ id: nextId(), role: 'agent', text: '抱歉，网络似乎不太顺畅，请稍后再试。' })
    } finally {
      setTyping(false)
    }
  }

  const handleLink = (to: string) => {
    if (to.startsWith('/pages/')) {
      smartNavigate(to)
      return
    }
    const mapped = mapWebPath(to)
    if (mapped) {
      smartNavigate(mapped)
    } else {
      Taro.showToast({ title: '该页面暂未开放', icon: 'none' })
    }
  }

  const showSuggestions = messages.every((m) => m.role !== 'user')

  return (
    <View className={styles.page}>
      {/* 消息区 */}
      <ScrollView className={styles.chatArea} scrollY scrollIntoView={scrollId} scrollWithAnimation>
        <View className={styles.msgList}>
          {messages.map((msg) => (
            <View key={msg.id} id={`msg-${msg.id}`} className={msg.role === 'user' ? styles.rowUser : styles.rowAgent}>
              {msg.role === 'agent' && (
                <View className={styles.agentAvatar}>
                  <Icon name="sparkles" size={40} color="#ffffff" strokeWidth={1.8} />
                </View>
              )}
              <View className={msg.role === 'user' ? styles.bubbleUser : styles.bubbleAgent}>
                <Text className={msg.role === 'user' ? styles.bubbleUserText : styles.bubbleAgentText}>{msg.text}</Text>
                {!!msg.links?.length && (
                  <View className={styles.linkRow}>
                    {msg.links.map((link) => (
                      <View key={`${msg.id}-${link.to}`} className={styles.linkPill} onClick={() => handleLink(link.to)}>
                        <Text className={styles.linkText}>{link.label}</Text>
                        <Text className={styles.linkArrow}>›</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          ))}
          {typing && (
            <View id="msg-typing" className={styles.rowAgent}>
              <View className={styles.agentAvatar}>
                <Icon name="sparkles" size={40} color="#ffffff" strokeWidth={1.8} />
              </View>
              <View className={styles.bubbleAgent}>
                <Text className={styles.typingText}>正在输入…</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* 建议问题 */}
      {showSuggestions && (
        <ScrollView className={styles.suggestBar} scrollX showScrollbar={false}>
          <View className={styles.suggestRow}>
            {SUGGESTIONS.map((item) => (
              <View key={item} className={styles.suggestChip} onClick={() => send(item)}>
                <Text className={styles.suggestText}>{item}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* 输入栏 */}
      <View className={styles.inputBar}>
        <Input
          className={styles.input}
          type="text"
          value={input}
          placeholder="请输入您的问题"
          placeholderClass={styles.placeholder}
          confirmType="send"
          maxlength={200}
          onInput={(e) => setInput(e.detail.value)}
          onConfirm={() => send()}
        />
        <View
          className={classnames(styles.sendBtn, (!input.trim() || typing) && styles.sendDisabled)}
          onClick={() => send()}
        >
          <Text className={styles.sendText}>发送</Text>
        </View>
      </View>
    </View>
  )
}

export default AssistantPage
