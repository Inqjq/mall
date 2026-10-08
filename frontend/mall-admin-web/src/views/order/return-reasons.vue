<template>
  <div class="page-stack">
    <PageHeader title="退货原因设置" description="维护买家提交售后申请时可选的原因。"><el-button :icon="Refresh" @click="load">刷新</el-button><el-button type="primary" :icon="Plus" @click="openCreate">新增原因</el-button></PageHeader>
    <ProTable ref="tableRef" :columns="columns" :fetch="fetchPage">
      <template #status="{ row }"><el-switch :model-value="Number(row.status)" :active-value="1" :inactive-value="0" @change="(value:string|number|boolean)=>changeStatus(row,Number(value))" /></template>
      <template #action="{ row }"><el-button link type="primary" @click="openEdit(row)">编辑</el-button><el-popconfirm title="确认删除此退货原因？" @confirm="remove(row.id)"><template #reference><el-button link type="danger">删除</el-button></template></el-popconfirm></template>
    </ProTable>
    <el-dialog v-model="visible" :title="editing ? '编辑退货原因' : '新增退货原因'" width="450px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px"><el-form-item label="原因名称" prop="name"><el-input v-model="form.name" maxlength="60" show-word-limit /></el-form-item><el-form-item label="显示排序"><el-input-number v-model="form.sort" :min="0" /></el-form-item><el-form-item label="启用状态"><el-switch v-model="form.status" :active-value="1" :inactive-value="0" /></el-form-item></el-form>
      <template #footer><el-button @click="visible=false">取消</el-button><el-button type="primary" :loading="saving" @click="save">保存</el-button></template>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'; import ProTable from '@/components/ProTable/index.vue'; import type { ProTableColumn } from '@/components/ProTable/index.vue'
import { createReturnReason, deleteReturnReasons, getReturnReasons, updateReturnReason, updateReturnReasonStatus, type ReturnReason } from '@/api/business'
const tableRef=ref<{refresh:()=>void}>(); const formRef=ref<FormInstance>(); const visible=ref(false); const saving=ref(false); const editing=ref<number>()
const form=reactive({name:'',sort:0,status:1});const rules:FormRules={name:[{required:true,message:'请输入退货原因',trigger:'blur'}]}
const columns:ProTableColumn[]=[{prop:'id',label:'编号',width:80},{prop:'name',label:'原因名称',minWidth:230},{prop:'sort',label:'排序',width:100},{prop:'status',label:'启用状态',width:120,slot:true},{prop:'createTime',label:'创建时间',minWidth:170},{prop:'action',label:'操作',width:140,fixed:'right',slot:true}]
function fetchPage(params:Record<string,unknown>){return getReturnReasons(params)}
function load(){tableRef.value?.refresh()};function openCreate(){editing.value=undefined;Object.assign(form,{name:'',sort:0,status:1});visible.value=true}
function openEdit(row:ReturnReason){editing.value=row.id;Object.assign(form,{name:row.name||'',sort:row.sort??0,status:row.status??1});visible.value=true}
async function save(){if(!await formRef.value?.validate().catch(()=>false))return;saving.value=true;try{if(editing.value)await updateReturnReason(editing.value,{...form});else await createReturnReason({...form});ElMessage.success('退货原因已保存');visible.value=false;load()}finally{saving.value=false}}
async function changeStatus(row:ReturnReason,status:number){try{await ElMessageBox.confirm(`确认${status?'启用':'停用'}“${row.name}”？`,'退货原因状态',{type:'warning'});await updateReturnReasonStatus([row.id],status);ElMessage.success('状态已更新');load()}catch{load()}}
async function remove(id:number){await deleteReturnReasons([id]);ElMessage.success('已删除');load()}
</script>
