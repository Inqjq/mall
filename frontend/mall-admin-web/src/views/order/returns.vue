<template>
  <div class="page-stack">
    <PageHeader title="售后申请" description="审核买家提交的退货退款申请，并记录处理结果。"><el-button :icon="Refresh" :loading="loading" @click="load">刷新</el-button></PageHeader>
    <el-card shadow="never" class="return-card">
      <div class="filter-row"><el-select v-model="status" clearable placeholder="全部申请状态" @change="load"><el-option label="待处理" :value="0"/><el-option label="退货中" :value="1"/><el-option label="已完成" :value="2"/><el-option label="已拒绝" :value="3"/></el-select><el-input v-model="keyword" clearable placeholder="服务单号 / 订单编号 / 申请人" :prefix-icon="Search" @keyup.enter="load"/><el-button type="primary" :icon="Search" @click="load">查询</el-button><el-button :icon="RefreshLeft" @click="reset">重置</el-button><span class="result-count">共 {{ total }} 条申请</span></div>
      <el-table v-loading="loading" :data="rows" row-key="id">
        <el-table-column label="售后商品" min-width="275"><template #default="{row}"><div class="return-product"><el-image :src="row.productPic" fit="cover"><template #error><span class="return-image-empty">图</span></template></el-image><span><b>{{ row.productName || '商品信息缺失' }}</b><small>服务单 #{{ row.id }}</small></span></div></template></el-table-column>
        <el-table-column prop="orderSn" label="关联订单" min-width="165" show-overflow-tooltip/>
        <el-table-column label="申请人" min-width="130"><template #default="{ row }"><span>{{ row.returnName || row.memberUsername || '—' }}</span><small class="block-sub">{{ row.returnPhone || '—' }}</small></template></el-table-column>
        <el-table-column prop="returnAmount" label="申请金额" width="115" align="right"><template #default="{row}"><b class="money">¥ {{ Number(row.returnAmount||0).toFixed(2) }}</b></template></el-table-column>
        <el-table-column label="申请时间" min-width="165"><template #default="{row}">{{ formatDate(row.createTime) }}</template></el-table-column>
        <el-table-column label="状态" width="108"><template #default="{ row }"><el-tag :type="statusType(row.status)" effect="light">{{ statusName(row.status) }}</el-tag></template></el-table-column>
        <el-table-column label="操作" width="112" fixed="right"><template #default="{ row }"><el-button link type="primary" @click="openDetail(row)">查看 / 处理</el-button></template></el-table-column>
        <template #empty><el-empty description="暂无售后申请" :image-size="82"/></template>
      </el-table>
      <div class="page-footer"><el-pagination v-model:current-page="pageNum" v-model:page-size="pageSize" :total="total" :page-sizes="[10,20,50]" layout="total, sizes, prev, pager, next, jumper" @change="load"/></div>
    </el-card>
    <el-drawer v-model="detailVisible" title="售后申请详情" size="560px">
      <template v-if="detail">
        <div class="detail-state"><span>服务单 #{{ detail.id }}</span><el-tag :type="statusType(detail.status)">{{ statusName(detail.status) }}</el-tag></div>
        <el-descriptions :column="1" border class="detail-info"><el-descriptions-item label="订单编号">{{ detail.orderSn || '—' }}</el-descriptions-item><el-descriptions-item label="商品名称">{{ detail.productName || '—' }}</el-descriptions-item><el-descriptions-item label="商品规格">{{ detail.productAttr || '—' }}</el-descriptions-item><el-descriptions-item label="申请人">{{ detail.returnName || detail.memberUsername || '—' }}　{{ detail.returnPhone || '' }}</el-descriptions-item><el-descriptions-item label="申请原因">{{ detail.reason || '—' }}</el-descriptions-item><el-descriptions-item label="问题描述">{{ detail.description || '—' }}</el-descriptions-item><el-descriptions-item label="申请金额">¥ {{ Number(detail.returnAmount||0).toFixed(2) }}</el-descriptions-item></el-descriptions>
        <div v-if="detail.proofPics" class="proof-list"><span>凭证图片</span><el-image v-for="url in detail.proofPics.split(',').filter(Boolean)" :key="url" :src="url" :preview-src-list="detail.proofPics.split(',').filter(Boolean)" fit="cover"/></div>
        <el-form v-if="Number(detail.status)<2" label-position="top" class="handle-form"><el-form-item label="处理备注"><el-input v-model="handleNote" type="textarea" :rows="3" maxlength="500" show-word-limit placeholder="记录审核结论或后续处理说明"/></el-form-item><el-form-item label="确认退款金额"><el-input-number v-model="returnAmount" :min="0" :max="Number(detail.returnAmount||0)" :precision="2"/></el-form-item></el-form>
        <div v-else class="prior-note"><b>处理记录</b><p>{{ detail.handleNote || '未填写备注' }}</p><small>处理人：{{ detail.handleMan || '—' }}</small></div>
      </template>
      <template #footer><div v-if="detail && Number(detail.status)<2" class="drawer-actions"><el-button :loading="processing" @click="process(3)">拒绝申请</el-button><el-button :loading="processing" @click="process(1)">同意退货</el-button><el-button type="primary" :loading="processing" @click="process(2)">完成退款</el-button></div></template>
    </el-drawer>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, RefreshLeft, Search } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import { getReturnApplies, getReturnApply, updateReturnApply, type ReturnApply } from '@/api/business'
