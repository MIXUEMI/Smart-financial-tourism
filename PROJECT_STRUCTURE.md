# 金融旅游AI助手 - 项目结构

## 📁 项目目录结构

```
my-financial-tourism-app/
│
├── public/                    # 静态文件目录
│   ├── index.html            # 主页面HTML
│   └── assets/               # 静态资源
│       ├── styles.css        # 主样式文件
│       └── app.js           # React应用脚本
│
├── src/                      # 前端源码目录
│   ├── components/           # React组件（已创建但未使用）
│   │   ├── Header.js        # 头部导航栏组件
│   │   ├── Sidebar.js       # 侧边栏组件
│   │   ├── ChatWindow.js    # AI咨询窗口组件
│   │   └── DataPanel.js     # 数据看板组件
│   ├── services/            # API服务
│   │   ├── financialApi.js  # 金融数据API
│   │   ├── tourismApi.js    # 旅游数据API
│   │   └── aiApi.js         # AI咨询API
│   ├── App.js               # 应用入口文件
│   └── index.js             # 主入口文件
│
├── server/                   # 后端代码目录
│   ├── controllers/         # 控制器
│   │   └── aiController.js  # AI控制器
│   ├── routes/              # 路由定义
│   │   └── apiRoutes.js     # API路由
│   ├── config.js            # 配置文件
│   └── app.js               # 后端入口文件
│
├── package.json             # 项目依赖管理
├── .gitignore              # Git忽略文件
├── README.md               # 项目说明文档
├── PROJECT_STRUCTURE.md    # 项目结构说明
├── start.bat               # Windows启动脚本
└── start.sh                # Linux/Mac启动脚本
```

## 🚀 快速开始

### Windows用户
```bash
# 双击运行
start.bat

# 或命令行运行
npm install
npm start
```

### Linux/Mac用户
```bash
# 运行启动脚本
./start.sh

# 或手动运行
npm install
npm start
```

## 🌟 功能特色

### 1. 前端功能
- **响应式设计**: 适配各种屏幕尺寸
- **现代UI**: 玻璃质感界面，渐变背景
- **动态交互**: 平滑动画和微交互
- **实时数据**: 金融和旅游数据实时更新
- **地图集成**: Leaflet地图显示城市信息

### 2. 后端功能
- **Express服务器**: 轻量级Node.js后端
- **DeepSeek AI集成**: 智能对话和咨询
- **RESTful API**: 标准化的API接口
- **数据模拟**: 完整的模拟数据系统
- **错误处理**: 完善的错误处理机制

### 3. AI功能
- **智能对话**: 基于DeepSeek的AI助手
- **金融咨询**: 理财建议和产品推荐
- **旅游规划**: 景点推荐和行程安排
- **综合服务**: 金融与旅游结合的建议

## 🔧 技术栈

### 前端
- **React**: 用户界面框架
- **HTML5/CSS3**: 现代Web标准
- **Leaflet**: 地图显示
- **Chart.js**: 数据可视化（预留）

### 后端
- **Node.js**: 服务器运行环境
- **Express**: Web应用框架
- **OpenAI SDK**: DeepSeek API集成
- **CORS**: 跨域资源共享

### AI服务
- **DeepSeek API**: 大语言模型服务
- **自定义提示词**: 专业金融旅游助手
- **上下文管理**: 智能对话上下文

## 📊 API接口

### 金融数据接口
- `GET /api/financial-data` - 获取实时金融数据
- `GET /api/financial-products` - 获取理财产品
- `GET /api/loan-products` - 获取贷款产品

### 旅游数据接口
- `GET /api/tourism-data` - 获取城市旅游数据
- `GET /api/popular-cities` - 获取热门城市
- `GET /api/attractions` - 获取景点推荐
- `GET /api/hotel-prices` - 获取酒店价格
- `GET /api/weather` - 获取天气信息

### AI咨询接口
- `POST /api/ai-chat` - AI对话接口
- `POST /api/ai/financial-advice` - 金融建议
- `POST /api/ai/tourism-advice` - 旅游建议
- `POST /api/ai/combined-advice` - 综合建议
- `GET /api/ai/health` - AI服务健康检查

## 🎨 界面设计

### 主界面布局
- **左侧边栏**: 导航菜单和功能入口
- **顶部导航**: 城市选择和搜索功能
- **中央区域**: 数据看板和地图显示
- **右下角**: AI助手悬浮按钮

### 视觉特色
- **渐变背景**: 蓝紫色渐变营造科技感
- **玻璃质感**: 半透明毛玻璃效果
- **动态文字**: 闪烁和渐变动画效果
- **响应式**: 适配移动端和桌面端

## 🔐 安全配置

### API密钥管理
- DeepSeek API密钥存储在配置文件中
- 生产环境建议使用环境变量
- 敏感信息已加入.gitignore

### 错误处理
- 完善的错误捕获和处理
- 用户友好的错误提示
- 开发环境详细错误信息

## 📈 扩展功能

### 已预留的扩展点
- 数据库集成（MongoDB/MySQL）
- 用户认证和授权
- 实时数据推送
- 更多地图功能
- 数据可视化图表

### 未来可添加功能
- 用户个人中心
- 收藏和推荐系统
- 社交分享功能
- 移动端APP
- 多语言支持

## 🛠️ 开发说明

### 开发环境
- Node.js 16+
- npm 8+
- 现代浏览器支持

### 代码规范
- ES6+ JavaScript语法
- React函数组件
- 模块化设计
- 注释完整

### 部署建议
- 使用PM2进程管理
- 配置Nginx反向代理
- 设置HTTPS证书
- 定期备份数据
