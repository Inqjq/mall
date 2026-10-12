/** 后端统一返回结构 */
export interface CommonResult<T = unknown> {
  code: number
  message: string
  data: T
}

export interface CommonPage<T = unknown> {
  pageNum: number
  pageSize: number
  totalPage: number
  total: number
  list: T[]
}

export interface LoginResult {
  token: string
  tokenHead: string
}

/** 首页聚合内容 mall-portal /home/content */
export interface HomeContent {
  advertiseList: HomeAdvertise[]
  brandList: Brand[]
  homeFlashPromotion?: {
    startTime?: string
    endTime?: string
    nextStartTime?: string
    nextEndTime?: string
    productList: FlashPromotionProduct[]
  }
  newProductList: Product[]
  hotProductList: Product[]
  subjectList: Subject[]
}

export interface HomeAdvertise {
  id: number
  name: string
  pic: string
  url?: string
  type?: number
}

export interface Brand {
  id: number
  name: string
  logo?: string
  bigPic?: string
  brandStory?: string
}

export interface Product {
  id: number
  name: string
  subTitle?: string
  pic?: string
  price?: number
  originalPrice?: number
  sale?: number
  brandId?: number
  brandName?: string
  productCategoryId?: number
  productCategoryName?: string
  stock?: number
}

export interface FlashPromotionProduct extends Product {
  flashPromotionPrice?: number
  flashPromotionCount?: number
  flashPromotionLimit?: number
}

export interface Subject {
  id: number
  title: string
  pic: string
  categoryName?: string
}

export interface SkuStock {
  id: number
  skuCode?: string
  price?: number
  stock?: number
  /** JSON 字符串，如 [{"key":"颜色","value":"红"},{"key":"容量","value":"32G"}] */
  spData?: string
  pic?: string
}

/** 商品详情 mall-portal /product/detail/{id} */
export interface ProductDetail {
  product: Product & { detailHtml?: string; productSn?: string; albumPics?: string }
  brand?: Brand
  productAttributeList?: { id: number; name: string }[]
  productAttributeValueList?: { id: number; value?: string; productAttributeId?: number }[]
  skuStockList: SkuStock[]
  couponList?: unknown[]
}

/** 购物车项 OmsCartItem */
export interface CartItem {
  id: number
  productId: number
  productSkuId: number
  productName?: string
  productPic?: string
  price?: number
  quantity?: number
  productAttr?: string
  productSubTitle?: string
  productBrand?: string
  productSn?: string
}

/** 收货地址 UmsMemberReceiveAddress */
export interface MemberAddress {
  id: number
  name: string
  phoneNumber: string
  defaultStatus?: number
  postCode?: string
  province?: string
  city?: string
  region?: string
  detailAddress?: string
}

/** 订单 OmsOrder */
export interface Order {
  id: number
  orderSn?: string
  createTime?: string
  totalAmount?: number
  payAmount?: number
  freightAmount?: number
  status?: number
  payType?: number
  note?: string
  itemList?: {
    id: number
    productName?: string
    productPic?: string
    productQuantity?: number
    productPrice?: number
    productAttr?: string
  }[]
}

export interface CategoryNode {
  id: number
  name: string
  childrenList?: CategoryNode[]
}

export const ORDER_STATUS_MAP: Record<number, string> = {
  0: '待付款',
  1: '待发货',
  2: '已发货',
  3: '已完成',
  4: '已关闭',
  5: '无效订单',
}

export const ORDER_STATUS_COLOR: Record<number, string> = {
  0: '#ff7d00',
  1: '#165dff',
  2: '#0fc6c2',
  3: '#00b42a',
  4: '#86909c',
  5: '#86909c',
}
