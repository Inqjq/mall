<template>
  <div class="page-stack">
    <PageHeader title="角色管理" description="按岗位划分后台操作权限，控制菜单可见范围。"><el-button :icon="Refresh" :loading="loading" @click="load">刷新</el-button><el-button type="primary" :icon="Plus" @click="openCreate">新增角色</el-button></PageHeader>
    <el-card shadow="never" class="roles-card">
      <div class="roles-summary"><span class="summary-mark"><el-icon><UserFilled/></el-icon></span><div><b>后台角色</b><small>角色状态会影响账号登录与授权结果</small></div><strong>{{ total }}<small> 个角色</small></strong></div>
      <div class="role-toolbar"><el-input v-model="keyword" clearable placeholder="搜索角色名称" :prefix-icon="Search" @keyup.enter="load"/><el-button type="primary" :icon="Search" @click="load">查询</el-button><el-button :icon="RefreshLeft" @click="reset">重置</el-button></div>
      <el-table v-loading="loading" :data="rows" row-key="id">
        <el-table-column label="角色名称" min-width="200"><template #default="{ row }"><div class="role-name"><span class="role-icon"><el-icon><User/></el-icon></span><span><b>{{ row.name }}</b><small>角色编号 {{ row.id }}</small></span></div></template></el-table-column>
        <el-table-column prop="description" label="说明" min-width="220" show-overflow-tooltip/>
        <el-table-column prop="adminCount" label="关联账号" width="115" align="center"/>
        <el-table-column prop="sort" label="排序" width="85" align="center"/>
        <el-table-column label="状态" width="120"><template #default="{ row }"><el-switch :model-value="Number(row.status)" :active-value="1" :inactive-value="0" @change="(value:string|number|boolean)=>changeStatus(row,Number(value))"/></template></el-table-column>
        <el-table-column label="操作" width="150" fixed="right"><template #default="{ row }"><el-button link type="primary" @click="openEdit(row)">编辑</el-button><el-popconfirm :disabled="Number(row.adminCount)>0" :title="Number(row.adminCount)>0?'仍有关联账号，不能删除':'确认删除这个角色？'" @confirm="remove(row.id)"><template #reference><el-button link type="danger" :disabled="Number(row.adminCount)>0">删除</el-button></template></el-popconfirm></template></el-table-column>
        <template #empty><el-empty description="暂无角色" :image-size="80"><el-button type="primary" @click="openCreate">创建第一个角色</el-button></el-empty></template>
      </el-table>
      <div class="page-footer"><el-pagination v-model:current-page="pageNum" v-model:page-size="pageSize" :total="total" :page-sizes="[10,20,50]" layout="total, sizes, prev, pager, next, jumper" @change="load"/></div>
    </el-card>
    <el-dialog v-model="visible" :title="editing?'编辑角色':'新增角色'" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="95px"><el-form-item label="角色名称" prop="name"><el-input v-model="form.name" maxlength="50" show-word-limit/></el-form-item><el-form-item label="角色说明"><el-input v-model="form.description" type="textarea" :rows="3" maxlength="200" show-word-limit/></el-form-item><el-form-item label="显示排序"><el-input-number v-model="form.sort" :min="0"/></el-form-item><el-form-item label="状态"><el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="禁用"/></el-form-item></el-form>
      <template #footer><el-button @click="visible=false">取消</el-button><el-button type="primary" :loading="saving" @click="save">保存角色</el-button></template>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Refresh, RefreshLeft, Search, User, UserFilled } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import { createRole, deleteRoles, getRoles, updateRole, updateRoleStatus, type Role } from '@/api/business'
const rows=ref<Role[]>([]);const total=ref(0);const pageNum=ref(1);const pageSize=ref(10);const keyword=ref('');const loading=ref(false);const visible=ref(false);const saving=ref(false);const editing=ref<number>();const formRef=ref<FormInstance>();const form=reactive({name:'',description:'',sort:0,status:1});const rules:FormRules={name:[{required:true,message:'请输入角色名称',trigger:'blur'}]}
async function load(){loading.value=true;try{const page=await getRoles({pageNum:pageNum.value,pageSize:pageSize.value,keyword:keyword.value.trim()||undefined});rows.value=page.list||[];total.value=Number(page.total)||0}finally{loading.value=false}}
function reset(){keyword.value='';pageNum.value=1;load()};function openCreate(){editing.value=undefined;Object.assign(form,{name:'',description:'',sort:0,status:1});visible.value=true}
function openEdit(row:Role){editing.value=row.id;Object.assign(form,{name:row.name||'',description:row.description||'',sort:row.sort??0,status:row.status??0});visible.value=true}
async function save(){if(!await formRef.value?.validate().catch(()=>false))return;saving.value=true;try{if(editing.value)await updateRole(editing.value,{...form});else await createRole({...form});ElMessage.success('角色已保存');visible.value=false;await load()}finally{saving.value=false}}
async function changeStatus(row:Role,status:number){try{await ElMessageBox.confirm(`确认${status?'启用':'禁用'}“${row.name}”？`,'角色状态',{type:'warning'});await updateRoleStatus(row.id,status);ElMessage.success('角色状态已更新');await load()}catch{await load()}}
async function remove(id:number){await deleteRoles([id]);ElMessage.success('角色已删除');await load()}
onMounted(load)
</script>
<style scoped>
.roles-card{border-color:#e4ebf5;border-radius:10px}.roles-card :deep(.el-card__body){padding:17px 18px}.roles-summary{display:flex;align-items:center;gap:12px;padding:4px 1px 16px;border-bottom:1px solid #edf0f4}.summary-mark{display:grid;width:39px;height:39px;place-items:center;border-radius:9px;color:#3c65dc;background:#edf2ff;font-size:18px}.roles-summary>div{display:grid;flex:1;gap:5px}.roles-summary b{color:#39485c;font-size:12px}.roles-summary small{color:#929dad;font-size:10px}.roles-summary>strong{color:#3c4e68;font-size:21px}.roles-summary>strong small{font-weight:400}.role-toolbar{display:flex;gap:9px;margin:14px 0}.role-toolbar .el-input{width:260px}.role-name{display:flex;align-items:center;gap:10px}.role-icon{display:grid;width:33px;height:33px;place-items:center;border-radius:8px;color:#627aa7;background:#eef3fb}.role-name>span:last-child{display:grid;gap:4px}.role-name b{color:#3e4d61;font-size:11px}.role-name small{color:#96a0af;font-size:9px}.page-footer{display:flex;justify-content:flex-end;padding-top:16px}@media(max-width:600px){.role-toolbar{flex-wrap:wrap}.role-toolbar .el-input{width:100%}.page-footer{justify-content:flex-start;overflow:auto}}
</style>
