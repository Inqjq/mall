<template>
  <div class="error-page">
    <el-result icon="error" title="页面不存在" sub-title="请检查地址，或返回首页继续操作">
      <template #extra>
        <el-button type="primary" @click="$router.push('/dashboard')">返回首页</el-button>
        <el-button @click="$router.back()">返回上一页</el-button>
      </template>
    </el-result>
  </div>
</template>

<style scoped>
.error-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48vh;
  max-width: 640px;
  margin: 24px auto;
  border: 1px solid #e3e7ed;
  border-radius: 5px;
  background: #fff;
}
</style>
