<template>
  <div class="page-stack">
    <PageHeader :title="title" :description="description"><el-button :icon="Refresh" :loading="loading" @click="load">刷新</el-button><el-button type="primary" :icon="Plus" @click="openCreate">{{ createLabel }}</el-button></PageHeader>
    <section class="marketing-overview"><div class="overview-mark"><el-icon><component :is="modeIcon" /></el-icon></div><div><b>{{ title }}管理</b><p>{{ overviewText }}</p></div><span class="overview-count">{{ total.toLocaleString() }}<small>条记录</small></span></section>
    <el-card shadow="never" class="marketing-card">
      <div v-if="mode === 'coupon'" class="filter-row"><el-input v-model="keyword" clearable placeholder="搜索优惠券名称" :prefix-icon="Search" @keyup.enter="load"/><el-select v-model="couponType" clearable placeholder="全部类型" @change="load"><el-option label="全场赠券" :value="0"/><el-option label="会员赠券" :value="1"/><el-option label="购物赠券" :value="2"/><el-option label="注册赠券" :value="3"/></el-select><el-button type="primary" :icon="Search" @click="load">查询</el-button><el-button :icon="RefreshLeft" @click="reset">重置</el-button></div>
      <div v-else-if="mode === 'flash'" class="filter-row"><el-input v-model="keyword" clearable placeholder="搜索活动名称" :prefix-icon="Search" @keyup.enter="load"/><el-button type="primary" :icon="Search" @click="load">查询活动</el-button><el-button :icon="RefreshLeft" @click="reset">重置</el-button></div>
      <el-table v-loading="loading" :data="rows" row-key="id">
        <template v-if="mode === 'coupon'">
          <el-table-column label="优惠券" min-width="210"><template #default="{row}"><div class="primary-cell"><b>{{ row.name || '未命名优惠券' }}</b><small>编号 {{ row.id }} · {{ couponTypeName(row.type) }}</small></div></template></el-table-column>
          <el-table-column label="优惠力度" width="145"><template #default="{row}"><strong class="amount">¥{{ Number(row.amount||0).toFixed(2) }}</strong><small class="block-sub">{{ Number(row.minPoint||0) ? `满 ¥${Number(row.minPoint).toFixed(2)} 可用` : '无使用门槛' }}</small></template></el-table-column>
          <el-table-column label="领取 / 使用" width="135"><template #default="{row}">{{ Number(row.receiveCount||0).toLocaleString() }} / {{ Number(row.useCount||0).toLocaleString() }}</template></el-table-column>
          <el-table-column label="有效期" min-width="200"><template #default="{row}">{{ date(row.startTime) }} 至 {{ date(row.endTime) }}</template></el-table-column>
          <el-table-column label="发行量" width="110" align="right"><template #default="{row}">{{ Number(row.count||0).toLocaleString() }}</template></el-table-column>
          <el-table-column label="操作" width="100" fixed="right"><template #default="{row}"><el-popconfirm title="确认删除这张优惠券？" @confirm="remove(row.id)"><template #reference><el-button link type="danger">删除</el-button></template></el-popconfirm></template></el-table-column>
        </template>
        <template v-else-if="mode === 'flash'">
          <el-table-column label="活动名称" min-width="240"><template #default="{row}"><div class="primary-cell"><b>{{ row.title || '未命名活动' }}</b><small>活动编号 {{ row.id }}</small></div></template></el-table-column>
          <el-table-column label="活动周期" min-width="240"><template #default="{row}">{{ date(row.startDate) }} 至 {{ date(row.endDate) }}</template></el-table-column>
          <el-table-column label="活动状态" width="130"><template #default="{row}"><el-switch :model-value="Number(row.status)" :active-value="1" :inactive-value="0" @change="(value:string|number|boolean)=>changeStatus(row,Number(value))"/><span class="switch-label">{{ Number(row.status)===1?'进行中':'已停用' }}</span></template></el-table-column>
          <el-table-column label="操作" width="100" fixed="right"><template #default="{row}"><el-popconfirm title="删除活动后将无法恢复，确认继续？" @confirm="remove(row.id)"><template #reference><el-button link type="danger">删除</el-button></template></el-popconfirm></template></el-table-column>
        </template>
        <template v-else>
          <el-table-column label="广告内容" min-width="260"><template #default="{row}"><div class="advert-cell"><el-image :src="row.pic" fit="cover"><template #error><span class="advert-placeholder">图片</span></template></el-image><div class="primary-cell"><b>{{ row.name || '未命名广告' }}</b><small>{{ Number(row.type)===0?'PC 首页轮播':'移动端首页轮播' }}</small></div></div></template></el-table-column>
          <el-table-column label="展示时间" min-width="225"><template #default="{row}">{{ date(row.startTime) }} 至 {{ date(row.endTime) }}</template></el-table-column>
          <el-table-column label="点击 / 下单" width="125"><template #default="{row}">{{ Number(row.clickCount||0).toLocaleString() }} / {{ Number(row.orderCount||0).toLocaleString() }}</template></el-table-column>
          <el-table-column label="状态" width="130"><template #default="{row}"><el-switch :model-value="Number(row.status)" :active-value="1" :inactive-value="0" @change="(value:string|number|boolean)=>changeStatus(row,Number(value))"/><span class="switch-label">{{ Number(row.status)===1?'已上线':'已下线' }}</span></template></el-table-column>
          <el-table-column label="操作" width="100" fixed="right"><template #default="{row}"><el-popconfirm title="确认删除此广告？" @confirm="remove(row.id)"><template #reference><el-button link type="danger">删除</el-button></template></el-popconfirm></template></el-table-column>
        </template>
        <template #empty><el-empty :description="`暂无${title}记录`" :image-size="82"><el-button type="primary" @click="openCreate">{{ createLabel }}</el-button></el-empty></template>
      </el-table>
      <div class="page-footer"><el-pagination v-model:current-page="pageNum" v-model:page-size="pageSize" :total="total" :page-sizes="[10,20,50]" layout="total, sizes, prev, pager, next, jumper" @change="load"/></div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="createLabel" width="600px" destroy-on-close>
      <el-form v-if="mode==='coupon'" ref="formRef" :model="couponForm" :rules="rules" label-width="110px">
        <el-form-item label="优惠券名称" prop="name"><el-input v-model="couponForm.name" maxlength="60"/></el-form-item>
        <el-form-item label="发放类型"><el-select v-model="couponForm.type"><el-option label="全场赠券" :value="0"/><el-option label="会员赠券" :value="1"/><el-option label="购物赠券" :value="2"/><el-option label="注册赠券" :value="3"/></el-select></el-form-item>
        <el-form-item label="优惠金额"><el-input-number v-model="couponForm.amount" :min="0.01" :precision="2"/></el-form-item>
        <el-form-item label="使用门槛"><el-input-number v-model="couponForm.minPoint" :min="0" :precision="2"/></el-form-item>
        <el-form-item label="发行数量"><el-input-number v-model="couponForm.count" :min="1" :precision="0"/></el-form-item>
        <el-form-item label="每人限领"><el-input-number v-model="couponForm.perLimit" :min="1" :precision="0"/></el-form-item>
        <el-form-item label="有效期"><el-date-picker v-model="couponPeriod" type="datetimerange" value-format="YYYY-MM-DD HH:mm:ss" start-placeholder="开始时间" end-placeholder="结束时间"/></el-form-item>
        <el-form-item label="备注"><el-input v-model="couponForm.note" maxlength="200"/></el-form-item>
      </el-form>
      <el-form v-else-if="mode==='flash'" ref="formRef" :model="flashForm" :rules="rules" label-width="110px">
        <el-form-item label="活动名称" prop="title"><el-input v-model="flashForm.title" maxlength="60"/></el-form-item>
        <el-form-item label="活动周期"><el-date-picker v-model="flashPeriod" type="daterange" value-format="YYYY-MM-DD" start-placeholder="开始日期" end-placeholder="结束日期"/></el-form-item>
        <el-form-item label="活动状态"><el-switch v-model="flashForm.status" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="停用"/></el-form-item>
      </el-form>
      <el-form v-else ref="formRef" :model="advertForm" :rules="rules" label-width="110px">
        <el-form-item label="广告名称" prop="name"><el-input v-model="advertForm.name" maxlength="80"/></el-form-item>
        <el-form-item label="轮播位置"><el-radio-group v-model="advertForm.type"><el-radio :value="0">PC 首页</el-radio><el-radio :value="1">移动首页</el-radio></el-radio-group></el-form-item>
        <el-form-item label="广告图片" prop="pic"><ImageUpload v-model="advertForm.pic" label="广告图片"/></el-form-item>
        <el-form-item label="跳转链接"><el-input v-model="advertForm.url" placeholder="可选，点击广告后打开"/></el-form-item>
        <el-form-item label="展示时间"><el-date-picker v-model="advertPeriod" type="datetimerange" value-format="YYYY-MM-DD HH:mm:ss" start-placeholder="开始时间" end-placeholder="结束时间"/></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="advertForm.sort" :min="0"/></el-form-item>
        <el-form-item label="状态"><el-switch v-model="advertForm.status" :active-value="1" :inactive-value="0" active-text="上线" inactive-text="下线"/></el-form-item>
      </el-form>
      <template #footer><el-button @click="dialogVisible=false">取消</el-button><el-button type="primary" :loading="saving" @click="submit">保存</el-button></template>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Calendar, DataAnalysis, Discount, Plus, Promotion, Refresh, RefreshLeft, Search } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue';import ImageUpload from '@/components/ImageUpload.vue'
