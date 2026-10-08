import { request } from '@/utils/request'
import type {
  CommonPage,
  PmsBrand,
  PmsProduct,
  PmsProductAttribute,
  PmsProductCategory,
  PmsProductCategoryParam,
  PmsProductParam,
  PmsProductResult,
  ProductCategoryAttributeInfo,
} from '@/types/api'

/** 商品分页列表 */
export function getProductList(params: { pageNum: number; pageSize: number; keyword?: string }): Promise<CommonPage<PmsProduct>> {
  return request<CommonPage<PmsProduct>>({ url: '/mall-admin/product/list', method: 'get', params })
}

/** 商品上下架 */
export function updateProductPublishStatus(ids: number[], publishStatus: number) {
  return request({ url: '/mall-admin/product/update/publishStatus', method: 'post', params: { ids: ids.join(','), publishStatus } })
}

/** 一级商品分类列表（parentId=0） */
export function getCategoryList(parentId: number, params: { pageNum: number; pageSize: number }): Promise<CommonPage<PmsProductCategory>> {
  return request<CommonPage<PmsProductCategory>>({ url: `/mall-admin/productCategory/list/${parentId}`, method: 'get', params })
}

/** 分类层级树 */
export function getCategoryTree(): Promise<PmsProductCategory[]> {
  return request<PmsProductCategory[]>({ url: '/mall-admin/productCategory/list/withChildren', method: 'get' })
}

/** 分类关联的筛选属性（编辑时保留现有关联） */
export function getProductCategoryAttributeInfo(id: number): Promise<ProductCategoryAttributeInfo[]> {
  return request<ProductCategoryAttributeInfo[]>({ url: `/mall-admin/productAttribute/attrInfo/${id}`, method: 'get' })
}

export function createCategory(data: PmsProductCategoryParam) {
  return request({ url: '/mall-admin/productCategory/create', method: 'post', data })
}

export function updateCategory(id: number, data: PmsProductCategoryParam) {
  return request({ url: `/mall-admin/productCategory/update/${id}`, method: 'post', data })
}

export function deleteCategory(id: number) {
  return request({ url: `/mall-admin/productCategory/delete/${id}`, method: 'post' })
}

export function updateCategoryNavStatus(ids: number[], navStatus: number) {
  return request({ url: '/mall-admin/productCategory/update/navStatus', method: 'post', params: { ids: ids.join(','), navStatus } })
}

export function updateCategoryShowStatus(ids: number[], showStatus: number) {
  return request({ url: '/mall-admin/productCategory/update/showStatus', method: 'post', params: { ids: ids.join(','), showStatus } })
}

/** 品牌分页列表 */
export function getBrandList(params: { pageNum: number; pageSize: number; keyword?: string }): Promise<CommonPage<PmsBrand>> {
  return request<CommonPage<PmsBrand>>({ url: '/mall-admin/brand/list', method: 'get', params })
}

/** 删除品牌（后端定义为 GET） */
export function deleteBrand(id: number) {
  return request({ url: `/mall-admin/brand/delete/${id}`, method: 'get' })
}

export interface PmsBrandParam {
  name: string
  firstLetter?: string
  sort?: number
  factoryStatus: number
  showStatus: number
  logo: string
  bigPic?: string
  brandStory?: string
}

export function createBrand(data: PmsBrandParam) {
  return request({ url: '/mall-admin/brand/create', method: 'post', data })
}

export function updateBrand(id: number, data: PmsBrandParam) {
  return request({ url: `/mall-admin/brand/update/${id}`, method: 'post', data })
}

export function updateBrandShowStatus(ids: number[], showStatus: number) {
  return request({ url: '/mall-admin/brand/update/showStatus', method: 'post', params: { ids: ids.join(','), showStatus } })
}

export interface PmsAttributeCategory { id: number; name: string; attributeCount?: number; paramCount?: number; productAttributeList?: PmsProductAttribute[] }
export interface PmsProductAttributeParam {
  productAttributeCategoryId: number; name: string; selectType: number; inputType: number; inputList?: string
  sort: number; filterType: number; searchType: number; relatedStatus: number; handAddStatus: number; type: number
}
export function getAttributeCategories(): Promise<PmsAttributeCategory[]> {
  return request<PmsAttributeCategory[]>({ url: '/mall-admin/productAttribute/category/list/withAttr', method: 'get' })
}
export function createAttributeCategory(name: string) {
  return request({ url: '/mall-admin/productAttribute/category/create', method: 'post', params: { name } })
}
export function updateAttributeCategory(id: number, name: string) {
  return request({ url: `/mall-admin/productAttribute/category/update/${id}`, method: 'post', params: { name } })
}
export function deleteAttributeCategory(id: number) {
  return request({ url: `/mall-admin/productAttribute/category/delete/${id}`, method: 'get' })
}
export function createAttribute(data: PmsProductAttributeParam) {
  return request({ url: '/mall-admin/productAttribute/create', method: 'post', data })
}
export function updateAttribute(id: number, data: PmsProductAttributeParam) {
  return request({ url: `/mall-admin/productAttribute/update/${id}`, method: 'post', data })
}
export function deleteAttributes(ids: number[]) {
  return request({ url: '/mall-admin/productAttribute/delete', method: 'post', params: { ids: ids.join(',') } })
}

/** 商品编辑信息回显（GET /mall-admin/product/updateInfo/{id}） */
export function getProductUpdateInfo(id: number): Promise<PmsProductResult> {
  return request<PmsProductResult>({ url: `/mall-admin/product/updateInfo/${id}`, method: 'get' })
}

/** 创建商品（POST /mall-admin/product/create） */
export function createProduct(data: PmsProductParam) {
  return request({ url: '/mall-admin/product/create', method: 'post', data })
}

/** 更新商品（POST /mall-admin/product/update/{id}） */
export function updateProduct(id: number, data: PmsProductParam) {
  return request({ url: `/mall-admin/product/update/${id}`, method: 'post', data })
}

/** 根据分类查询属性列表（type: 0->规格；1->参数） */
export function getAttributeList(
  cid: number,
  type: number,
  params: { pageNum: number; pageSize: number },
): Promise<CommonPage<PmsProductAttribute>> {
  return request<CommonPage<PmsProductAttribute>>({
    url: `/mall-admin/productAttribute/list/${cid}`,
    method: 'get',
    params: { ...params, type },
  })
}
