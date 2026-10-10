# mall-swarm 电商微服务全栈项目

基于 Spring Cloud Alibaba 的电商微服务后端 + Vue 3 前端（管理端 / 商城 H5）+ Python AI 智能助手的完整全栈项目。

## 一、整体架构

```
                        ┌─────────────────┐     ┌─────────────────┐
                        │  mall-admin-web  │     │   mall-app-web   │
                        │  管理端 (8090)   │     │  商城H5 (8091)   │
                        │ Vue3+TS+Element │     │  Vue3+TS+Vant   │
                        └────────┬────────┘     └────────┬────────┘
                                 │      /gateway 代理     │
                                 └───────────┬───────────┘
                                             ▼
                              ┌──────────────────────────┐
                              │   mall-gateway (8201)     │
                              │  Spring Cloud Gateway     │
                              │  Sa-Token 统一鉴权         │
                              └──┬─────┬─────┬─────┬─────┬─┘
              ┌──────────────────┘     │     │     │     └──────────────┐
              ▼                        ▼     ▼     ▼                    ▼
      ┌──────────────┐  ┌──────────┐ ┌────────┐ ┌────────────┐ ┌────────────┐
      │  mall-auth   │  │mall-admin│ │mall-   │ │mall-search │ │ mall-demo  │
      │ 统一认证 8401 │  │后台管理   │ │portal  │ │ES搜索 8081 │ │ 示例 8082  │
      └──────┬───────┘  │  8080    │ │前台 8085│ └────────────┘ └────────────┘
             │          └────┬─────┘ └───┬────┘
             │               │           │
             └───────┬───────┴───────────┴──────────┐
                     ▼                              ▼
      ┌─────────────────────────────────────────────────────┐
      │  Nacos(8848 注册+配置)  Redis(6379)  MySQL(3306)      │
      │  RabbitMQ(5672)  Elasticsearch(9200)  MongoDB(27017) │
      └─────────────────────────────────────────────────────┘
```

另有独立模块 `mall-ai-agent`：Python + LangGraph 智能助手，通过网关调用商城接口。

## 目录结构

```
mall-swarm/
├── backend/            # Java 后端（Maven 多模块）
│   ├── pom.xml
│   ├── mall-gateway/   # 网关
│   ├── mall-auth/      # 统一认证
│   ├── mall-admin/     # 后台管理服务
│   ├── mall-portal/    # 前台商城服务
│   ├── mall-search/    # ES 搜索服务
│   ├── mall-demo/      # 示例服务
│   ├── mall-monitor/   # 监控中心
│   ├── mall-mbg/       # MBG 实体/Mapper
│   ├── mall-common/    # 公共模块
│   ├── config/         # Nacos 配置中心 yaml（dev/prod）
│   └── document/       # 部署文档、Docker/K8s 编排、SQL 脚本
├── frontend/           # Vue 3 + TypeScript 前端
│   ├── mall-admin-web/ # 管理端 (8090, Element Plus)
│   └── mall-app-web/   # 商城 H5 (8091, Vant 4)
├── ai/                 # AI 助手
│   └── mall-ai-agent/  # FastAPI + LangGraph (8500)
└── README.md
```

## 二、技术栈

| 层 | 技术 |
|---|---|
| 后端框架 | Spring Boot 3.x / Spring Cloud 2023.x / Spring Cloud Alibaba |
| 微服务治理 | Nacos（注册中心 + 配置中心）、Spring Cloud Gateway、OpenFeign |
| 认证授权 | Sa-Token + JWT（网关统一鉴权，管理员/会员双账号体系） |
| 数据存储 | MySQL + MyBatis-Generator(mbg)、Redis、MongoDB |
| 搜索引擎 | Elasticsearch 7.x（商品搜索） |
| 消息队列 | RabbitMQ（订单超时取消延迟队列） |
| 文档/监控 | Knife4j（网关聚合文档）、Spring Boot Admin |
| 管理端前端 | Vue 3 + TypeScript + Vite + Element Plus + Pinia + Vue Router + Axios |
| 商城端前端 | Vue 3 + TypeScript + Vite + Vant 4 + Pinia + Vue Router + Axios |
| AI 助手 | Python 3.11 + FastAPI + LangChain + LangGraph + Nacos SDK |

## 三、模块说明

### 后端（Java）

| 模块 | 说明 |
|---|---|
| `mall-gateway` | API 网关：路由转发、Sa-Token 登录/权限校验、白名单 |
| `mall-auth` | 统一认证：`/auth/login` 按 clientId 区分管理员(admin-app)/会员(portal-app) |
| `mall-admin` | 后台管理服务：商品/分类/品牌/订单/营销/权限(RBAC)/MinIO 上传 |
| `mall-portal` | 前台商城服务：首页聚合、商品详情、购物车、下单、会员、支付宝对接 |
| `mall-search` | 商品搜索服务：商品导入 ES、简单/综合搜索、推荐 |
| `mall-mbg` | MyBatis Generator 生成的实体/Mapper（数据库访问层公共模块） |
| `mall-common` | 公共模块：CommonResult/CommonPage、异常、工具类 |
| `mall-demo` | 示例服务（学习/演示用） |
| `mall-monitor` | Spring Boot Admin 监控中心 |
| `backend/config/` | Nacos 配置中心的各服务 yaml（dev/prod） |
| `backend/document/` | 部署文档、K8s 编排、SQL 脚本 |

### 前端（Vue 3 + TypeScript）

