export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/category/index',
    'pages/cart/index',
    'pages/mine/index',
    'pages/search/index',
    'pages/product/index',
    'pages/order-confirm/index',
    'pages/order-list/index',
    'pages/login/index',
    'pages/assistant/index',
  ],
  window: {
    backgroundTextStyle: 'dark',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: 'Mall 商城',
    navigationBarTextStyle: 'black',
    backgroundColor: '#f5f6f8',
  },
  tabBar: {
    color: '#86909c',
    selectedColor: '#e1251b',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
        iconPath: 'assets/tabbar/home.png',
        selectedIconPath: 'assets/tabbar/home-selected.png',
      },
      {
        pagePath: 'pages/category/index',
        text: '分类',
        iconPath: 'assets/tabbar/category.png',
        selectedIconPath: 'assets/tabbar/category-selected.png',
      },
      {
        pagePath: 'pages/cart/index',
        text: '购物车',
        iconPath: 'assets/tabbar/cart.png',
        selectedIconPath: 'assets/tabbar/cart-selected.png',
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的',
        iconPath: 'assets/tabbar/mine.png',
        selectedIconPath: 'assets/tabbar/mine-selected.png',
      },
    ],
  },
})
