import axios from 'axios'
import { ElMessage } from 'element-plus'

const TOKEN_KEY = 'mall_merchant_token'
const TOKEN_HEAD_KEY = 'mall_merchant_token_head'
const http = axios.create({ baseURL: '/gateway', timeout: 15000 })

http.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `${localStorage.getItem(TOKEN_HEAD_KEY) || 'Bearer '}${token}`
  return config
})
http.interceptors.response.use((response) => {
  const result = response.data
  if (result.code === 200) return result.data
  if (result.code === 401) {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(TOKEN_HEAD_KEY)
    if (!location.pathname.startsWith('/login')) location.href = '/login'
  }
  ElMessage.error(result.message || '请求失败')
  return Promise.reject(new Error(result.message || '请求失败'))
}, (error) => {
  ElMessage.error(error?.response?.status ? `请求错误（${error.response.status}）` : '网络异常，请检查网关服务')
  return Promise.reject(error)
})

export interface Page<T> { total: number; list: T[]; pageNum: number; pageSize: number }
export interface Product {
  id: number; name?: string; productName?: string; title?: string; pic?: string; productPic?: string
  brandName?: string; productCategoryName?: string; price?: number; sale?: number; saleCount?: number
  stock?: number; publishStatus?: number; verifyStatus?: number; createTime?: string; brandId?: number
  productCategoryId?: number; subTitle?: string; productSn?: string; originalPrice?: number
  unit?: string; sort?: number; lowStock?: number; detailHtml?: string; skuStockList?: Sku[]
}
export interface Sku { id?: number; price?: number; stock?: number; lowStock?: number; lockStock?: number; spData?: string }
export interface Category { id: number; name: string; parentId?: number }
export interface Brand { id: number; name: string }
export interface ProductParam {
  name: string; subTitle?: string; productSn?: string; brandId: number; productCategoryId: number
  unit?: string; sort: number; price: number; originalPrice: number; stock: number; lowStock: number; pic: string
  publishStatus: number; detailHtml: string; skuStockList: Sku[]
}
export interface Order {
  id: number; orderSn?: string; createTime?: string; receiverName?: string; receiverPhone?: string
  status?: number; totalAmount?: number; payAmount?: number; deliveryCompany?: string; deliverySn?: string
}
export interface Delivery { orderId: number; deliveryCompany: string; deliverySn: string }
export interface Coupon {
  id: number; name?: string; type?: number; platform?: number; count?: number; amount?: number
  perLimit?: number; minPoint?: number; startTime?: string; endTime?: string; useType?: number
  note?: string; publishCount?: number; useCount?: number; receiveCount?: number; memberLevel?: number
}
export interface FlashCampaign { id: number; title?: string; startDate?: string; endDate?: string; status?: number; createTime?: string }
export const signIn = (username: string, password: string) => http.post('/mall-auth/auth/login', null, { params: { clientId: 'admin-app', username, password } })
export const products = (params: Record<string, unknown>) => http.get('/mall-admin/product/list', { params }) as Promise<Page<Product>>
export const publishProducts = (ids: number[], publishStatus: number) => http.post('/mall-admin/product/update/publishStatus', null, { params: { ids: ids.join(','), publishStatus } })
export const productUpdateInfo = (id: number) => http.get(`/mall-admin/product/updateInfo/${id}`) as Promise<ProductParam & { id: number; productCategoryId: number; skuStockList?: Sku[] }>
export const createProduct = (data: ProductParam) => http.post('/mall-admin/product/create', data)
export const updateProduct = (id: number, data: ProductParam) => http.post(`/mall-admin/product/update/${id}`, data)
export const categories = (parentId: number) => http.get(`/mall-admin/productCategory/list/${parentId}`, { params: { pageNum: 1, pageSize: 100 } }) as Promise<Page<Category>>
export const brands = () => http.get('/mall-admin/brand/listAll') as Promise<Brand[]>
export const uploadImage = (file: File) => {
  const body = new FormData()
  body.append('file', file)
  return http.post('/mall-admin/minio/upload', body) as Promise<{ url: string; name: string }>
}
export const orders = (params: Record<string, unknown>) => http.get('/mall-admin/order/list', { params }) as Promise<Page<Order>>
export const deliverOrders = (data: Delivery[]) => http.post('/mall-admin/order/update/delivery', data)
export const coupons = (params: Record<string, unknown>) => http.get('/mall-admin/coupon/list', { params }) as Promise<Page<Coupon>>
export const couponDetail = (id: number) => http.get(`/mall-admin/coupon/${id}`) as Promise<Coupon>
export const createCoupon = (data: Record<string, unknown>) => http.post('/mall-admin/coupon/create', data)
export const updateCoupon = (id: number, data: Record<string, unknown>) => http.post(`/mall-admin/coupon/update/${id}`, data)
export const deleteCoupon = (id: number) => http.post(`/mall-admin/coupon/delete/${id}`)
export const flashCampaigns = (params: Record<string, unknown>) => http.get('/mall-admin/flash/list', { params }) as Promise<Page<FlashCampaign>>
export const createFlashCampaign = (data: Partial<FlashCampaign>) => http.post('/mall-admin/flash/create', data)
export const updateFlashCampaign = (id: number, data: Partial<FlashCampaign>) => http.post(`/mall-admin/flash/update/${id}`, data)
export const updateFlashStatus = (id: number, status: number) => http.post(`/mall-admin/flash/update/status/${id}`, null, { params: { status } })
export const deleteFlashCampaign = (id: number) => http.post(`/mall-admin/flash/delete/${id}`)
export const orderStatus = (status?: number) => status === undefined ? '全部订单' : ({ 0: '待付款', 1: '待发货', 2: '已发货', 3: '已完成', 4: '已关闭' } as Record<number, string>)[status] || '未知状态'
export function money(value?: number) { return Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
export function dateTime(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN', { hour12: false })
}
