import type { Brand, FlashPromotionProduct, HomeAdvertise, HomeContent, Subject } from '@/types/api'
import { assetImage, brandImageOf } from '@/utils/visual'
import { mockFlashEndTime, mockProducts } from './products'

/** 演示首页聚合内容（后端不可达时的降级数据源） */
export const mockHomeContent: HomeContent = {
  advertiseList: [
    {
      id: 1,
      name: '数码焕新季 · 至高直降1000',
      pic: assetImage(
        'modern electronics sale banner, flagship smartphone and slim laptop on deep blue gradient background, professional studio lighting, clean minimal e-commerce advertising, high detail',
        'landscape_16_9',
      ),
      url: '',
    },
    {
      id: 2,
      name: '秋冬新装上市 · 2件9折',
      pic: assetImage(
        'autumn winter fashion banner, cozy knit sweaters and wool coats arranged on warm beige background, soft natural window light, elegant lifestyle editorial photography',
        'landscape_16_9',
      ),
      url: '',
    },
    {
      id: 3,
      name: '大家电以旧换新 · 政府补贴',
      pic: assetImage(
        'home appliance promotion banner, bright modern kitchen with stainless steel refrigerator and built-in oven, clean minimal interior, professional commercial photography, warm light',
        'landscape_16_9',
      ),
      url: '',
    },
    {
      id: 4,
      name: '零食狂欢周 · 满99减30',
      pic: assetImage(
        'snack party promotion banner, colorful assortment of packaged snacks nuts and dried fruit on vivid yellow background, cheerful appetizing food photography, bright colors',
        'landscape_16_9',
      ),
      url: '',
    },
  ] as HomeAdvertise[],
  brandList: [
    { id: 1, name: '小米', logo: brandImageOf('小米') },
    { id: 2, name: '华为', logo: brandImageOf('华为') },
    { id: 3, name: 'Apple', logo: brandImageOf('Apple') },
    { id: 4, name: '索尼', logo: brandImageOf('索尼') },
    { id: 5, name: '优衣库', logo: brandImageOf('优衣库') },
    { id: 6, name: 'Nike', logo: brandImageOf('Nike') },
    { id: 7, name: '海尔', logo: brandImageOf('海尔') },
    { id: 8, name: '三只松鼠', logo: brandImageOf('三只松鼠') },
  ] as Brand[],
  homeFlashPromotion: {
    endTime: mockFlashEndTime,
    productList: mockProducts.slice(0, 5).map((p, i) => ({
      ...p,
      flashPromotionPrice: Math.round((p.price || 0) * (0.6 + i * 0.05)),
      flashPromotionLimit: 2,
    })) as FlashPromotionProduct[],
  },
  newProductList: [...mockProducts].sort((a, b) => b.id - a.id).slice(0, 6),
  hotProductList: [...mockProducts].sort((a, b) => (b.sale || 0) - (a.sale || 0)).slice(0, 6),
  subjectList: [
    {
      id: 1,
      title: '数码影音焕新专场',
      pic: assetImage(
        'digital audio gadgets flat lay, headphones smartwatch and wireless earbuds on dark slate surface, moody studio lighting, premium tech editorial photography',
        'landscape_16_9',
      ),
      categoryName: '数码',
    },
    {
      id: 2,
      title: '秋冬穿搭灵感合集',
      pic: assetImage(
        'autumn winter outfit flat lay, wool coat scarf and leather boots on neutral linen background, soft daylight, fashion editorial photography',
        'landscape_16_9',
      ),
      categoryName: '服饰',
    },
    {
      id: 3,
      title: '宅家幸福感好物',
      pic: assetImage(
        'cozy home lifestyle scene, soft cotton bedding textured blanket and warm table lamp in bright minimal room, natural light, comfortable interior photography',
        'landscape_16_9',
      ),
      categoryName: '家居',
    },
    {
      id: 4,
      title: '全球美酒品鉴汇',
      pic: assetImage(
        'wine tasting scene, red wine glasses and bottles on dark wooden table with warm ambient light, elegant moody photography, shallow depth of field',
        'landscape_16_9',
      ),
      categoryName: '酒水',
    },
  ] as Subject[],
}
