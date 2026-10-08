<template>
  <div class="image-upload">
    <div v-if="modelValue" class="preview-wrap"><img :src="modelValue" :alt="label" /><button type="button" class="remove-image" aria-label="移除图片" @click="$emit('update:modelValue', '')">×</button></div>
    <div v-else class="empty-preview"><el-icon><Picture /></el-icon><span>尚未选择图片</span></div>
    <div class="upload-actions"><input ref="inputRef" type="file" accept="image/*" hidden @change="handlePick" /><el-button :loading="uploading" :icon="Upload" @click="inputRef?.click()">{{ modelValue ? '更换图片' : '选择图片' }}</el-button><span>支持 JPG、PNG、WebP，最大 10 MB</span></div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Picture, Upload } from '@element-plus/icons-vue'
import { uploadImage } from '../api'

defineProps<{ modelValue: string; label?: string }>()
const emit = defineEmits<{ 'update:modelValue': [url: string] }>()
const inputRef = ref<HTMLInputElement>()
const uploading = ref(false)
async function handlePick(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (!file.type.startsWith('image/')) return ElMessage.warning('请选择图片文件')
  if (file.size > 10 * 1024 * 1024) return ElMessage.warning('图片不能超过 10 MB')
  uploading.value = true
  try { emit('update:modelValue', (await uploadImage(file)).url); ElMessage.success('图片上传成功') }
  finally { uploading.value = false }
}
</script>

<style scoped>
.image-upload{display:flex;align-items:center;gap:13px;min-width:0}.preview-wrap,.empty-preview{position:relative;display:grid;width:82px;height:82px;flex:0 0 82px;place-items:center;overflow:hidden;border:1px dashed #d6deeb;border-radius:7px;color:#9aa6b5;background:#f8fafc}.preview-wrap img{width:100%;height:100%;object-fit:cover}.empty-preview{gap:5px;align-content:center;font-size:10px}.empty-preview :deep(.el-icon){font-size:19px}.remove-image{position:absolute;top:3px;right:3px;width:20px;height:20px;border:0;border-radius:50%;color:#fff;background:rgba(24,31,40,.65);font-size:15px;line-height:1;cursor:pointer}.upload-actions{display:grid;justify-items:start;gap:6px}.upload-actions span{color:#98a2b0;font-size:10px}
</style>
