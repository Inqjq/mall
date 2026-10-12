import dayjs from 'dayjs'
import type { CommonPage, Product, ProductDetail, SkuStock } from '@/types/api'
import { assetImage } from '@/utils/visual'

/** 演示商品数据（后端不可达时的降级数据源，pic 为空时渲染矢量占位卡） */
const RAW_MOCK_PRODUCTS: Product[] = [
  { id: 101, name: '小米14 Ultra 5G智能手机 骁龙8Gen3 徕卡光学镜头', subTitle: '2K超视感屏 · 90W秒充 · 16GB+512GB', pic: '', price: 5999, originalPrice: 6499, sale: 1823, brandId: 1, brandName: '小米', productCategoryId: 21, stock: 88 },
  { id: 102, name: '华为 FreeBuds Pro 3 真无线降噪耳机', subTitle: '智慧动态降噪 · 星闪连接 · 40小时续航', pic: '', price: 1199, originalPrice: 1499, sale: 3567, brandId: 2, brandName: '华为', productCategoryId: 22, stock: 156 },
  { id: 103, name: 'Apple MacBook Air 13英寸 M3芯片笔记本电脑', subTitle: '轻至1.24kg · 18小时超长续航', pic: '', price: 8999, originalPrice: 9499, sale: 892, brandId: 3, brandName: 'Apple', productCategoryId: 23, stock: 35 },
  { id: 104, name: '索尼 WH-1000XM5 头戴式无线降噪耳机', subTitle: '行业标杆降噪 · 30小时续航', pic: '', price: 2399, originalPrice: 2899, sale: 1204, brandId: 4, brandName: '索尼', productCategoryId: 22, stock: 64 },
  { id: 105, name: '优衣库 男装 圆领针织毛衣 秋冬保暖打底', subTitle: '羊毛混纺 · 多色可选 · 亲肤不扎', pic: '', price: 199, originalPrice: 259, sale: 9261, brandId: 5, brandName: '优衣库', productCategoryId: 11, stock: 320 },
  { id: 106, name: "Nike Air Force 1 '07 经典小白鞋", subTitle: '复古板鞋 · 男女同款 · 百搭潮流', pic: '', price: 749, originalPrice: 899, sale: 6542, brandId: 6, brandName: 'Nike', productCategoryId: 71, stock: 210 },
  { id: 107, name: '海尔 501升 十字对开门冰箱 一级能效', subTitle: '全空间保鲜 · 风冷无霜 · 超薄嵌入', pic: '', price: 3999, originalPrice: 4599, sale: 431, brandId: 7, brandName: '海尔', productCategoryId: 31, stock: 42 },
  { id: 108, name: '美的 1.5匹 变频冷暖空调 新一级能效', subTitle: '智能控温 · 静音节能 · 高温自清洁', pic: '', price: 2599, originalPrice: 3199, sale: 768, brandId: 8, brandName: '美的', productCategoryId: 31, stock: 58 },
  { id: 109, name: '全棉时代 纯棉四件套 裸睡级亲肤床品', subTitle: '新疆长绒棉 · 活性印染 · 不起球', pic: '', price: 329, originalPrice: 429, sale: 3120, brandId: 9, brandName: '全棉时代', productCategoryId: 41, stock: 190 },
  { id: 110, name: '三只松鼠 每日坚果 30包混合装', subTitle: '科学配比 · 干湿分离 · 新鲜锁鲜', pic: '', price: 89, originalPrice: 129, sale: 15821, brandId: 10, brandName: '三只松鼠', productCategoryId: 51, stock: 500 },
  { id: 111, name: '农夫山泉 17.5° 赣南脐橙 5kg装', subTitle: '产地直发 · 皮薄多汁 · 酸甜可口', pic: '', price: 59.9, originalPrice: 79.9, sale: 8432, brandId: 11, brandName: '农夫山泉', productCategoryId: 52, stock: 260 },
  { id: 112, name: 'SK-II 神仙水 精华露 230ml', subTitle: 'PITERA™ 精华 · 稳定肌肤状态', pic: '', price: 1540, originalPrice: 1760, sale: 1023, brandId: 12, brandName: 'SK-II', productCategoryId: 81, stock: 25 },
  { id: 113, name: '罗技 G610 机械键盘 有线游戏键盘', subTitle: 'Cherry轴体 · 白色背光 · 全键无冲', pic: '', price: 449, originalPrice: 599, sale: 2087, brandId: 13, brandName: '罗技', productCategoryId: 23, stock: 96 },
  { id: 114, name: '华为 WATCH GT4 智能手表 46mm', subTitle: '超长续航 · 科学运动 · 健康监测', pic: '', price: 1488, originalPrice: 1688, sale: 1567, brandId: 2, brandName: '华为', productCategoryId: 24, stock: 73 },
]

