/** 后端统一返回结构 com.qjq.mall.common.api.CommonResult */
export interface CommonResult<T = unknown> {
  code: number
  message: string
  data: T
}

/** 后端分页结构 com.qjq.mall.common.api.CommonPage */
export interface CommonPage<T = unknown> {
  pageNum: number
  pageSize: number
  totalPage: number
  total: number
  list: T[]
}

/** 登录返回 */
export interface LoginResult {
  token: string
  tokenHead: string
}

/** 商品 */
export interface PmsProduct {
  id: number
  name: string
  brandName?: string
  productCategoryName?: string
  pic?: string
  price?: number
  sale?: number
  publishStatus?: number
  verifyStatus?: number
  sort?: number
  createTime?: string
}

/** 商品分类 */
export interface PmsProductCategory {
  id: number
  name: string
  parentId?: number
  level?: number
  productCount?: number
  showStatus?: number
  navStatus?: number
  sort?: number
  productUnit?: string
  icon?: string
  keywords?: string
  description?: string
  children?: PmsProductCategory[]
}

/** 创建、更新分类使用的后端参数 */
export interface PmsProductCategoryParam {
  parentId: number
  name: string
  productUnit?: string
  navStatus: number
  showStatus: number
  sort: number
  icon?: string
  keywords?: string
  description?: string
  productAttributeIdList?: number[]
}

export interface ProductCategoryAttributeInfo {
  attributeId: number
  attributeCategoryId: number
}

/** 品牌 */
export interface PmsBrand {
  id: number
  name: string
  logo?: string
  bigPic?: string
  brandStory?: string
  factoryStatus?: number
  showStatus?: number
  productCount?: number
  productCommentCount?: string
}

/** 订单 */
export interface OmsOrder {
  id: number
  orderSn?: string
  createTime?: string
  /** 会员用户名（对齐后端 memberUsername） */
  memberUsername?: string
  receiverName?: string
  receiverPhone?: string
  receiverProvince?: string
  receiverCity?: string
  receiverRegion?: string
  receiverDetailAddress?: string
  status?: number
  totalAmount?: number
  payAmount?: number
  freightAmount?: number
  promotionAmount?: number
  couponAmount?: number
  payType?: number
  paymentTime?: string
  deliveryTime?: string
  deliveryCompany?: string
  deliverySn?: string
  note?: string
  deleteStatus?: number
}

/** 订单商品明细 */
export interface OmsOrderItem {
  id: number
  productPic?: string
  productName?: string
  productPrice?: number
  productQuantity?: number
  /** 商品销售属性，JSON 字符串 */
  productAttr?: string
  productSkuId?: number
  realAmount?: number
}

/** 订单操作记录 */
export interface OmsOrderOperateHistory {
  id: number
  operateMan?: string
  createTime?: string
  /** 操作状态：同订单状态枚举 */
  orderStatus?: number
  note?: string
}

/** 订单详情（对齐后端 com.qjq.mall.dto.OmsOrderDetail） */
export interface OmsOrderDetail extends OmsOrder {
  orderItemList?: OmsOrderItem[]
  historyList?: OmsOrderOperateHistory[]
}

/** 订单发货参数（对齐后端 com.qjq.mall.dto.OmsOrderDeliveryParam） */
export interface OmsOrderDeliveryParam {
  orderId: number
  deliveryCompany?: string
  deliverySn: string
}

/** 商品 SKU 库存（对齐后端 PmsSkuStock） */
export interface PmsSkuStock {
  id?: number
  skuCode?: string
  price?: number
  stock?: number
  lowStock?: number
  pic?: string
  sale?: number
  lockStock?: number
  /** 商品销售属性，JSON 数组字符串，如 [{"key":"颜色","value":"红"}] */
  spData?: string
}

/** 商品规格/参数属性（对齐后端 PmsProductAttribute） */
export interface PmsProductAttribute {
  id: number
  name?: string
  productAttributeCategoryId?: number
  /** 输入方式：0->手工输入；1->单选；2->多选（可选值来自 inputList） */
  inputType?: number
  /** 可选值列表，逗号分隔 */
  inputList?: string
  sort?: number
  selectType?: number
  filterType?: number
  searchType?: number
  relatedStatus?: number
  /** 是否支持手动新增：0->否；1->是 */
  handAddStatus?: number
  /** 0->规格；1->参数 */
  type?: number
}

/** 商品属性值（提交用，对齐后端 PmsProductAttributeValue） */
export interface PmsProductAttributeValue {
  productAttributeId: number
  value: string
}

/** 商品创建/编辑参数（对齐后端 com.qjq.mall.dto.PmsProductParam，仅含本页用到的字段） */
export interface PmsProductParam {
  brandId?: number
  productCategoryId?: number
  pic?: string
  name?: string
  subTitle?: string
  productSn?: string
  unit?: string
  sort?: number
  price?: number
  originalPrice?: number
  stock?: number
  lowStock?: number
  publishStatus?: number
  detailHtml?: string
  skuStockList?: PmsSkuStock[]
  productAttributeValueList?: PmsProductAttributeValue[]
}

/** 商品编辑回显结果（对齐后端 com.qjq.mall.dto.PmsProductResult） */
export interface PmsProductResult extends PmsProductParam {
  id: number
  /** 商品所选分类的父 id */
  cateParentId?: number
}

/** 后台用户 */
export interface UmsAdmin {
  id: number
  username: string
  icon?: string
  email?: string
  nickName?: string
  note?: string
  status?: number
  createTime?: string
}

/** 后台菜单（后端返回扁平列表，前端组树） */
export interface UmsMenu {
  id: number
  parentId: number
  title: string
  level: number
  sort: number
  /** 前端菜单标识，如 product / productCate / brand / order / admin / addProduct */
  name: string
  icon: string
  hidden: number
}

/** 当前登录信息 */
export interface AdminInfo {
  username: string
  icon?: string
  menus: UmsMenu[]
  roles: string[]
}

/** ES 商品 */
export interface EsProduct {
  id: number
  name: string
  subTitle?: string
  pic?: string
  price?: number
  sale?: number
  saleCount?: number
  brandId?: number
  brandName?: string
  brandLogo?: string
  productCategoryId?: number
  productCategoryName?: string
}

export const ORDER_STATUS_MAP: Record<number, string> = {
  0: '待付款',
  1: '待发货',
  2: '已发货',
  3: '已完成',
  4: '已关闭',
  5: '无效订单',
}

export const PAY_TYPE_MAP: Record<number, string> = {
  0: '未支付',
  1: '支付宝',
  2: '微信',
}