import { useUserStore } from '@/stores/user'
const user=useUserStore();const rows=ref<ReturnApply[]>([]);const detail=ref<ReturnApply>();const status=ref<number>();const keyword=ref('');const pageNum=ref(1);const pageSize=ref(10);const total=ref(0);const loading=ref(false);const detailVisible=ref(false);const processing=ref(false);const handleNote=ref('');const returnAmount=ref(0)
function statusName(value?:number){return ({0:'待处理',1:'退货中',2:'已完成',3:'已拒绝'} as Record<number,string>)[Number(value)]||'未知状态'}
function statusType(value?:number){return value===0?'warning':value===1?'primary':value===2?'success':'info'}
function formatDate(value?:string){if(!value)return '—';const date=new Date(value);return Number.isNaN(date.getTime())?value:date.toLocaleString('zh-CN',{hour12:false})}
async function load(){loading.value=true;try{const data=await getReturnApplies({pageNum:pageNum.value,pageSize:pageSize.value,status:status.value,receiverKeyword:keyword.value.trim()||undefined});rows.value=data.list||[];total.value=Number(data.total)||0}finally{loading.value=false}}
function reset(){keyword.value='';status.value=undefined;pageNum.value=1;load()}
async function openDetail(row:ReturnApply){detail.value=await getReturnApply(row.id);handleNote.value=detail.value.handleNote||'';returnAmount.value=Number(detail.value.returnAmount||0);detailVisible.value=true}
async function process(nextStatus:number){if(!detail.value)return;const label=nextStatus===3?'拒绝该申请':nextStatus===1?'同意退货并进入退货流程':'确认完成退款';await ElMessageBox.confirm(`将${label}？`,'售后处理确认',{type:nextStatus===3?'warning':'info'});processing.value=true;try{await updateReturnApply(detail.value.id,{id:detail.value.id,status:nextStatus,returnAmount:returnAmount.value,handleNote:handleNote.value.trim(),handleMan:user.username});ElMessage.success('售后状态已更新');detailVisible.value=false;await load()}finally{processing.value=false}}
onMounted(load)
</script>
<style scoped>
.return-card{border-color:#e4ebf5;border-radius:10px}.return-card :deep(.el-card__body){padding:16px 18px}.filter-row{display:flex;flex-wrap:wrap;align-items:center;gap:9px;margin-bottom:15px}.filter-row .el-input{width:245px}.filter-row .el-select{width:150px}.result-count{margin-left:auto;color:#8995a5;font-size:11px}.return-product{display:flex;align-items:center;gap:10px;min-width:0}.return-product :deep(.el-image){width:46px;height:46px;flex:0 0 46px;border:1px solid #edf0f4;border-radius:5px;background:#f6f8fa}.return-product>span{display:grid;min-width:0;gap:5px}.return-product b{overflow:hidden;color:#3b495c;font-size:11px;font-weight:550;text-overflow:ellipsis;white-space:nowrap}.return-product small,.block-sub{color:#929dad;font-size:10px}.return-image-empty{display:grid;width:100%;height:100%;place-items:center;color:#a4aebb}.block-sub{display:block;margin-top:4px}.money{color:#b94b28;font-size:11px}.page-footer{display:flex;justify-content:flex-end;padding-top:16px}.detail-state{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;color:#637185;font-size:11px}.detail-info :deep(.el-descriptions__label){width:110px}.proof-list{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:17px;color:#677588;font-size:11px}.proof-list>span{width:100%}.proof-list :deep(.el-image){width:68px;height:68px;border:1px solid #e5eaf0;border-radius:5px}.handle-form{margin-top:20px}.prior-note{margin-top:20px;padding:14px;border-radius:7px;background:#f6f8fb;color:#536174;font-size:11px}.prior-note p{line-height:1.7}.prior-note small{color:#909bac}.drawer-actions{display:flex;justify-content:flex-end;gap:8px}@media(max-width:720px){.filter-row .el-input{width:100%}.result-count{width:100%;margin-left:0}.page-footer{justify-content:flex-start;overflow:auto}}
</style>