| 模块 | 端口 | 说明 |
|---|---|---|
| `mall-admin-web` | 8090 | 管理端（Element Plus）：登录、Dashboard、商品/分类/品牌、订单、系统用户、ES 搜索测试 |
| `mall-app-web` | 8091 | 商城 H5（Vant）：首页、分类、搜索、商品详情/加购、购物车结算、确认订单、我的订单、会员登录 |

前端均通过 Vite 开发代理 `/gateway → http://localhost:8201` 转发到网关，生产环境由 nginx 做同样转发。

### AI 助手（Python）

| 模块 | 端口 | 说明 |
|---|---|---|
| `mall-ai-agent` | 8500 | FastAPI + LangGraph ReAct Agent，工具调用商城接口（搜商品/查详情/查订单），注册到 Nacos |

## 四、端口速查

### 服务端口

| 服务 | 端口 | 网关路由 |
|---|---|---|
| mall-gateway | 8201 | -（所有请求入口） |
| mall-admin | 8080 | `/mall-admin/**` |
| mall-search | 8081 | `/mall-search/**` |
| mall-demo | 8082 | `/mall-demo/**` |
| mall-portal | 8085 | `/mall-portal/**` |
| mall-monitor | 8101 | 直连访问 |
| mall-auth | 8401 | `/mall-auth/**` |
| mall-admin-web | 8090 | 前端 dev server |
| mall-app-web | 8091 | 前端 dev server |
| mall-ai-agent | 8500 | -（独立服务） |

### 中间件端口

| 中间件 | 端口 | 用途 |
|---|---|---|
| Nacos | 8848 | 注册中心 + 配置中心 |
| MySQL | 3306 | 业务数据 |
| Redis | 6379 | 缓存、Sa-Token 会话、权限规则 |
| RabbitMQ | 5672 | 订单消息（vhost: /mall） |
| Elasticsearch | 9200 | 商品搜索 |
| MongoDB | 27017 | 会员浏览记录/收藏 |
| MinIO | 9000 | 商品图片存储 |

## 五、快速开始

### 1. 启动中间件与后端

前置：本地或远程已部署 Nacos/MySQL/Redis/ES/MongoDB/RabbitMQ（地址见 `backend/config/` 下各 yaml），Nacos 中导入 `backend/config/` 目录的配置。

```bash
# 在 backend/ 目录构建全部模块
cd backend
mvn clean package

# 依次启动（或 IDE 中运行各启动类）
mall-gateway    # 8201 网关（最先启动）
mall-auth       # 8401
mall-admin      # 8080
mall-portal     # 8085
mall-search     # 8081
```

### 2. 启动管理端前端

```bash
cd frontend/mall-admin-web
npm install
npm run dev        # http://localhost:8090
```

默认管理员账号 `admin / macro123`（可在数据库修改）。

### 3. 启动商城端前端

```bash
cd frontend/mall-app-web
npm install
npm run dev        # http://localhost:8091
```

需要会员账号登录后使用购物车/下单；浏览、搜索无需登录。

### 4. 生产构建

```bash
npm run build      # 产物在 dist/，nginx 托管并将 /gateway 反代到网关 8201
```

## 六、鉴权说明

- 登录：`POST /mall-auth/auth/login?clientId=admin-app|portal-app&username=&password=`
- 返回：`{ code:200, data:{ token, tokenHead:"Bearer " } }`
- 后续请求头：`Authorization: Bearer <token>`（Sa-Token 配置于网关 application.yml：token-name=Authorization、token-prefix=Bearer）
- 管理端走 `/mall-admin/**` 管理员账号体系 + RBAC 接口权限；商城端走 `/mall-portal/**` 会员账号体系
- 免登录白名单（网关 `secure.ignore.urls`）：登录注册、`/mall-search/**`、`/mall-portal/home/**`、`/mall-portal/product/**`、`/mall-portal/brand/**` 等

## 七、核心接口示例（经网关）

```
# 管理端
POST /mall-auth/auth/login?clientId=admin-app&username=admin&password=macro123
GET  /mall-admin/product/list?pageNum=1&pageSize=10
GET  /mall-admin/order/list?pageSize=10
GET  /mall-admin/admin/info

# 商城端（浏览免登录）
GET  /mall-portal/home/content                 # 首页聚合
GET  /mall-portal/product/detail/{id}          # 商品详情
POST /mall-portal/sso/login?username=&password= # 会员登录
GET  /mall-portal/cart/list                    # 购物车（需会员 token）
POST /mall-portal/order/generateOrder          # 下单（需会员 token）

# 搜索
GET  /mall-search/esProduct/search/simple?keyword=手机&pageNum=0&pageSize=5
POST /mall-search/esProduct/importAll          # 全量导入商品到 ES
```

聚合文档（Knife4j）：网关启动后访问 `http://localhost:8201/doc.html`

## 八、前端工程结构（两端一致）

```
src/
├── main.ts            # 入口：注册 Pinia/Router/UI 库
├── App.vue
├── router/index.ts    # 路由 + 登录守卫
├── stores/user.ts     # Pinia：token/用户信息/结算上下文
├── utils/request.ts   # Axios 封装：token 注入、CommonResult 解包、401 处理
├── types/api.ts       # 与后端 Java 实体对齐的 TS 类型定义
├── api/               # 按业务域拆分的接口模块
├── layout/            # （管理端）侧边栏 + 顶栏布局
└── views/             # 页面组件
```
