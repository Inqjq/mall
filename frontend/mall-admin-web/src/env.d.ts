/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// @wangeditor/editor-for-vue 的 exports 未声明 types 条件，vue-tsc 无法解析内置类型
declare module '@wangeditor/editor-for-vue' {
  import type { DefineComponent } from 'vue'
  import type { IEditorConfig } from '@wangeditor/editor'
  export const Editor: DefineComponent<{
    modelValue?: string
    defaultConfig?: Partial<IEditorConfig>
    mode?: string
    defaultHtml?: string
    defaultContent?: unknown[]
  }>
  export const Toolbar: DefineComponent<{
    editor?: unknown
    mode?: string
    defaultConfig?: Partial<IEditorConfig>
  }>
}
