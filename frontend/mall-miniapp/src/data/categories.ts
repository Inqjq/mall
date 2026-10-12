import type { CategoryNode } from '@/types/api'

/** 演示分类树（与真实商城分类结构一致：一级 -> 二级） */
export const mockCategoryTree: CategoryNode[] = [
  {
    id: 1, name: '服装',
    childrenList: [
      { id: 11, name: 'T恤' },
      { id: 12, name: '外套' },
      { id: 13, name: '裤装' },
      { id: 14, name: '连衣裙' },
    ],
  },
  {
    id: 2, name: '手机数码',
    childrenList: [
      { id: 21, name: '手机' },
      { id: 22, name: '耳机音响' },
      { id: 23, name: '电脑办公' },
      { id: 24, name: '智能穿戴' },
    ],
  },
  {
    id: 3, name: '家用电器',
    childrenList: [
      { id: 31, name: '大家电' },
      { id: 32, name: '厨房电器' },
      { id: 33, name: '生活电器' },
    ],
  },
  {
    id: 4, name: '家具家居',
    childrenList: [
      { id: 41, name: '床品套件' },
      { id: 42, name: '家具灯具' },
      { id: 43, name: '收纳清洁' },
    ],
  },
  {
    id: 5, name: '食品生鲜',
    childrenList: [
      { id: 51, name: '休闲零食' },
      { id: 52, name: '水果生鲜' },
      { id: 53, name: '粮油调味' },
    ],
  },
  {
    id: 6, name: '酒水饮料',
    childrenList: [
      { id: 61, name: '白酒' },
      { id: 62, name: '啤酒' },
      { id: 63, name: '饮料冲调' },
    ],
  },
  {
    id: 7, name: '鞋靴箱包',
    childrenList: [
      { id: 71, name: '男鞋' },
      { id: 72, name: '女鞋' },
      { id: 73, name: '箱包' },
    ],
  },
  {
    id: 8, name: '美妆个护',
    childrenList: [
      { id: 81, name: '面部护肤' },
      { id: 82, name: '彩妆香水' },
      { id: 83, name: '个人护理' },
    ],
  },
]

/** 按父级 id 查询子分类（一级传 0） */
export function mockCategoryChildren(parentId: number): CategoryNode[] {
  if (parentId === 0) return mockCategoryTree.map(({ id, name }) => ({ id, name }))
  return mockCategoryTree.find((n) => n.id === parentId)?.childrenList || []
}
