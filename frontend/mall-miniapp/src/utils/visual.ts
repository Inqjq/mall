import type { IconName } from '@/components/Icon'

/** 图片尺寸档位（与生成接口枚举一致） */
export type ImageSize =
  | 'square_hd'
  | 'square'
  | 'portrait_4_3'
  | 'portrait_16_9'
  | 'landscape_4_3'
  | 'landscape_16_9'

/**
 * 生成电商场景配图地址（HTTPS）
 * 内容位（Banner / 专题 / 商品 / 分类入口 / 品牌馆）统一走真实图片，
 * 矢量图标仅保留给按钮类控件与 tabBar。
 */
export function assetImage(prompt: string, size: ImageSize = 'square_hd'): string {
  return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=${size}`
}

/**
 * 分类/品类 → 真实品类图地址（首页分类快捷入口等内容位使用）
 * 矢量图标仅保留给按钮类控件，内容位统一走真实图片。
 */
export function categoryImageOf(name: string): string {
  const map: Array<[RegExp, string]> = [
    [/手机|数码|智能|电脑|通讯|影音|耳机/, 'close-up product photo of modern smartphones, wireless earbuds and a smartwatch arranged on a soft blue gradient background, bright clean e-commerce category image'],
    [/衣|服|装|针织|T恤|裤|裙/, 'folded cozy knitwear and casual clothing neatly arranged on a light neutral background, soft daylight, apparel category image'],
    [/家电|电器|冰箱|空调|洗衣|厨电/, 'modern home appliances including refrigerator and washing machine in a bright minimal room, clean commercial photography, category image'],
    [/家具|家居|家纺|床品|厨具|沙发|灯具|收纳/, 'cozy modern living room with sofa and soft textile cushions, warm natural light, home furnishing category image'],
    [/食品|生鲜|零食|水果|粮油|坚果|橙/, 'fresh fruits and assorted snacks arranged on a bright table, appetizing food photography, category image'],
    [/酒|饮料|茶|水/, 'assorted beverages with wine glasses and bottled drinks on a clean surface, bright product photography, category image'],
    [/鞋/, 'stylish sneakers and leather shoes arranged on a clean light background, product photography, category image'],
    [/箱包|包/, 'designer leather handbags and backpacks on a clean background, product photography, category image'],
    [/美妆|护肤|个护|彩妆|精华/, 'luxury skincare and makeup products on an elegant pastel background, clean cosmetic photography, category image'],
    [/礼品|礼物/, 'elegant gift boxes with ribbons on a soft background, warm light, category image'],
    [/运动|户外|健身/, 'sportswear and fitness equipment on a clean background, dynamic product photography, category image'],
    [/图书|文具|书/, 'a stack of books and stationery on a wooden desk, warm light, category image'],
  ]
  for (const [reg, prompt] of map) {
    if (reg.test(name)) return assetImage(prompt, 'square_hd')
  }
  return assetImage(
    'modern shopping bags and wrapped gift boxes on a soft gradient background, clean minimal e-commerce category image',
    'square_hd',
  )
}

/** 品牌名 → 品牌代表图地址（品牌馆使用该品牌品类的产品特写） */
export function brandImageOf(name: string): string {
  const map: Array<[RegExp, string]> = [
    [/小米/, 'product photo of a modern smartphone and smart home gadgets on a clean white background, minimalist tech brand product shot'],
    [/华为/, 'product photo of a flagship smartphone and a smartwatch on a clean bright background, premium tech brand product shot'],
    [/apple|Apple/i, 'product photo of a sleek silver laptop and a smartphone on a clean white background, premium minimalist tech brand shot'],
    [/索尼/, 'product photo of premium over-ear headphones and a compact camera on a clean background, flagship electronics brand shot'],
    [/优衣库/, 'neatly folded basic apparel in neutral colors on a clean background, minimalist fashion brand product shot'],
    [/nike/i, 'product photo of white running sneakers on a clean light background, sportswear brand product shot'],
    [/海尔/, 'product photo of a modern stainless steel refrigerator in a bright minimal kitchen, home appliance brand shot'],
    [/三只松鼠|松鼠/, 'assorted nuts and packaged snacks arranged on a bright background, snack brand product shot'],
    [/美的/, 'product photo of a modern white air conditioner in a clean bright room, home appliance brand shot'],
    [/农夫山泉/, 'fresh orange juice bottles and navel oranges on a clean bright background, beverage brand product shot'],
    [/sk-?ii/i, 'luxury frosted glass skincare essence bottle on an elegant background, premium beauty brand product shot'],
    [/罗技/, 'product photo of a white mechanical keyboard with backlight on a dark clean background, computer peripheral brand shot'],
    [/全棉时代/, 'neatly folded white cotton bedding and towels on a bright clean background, home textile brand shot'],
  ]
  for (const [reg, prompt] of map) {
    if (reg.test(name)) return assetImage(prompt, 'square_hd')
  }
  return assetImage(
    `product photo representing the brand ${name}, clean bright studio background, e-commerce brand product shot`,
    'square_hd',
  )
}

/** 品牌渐变色系（起始色，结束色） */
const GRADIENTS: Array<[string, string]> = [
  ['#ff7a45', '#e1251b'],
  ['#5b8cff', '#3253f0'],
  ['#9c6bff', '#6a3de8'],
  ['#2fbf91', '#0e9f6e'],
  ['#ffb020', '#f57c00'],
  ['#ff6b9d', '#e91e63'],
  ['#38c6e0', '#0891b2'],
  ['#7c8aa5', '#4b5563'],
]

/** 名称 → 稳定 hash，用于挑选渐变色系 */
function hashName(name: string): number {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  }
  return hash
}

/** 按名称取渐变色（品牌/商品/专题统一取色入口） */
export function gradientOf(name: string): [string, string] {
  return GRADIENTS[hashName(name || 'mall') % GRADIENTS.length]
}

/** 分类/商品 → 品类图标（按名称关键词匹配） */
export function categoryIconOf(name: string): IconName {
  const map: Array<[RegExp, IconName]> = [
    [/手机|数码|智能|手表|电脑|通讯|影音|耳机/, 'smartphone'],
    [/衣|服|装|针织|T恤|裤/, 'shirt'],
    [/家电|电器|冰箱|空调|洗衣/, 'plug'],
    [/家具|家居|家纺|床品|厨具|沙发/, 'sofa'],
    [/食品|生鲜|零食|水果|粮油|坚果|橙/, 'apple'],
    [/酒|饮料|茶|水/, 'wine'],
    [/鞋/, 'footprints'],
    [/箱包|包/, 'briefcase'],
    [/美妆|护肤|个护|彩妆|精华/, 'sparkles'],
    [/礼品|礼物/, 'gift'],
    [/运动|户外|健身/, 'dumbbell'],
    [/图书|文具|书/, 'book'],
    [/键盘|游戏|电竞/, 'dumbbell'],
  ]
  for (const [reg, icon] of map) {
    if (reg.test(name)) return icon
  }
  return 'shopping-bag'
}

/** 品牌名 → 首字母（取第一个字符大写） */
export function initialOf(name: string): string {
  const ch = (name || 'M').trim().charAt(0)
  return /[a-zA-Z]/.test(ch) ? ch.toUpperCase() : ch
}