import { createCoupon, createFlashCampaign, createHomeAdvertise, deleteCoupon, deleteFlashCampaign, deleteHomeAdvertises, getCoupons, getFlashCampaigns, getHomeAdvertises, updateFlashStatus, updateHomeAdvertiseStatus, type Coupon, type FlashCampaign, type HomeAdvertise } from '@/api/business'
const route=useRoute();const mode=computed(()=>route.path.endsWith('/coupon')?'coupon':route.path.endsWith('/flash')?'flash':'advertise');const title=computed(()=>mode.value==='coupon'?'优惠券':mode.value==='flash'?'秒杀活动':'首页广告');const description=computed(()=>mode.value==='coupon'?'管理商城优惠券、发放门槛与有效期。':mode.value==='flash'?'管理限时购活动周期及活动状态。':'维护商城首页轮播素材与展示时间。');const createLabel=computed(()=>mode.value==='coupon'?'创建优惠券':mode.value==='flash'?'创建秒杀活动':'新增首页广告');const modeIcon=computed(()=>mode.value==='coupon'?Discount:mode.value==='flash'?Calendar:Promotion);const overviewText=computed(()=>mode.value==='coupon'?'设置优惠金额、领取规则与有效期，管理发放记录。':mode.value==='flash'?'安排限时促销档期，并控制活动上下线。':'上传首页轮播图片，设置展示端、跳转地址和档期。')
const rows=ref<(Coupon|FlashCampaign|HomeAdvertise)[]>([]);const total=ref(0);const loading=ref(false);const saving=ref(false);const dialogVisible=ref(false);const formRef=ref<FormInstance>();const pageNum=ref(1);const pageSize=ref(10);const keyword=ref('');const couponType=ref<number>();const couponPeriod=ref<string[]>([]);const flashPeriod=ref<string[]>([]);const advertPeriod=ref<string[]>([])
const couponForm=reactive({name:'',type:0,platform:0,count:100,amount:10,perLimit:1,minPoint:0,useType:0,note:'',publishCount:0,useCount:0,receiveCount:0});const flashForm=reactive({title:'',startDate:'',endDate:'',status:1});const advertForm=reactive({name:'',type:0,pic:'',url:'',startTime:'',endTime:'',status:0,sort:0,note:''});const rules:FormRules={name:[{required:true,message:'请输入名称',trigger:'blur'}],title:[{required:true,message:'请输入活动名称',trigger:'blur'}],pic:[{required:true,message:'请上传广告图片',trigger:'change'}]}
function date(value?:string){if(!value)return '—';const d=new Date(value);return Number.isNaN(d.getTime())?value:d.toLocaleDateString('zh-CN')}
function couponTypeName(type?:number){return (['全场赠券','会员赠券','购物赠券','注册赠券'] as string[])[Number(type)]||'优惠券'}
async function load(){loading.value=true;try{const params={pageNum:pageNum.value,pageSize:pageSize.value};const data=mode.value==='coupon'?await getCoupons({...params,name:keyword.value.trim()||undefined,type:couponType.value}):mode.value==='flash'?await getFlashCampaigns({...params,keyword:keyword.value.trim()||undefined}):await getHomeAdvertises(params);rows.value=data.list||[];total.value=Number(data.total)||0}finally{loading.value=false}}
function reset(){keyword.value='';couponType.value=undefined;pageNum.value=1;load()}
function openCreate(){Object.assign(couponForm,{name:'',type:0,platform:0,count:100,amount:10,perLimit:1,minPoint:0,useType:0,note:'',publishCount:0,useCount:0,receiveCount:0});Object.assign(flashForm,{title:'',startDate:'',endDate:'',status:1});Object.assign(advertForm,{name:'',type:0,pic:'',url:'',startTime:'',endTime:'',status:0,sort:0,note:''});couponPeriod.value=[];flashPeriod.value=[];advertPeriod.value=[];dialogVisible.value=true}
async function submit(){if(!await formRef.value?.validate().catch(()=>false))return;saving.value=true;try{if(mode.value==='coupon'){Object.assign(couponForm,{startTime:couponPeriod.value[0],endTime:couponPeriod.value[1]});await createCoupon({...couponForm})}else if(mode.value==='flash'){Object.assign(flashForm,{startDate:flashPeriod.value[0],endDate:flashPeriod.value[1]});await createFlashCampaign({...flashForm})}else{Object.assign(advertForm,{startTime:advertPeriod.value[0],endTime:advertPeriod.value[1]});await createHomeAdvertise({...advertForm})}ElMessage.success('已创建');dialogVisible.value=false;await load()}finally{saving.value=false}}
async function remove(id:number){if(mode.value==='coupon')await deleteCoupon(id);else if(mode.value==='flash')await deleteFlashCampaign(id);else await deleteHomeAdvertises([id]);ElMessage.success('已删除');await load()}
async function changeStatus(row:Coupon|FlashCampaign|HomeAdvertise,status:number){if(mode.value==='flash')await updateFlashStatus(row.id,status);else await updateHomeAdvertiseStatus(row.id,status);ElMessage.success('状态已更新');await load()}
watch(mode,()=>{pageNum.value=1;rows.value=[];load()});onMounted(load)
</script>
<style scoped>
.marketing-overview{display:flex;align-items:center;gap:14px;padding:17px 20px;border:1px solid #e3eaf4;border-radius:10px;background:linear-gradient(105deg,#fff 0%,#f5f8fd 100%)}.overview-mark{display:grid;width:42px;height:42px;flex:0 0 42px;place-items:center;border-radius:10px;color:#486bd7;background:#eaf0ff;font-size:20px}.marketing-overview>div:nth-child(2){flex:1}.marketing-overview b{color:#334156;font-size:13px}.marketing-overview p{margin:5px 0 0;color:#929dad;font-size:10px}.overview-count{display:grid;justify-items:end;color:#3b4c65;font-size:20px;font-weight:650}.overview-count small{color:#96a1b0;font-size:9px;font-weight:400}.marketing-card{border-color:#e4ebf5;border-radius:10px}.marketing-card :deep(.el-card__body){padding:16px 18px}.filter-row{display:flex;gap:9px;align-items:center;margin-bottom:14px}.filter-row .el-input{width:245px}.filter-row .el-select{width:150px}.primary-cell{display:grid;gap:5px}.primary-cell b{color:#3b495c;font-size:11px;font-weight:600}.primary-cell small,.block-sub{color:#929dad;font-size:10px}.block-sub{display:block;margin-top:4px}.amount{color:#b94b28;font-size:12px}.switch-label{margin-left:8px;color:#788598;font-size:10px}.advert-cell{display:flex;align-items:center;gap:11px}.advert-cell :deep(.el-image){width:76px;height:44px;flex:0 0 76px;border:1px solid #e6ebf1;border-radius:4px}.advert-placeholder{display:grid;width:100%;height:100%;place-items:center;color:#a1abba;font-size:10px}.page-footer{display:flex;justify-content:flex-end;padding-top:16px}.marketing-card :deep(.el-dialog .el-form-item){margin-bottom:16px}@media(max-width:650px){.filter-row{flex-wrap:wrap}.filter-row .el-input{width:100%}.page-footer{justify-content:flex-start;overflow:auto}.marketing-card :deep(.el-card__body){padding:12px}}
</style>
