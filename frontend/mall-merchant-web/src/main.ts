import { createApp } from 'vue'
import {
  ElAlert, ElButton, ElCheckbox, ElConfigProvider, ElDescriptions, ElDescriptionsItem, ElDialog,
  ElDropdown, ElDropdownItem, ElDropdownMenu, ElEmpty, ElForm, ElFormItem, ElIcon,
  ElImage, ElInput, ElInputNumber, ElLoading, ElOption, ElPagination, ElPopover, ElSelect, ElSwitch,
  ElTabPane, ElTable, ElTableColumn, ElTabs, ElTag,
} from 'element-plus'
import 'element-plus/dist/index.css'
import './styles.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(router)
for (const component of [
  ElAlert, ElButton, ElCheckbox, ElConfigProvider, ElDescriptions, ElDescriptionsItem, ElDialog,
  ElDropdown, ElDropdownItem, ElDropdownMenu, ElEmpty, ElForm, ElFormItem, ElIcon,
  ElImage, ElInput, ElInputNumber, ElOption, ElPagination, ElPopover, ElSelect, ElSwitch,
  ElTabPane, ElTable, ElTableColumn, ElTabs, ElTag,
]) app.use(component)
app.directive('loading', ElLoading.directive)
app.mount('#app')