/** mock 搜索：关键词/分类/品牌过滤 + 排序 + 分页 */
export function mockSearchProducts(params: {
  keyword?: string
  productCategoryId?: number
  brandId?: number
  pageNum: number
  pageSize: number
  sort?: number
}): CommonPage<Product> {
  let list = [...mockProducts]
  if (params.keyword) {
    const kw = params.keyword.toLowerCase()
    list = list.filter((p) => `${p.name}${p.subTitle || ''}${p.brandName || ''}`.toLowerCase().includes(kw))
  }
  if (params.productCategoryId) {
    const cid = params.productCategoryId
    list = list.filter((p) => p.productCategoryId === cid || Math.floor((p.productCategoryId || 0) / 10) === cid)
  }
  if (params.brandId) {
    list = list.filter((p) => p.brandId === params.brandId)
  }
  if (params.sort === 1) list.sort((a, b) => b.id - a.id)
  if (params.sort === 2) list.sort((a, b) => (b.sale || 0) - (a.sale || 0))
  const total = list.length
  const start = (params.pageNum - 1) * params.pageSize
  return {
    pageNum: params.pageNum,
    pageSize: params.pageSize,
    total,
    totalPage: Math.max(1, Math.ceil(total / params.pageSize)),
    list: list.slice(start, start + params.pageSize),
  }
}

const SKU_COLORS = ['曜石黑', '珍珠白', '远峰蓝']

/** mock 商品详情：由商品数据组装 SKU 与富文本详情 */
export function mockProductDetail(id: number): ProductDetail {
  const p = mockProducts.find((x) => x.id === id) || mockProducts[0]
  const skus: SkuStock[] = SKU_COLORS.map((color, i) => ({
    id: 90000 + p.id * 10 + i,
    price: p.price,
    stock: 42 + i * 18,
    spData: JSON.stringify([{ key: '颜色', value: color }]),
    pic: p.pic,
  }))
  return {
    product: {
      ...p,
      albumPics: '',
      detailHtml: [
        `<p><strong>${p.name}</strong></p>`,
        `<p>${p.subTitle || ''}</p>`,
        `<p>精选品质好物，官方渠道正品保障。支持七天无理由退换货，售后无忧。</p>`,
        `<p>品质甄选 · 极速物流 · 贴心服务</p>`,
      ].join(''),
    },
    brand: { id: p.brandId || 1, name: p.brandName || 'MALL 精选', logo: '' },
    skuStockList: skus,
  }
}

/** mock 秒杀结束时间：2 小时后（保证倒计时始终可演示） */
export const mockFlashEndTime = dayjs().add(2, 'hour').format('YYYY-MM-DD HH:mm:ss')

/** 商品实拍图（按 id 映射；Banner/专题同理走真实图片，图标类才用矢量） */
const PRODUCT_PICS: Record<number, string> = {
  101: assetImage('professional e-commerce product photo of a black flagship smartphone with triple camera, floating on clean light gray gradient background, studio lighting, sharp detail'),
  102: assetImage('professional e-commerce product photo of white wireless noise cancelling earbuds with charging case, clean bright background, studio lighting'),
  103: assetImage('professional e-commerce product photo of a thin silver aluminum laptop open at three quarter angle, clean white background, soft studio lighting'),
  104: assetImage('professional e-commerce product photo of premium black over-ear headphones, clean light background, studio lighting, sharp detail'),
  105: assetImage('professional e-commerce product photo of a folded beige wool knit sweater, clean neutral background, soft natural light, apparel catalog style'),
  106: assetImage('professional e-commerce product photo of white leather low-top sneakers, clean light gray background, studio lighting, crisp detail'),
  107: assetImage('professional e-commerce product photo of a stainless steel french door refrigerator in a bright modern kitchen, clean minimal background, commercial photography'),
  108: assetImage('professional e-commerce product photo of a modern white wall mounted air conditioner, clean light background, studio product lighting'),
  109: assetImage('professional e-commerce product photo of neatly folded white cotton bedding set with pillows, clean bright background, soft light, home textile catalog'),
  110: assetImage('professional e-commerce product photo of assorted nuts and dried fruits in small transparent packages on bright background, appetizing food photography'),
  111: assetImage('professional e-commerce product photo of fresh navel oranges with green leaves, vibrant orange color, clean white background, appetizing fruit photography'),
  112: assetImage('professional e-commerce product photo of a luxury frosted glass skincare essence bottle, elegant minimal background, soft studio lighting, cosmetic photography'),
  113: assetImage('professional e-commerce product photo of a white mechanical gaming keyboard with backlight, dark clean background, studio lighting, sharp detail'),
  114: assetImage('professional e-commerce product photo of a modern smartwatch with metal case and black strap, clean gradient background, studio lighting'),
}

export const mockProducts: Product[] = RAW_MOCK_PRODUCTS.map((p) => ({
  ...p,
  pic: PRODUCT_PICS[p.id] || p.pic,
}))
