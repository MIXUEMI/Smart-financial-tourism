# 智游金旅 - 金融旅游AI助手

## 项目简介

智游金旅是一个创新的金融旅游AI助手应用，围绕"旅前资产体检—旅中权益指挥台—旅后复利回补—AI关怀陪伴—数据协同合规"构建完整的旅财闭环。通过Node.js后端与多页面前端支撑DeepSeek AI服务，实现"资金安全感+情绪松弛感"的双向体验。

## 系统要求

### 必需软件版本
- **Node.js**: v22.19.0 或更高版本
- **npm**: v10.9.3 或更高版本
- **操作系统**: Windows 10/11, macOS, Linux

### 环境依赖
- 现代浏览器（Chrome 90+, Firefox 88+, Safari 14+, Edge 90+）
- 网络连接（用于AI服务和外部API调用）

## 🚀 快速开始

### 方式一：一键启动（推荐）

#### Windows用户
```bash
# 双击运行启动脚本
start.bat

# 或者在命令行中运行
.\start.bat
```

#### Linux/macOS用户
```bash
# 给脚本执行权限
chmod +x start.sh

# 运行启动脚本
./start.sh
```

### 方式二：手动启动

#### 1. 克隆项目
```bash
git clone <repository-url>
cd tourism-ai-assistant
```

#### 2. 检查环境
确保已安装以下软件：
- **Node.js**: v22.19.0 或更高版本
- **npm**: v10.9.3 或更高版本

检查命令：
```bash
node --version
npm --version
```

#### 3. 安装依赖
```bash
npm install
```

#### 4. 环境配置（可选）
创建 `.env` 文件用于自定义配置：
```bash
# DeepSeek AI配置（可选，系统有默认配置）
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_BASE_URL=https://api.deepseek.com

# 其他API配置（可选）
WEATHER_API_KEY=your_weather_api_key
MAP_API_KEY=your_map_api_key

# 服务器配置
PORT=3000
NODE_ENV=development
```

#### 5. 启动项目
```bash
# 生产模式启动
npm start

# 开发模式启动（需要安装nodemon）
npm run dev

# 直接启动（等同于npm start）
node server/app.js
```

#### 6. 访问应用
打开浏览器访问：`http://localhost:3000`

### 🎯 启动成功标志

当看到以下输出时，表示启动成功：
```
🚀 金融旅游AI助手服务器启动成功！
📍 服务地址: http://localhost:3000
🌍 环境: development
🤖 DeepSeek API: https://api.deepseek.com
⏰ 启动时间: 2025/10/27 14:26:00
==================================================
```

### 🔧 启动脚本说明

#### Windows启动脚本 (start.bat)
- 自动检查Node.js环境
- 自动安装依赖包
- 启动服务器并显示访问地址
- 支持错误处理和用户提示

#### Linux/macOS启动脚本 (start.sh)
- 检查Node.js安装状态
- 验证项目文件完整性
- 自动安装依赖
- 启动服务器服务

### 📱 访问方式

启动成功后，可以通过以下方式访问：

1. **主页**: `http://localhost:3000`
2. **用户端**: `http://localhost:3000/home.html`
3. **管理员端**: `http://localhost:3000/admin.html`
4. **AI助手**: `http://localhost:3000/ai.html`
5. **个人中心**: `http://localhost:3000/account.html`

### ⚠️ 常见启动问题

#### 问题1：端口被占用
```bash
# 错误信息：EADDRINUSE: address already in use :::3000
# 解决方案：
# 1. 修改端口（在.env文件中设置PORT=3001）
# 2. 或者停止占用端口的进程
```

#### 问题2：依赖安装失败
```bash
# 清理缓存后重新安装
npm cache clean --force
npm install
```

#### 问题3：Node.js版本不兼容
```bash
# 检查当前版本
node --version

# 如果版本过低，请升级到v22.19.0或更高版本
# 下载地址：https://nodejs.org/
```

#### 问题4：权限问题（Linux/macOS）
```bash
# 给启动脚本执行权限
chmod +x start.sh

# 如果仍有权限问题，使用sudo运行
sudo ./start.sh
```

## 产品功能详解

### 登录系统

#### 普通用户登录
1. 访问 `http://localhost:3000`
2. 选择"普通用户"类型
3. 输入用户名和密码（任意用户名密码即可登录）
4. 点击"登录"进入用户端界面

#### 管理员登录
1. 在登录页面选择"管理员"
2. 使用默认账号：
   - 用户名：`admin`
   - 密码：`admin123`
3. 点击"登录"进入管理后台

### 核心功能模块

#### 1. 旅前资产体检中心
**位置**: 用户首页主区域
**功能**: 
- 填写月收入、月支出、旅行预算、风险偏好
- 系统自动计算并显示：
  - 旅费预算建议
  - 可激活的权益数量
  - 6个月复利回补估算
- 数据自动保存到本地存储

**操作步骤**:
1. 在"智金银行旅前资产体检"区域填写财务信息
2. 选择风险偏好等级
3. 点击"保存资产配置"按钮
4. 查看上方显示的预算建议和权益推荐

#### 2. 智能理财中心
**位置**: 左侧导航栏 → "智能理财"
**功能**:
- 查看AI智能投资理财建议
- 分析旅行支出vs理财回补
- 显示6个月和12个月理财收益预期
- 提供个性化理财产品推荐

**操作步骤**:
1. 点击左侧导航栏"智能理财"
2. 查看上方理财建议和下方收益对比图表
3. 根据个人情况调整投资策略

#### 3. 旅游规划中心
**位置**: 左侧导航栏 → "旅游规划"
**功能**:
- 城市选择器切换目的地
- 实时天气信息（24小时、7天、15天预报）
- 酒店价格推荐
- 热门景点信息
- 智能旅游服务推荐

**操作步骤**:
1. 点击左侧导航栏"旅游规划"
2. 使用城市选择器选择目的地
3. 查看天气、酒店、景点信息
4. 获取个性化旅游建议

#### 4. AI智能助手
**位置**: 左侧导航栏 → "AI助手"
**功能**:
- 基于DeepSeek AI的智能对话
- 旅游规划咨询
- 金融投资建议
- 风险控制指导
- 预算管理建议

**操作步骤**:
1. 点击左侧导航栏"AI助手"
2. 在对话框输入问题
3. 获得AI智能回复和建议
4. 支持多轮对话

#### 5. 优惠活动中心
**位置**: 左侧导航栏 → "优惠活动"
**功能**:
- 浏览银行优惠信息
- 查看旅游折扣活动
- 积分兑换服务
- 限时特惠推荐
- 个性化优惠匹配

**操作步骤**:
1. 点击左侧导航栏"优惠活动"
2. 浏览各类优惠信息
3. 点击感兴趣的优惠查看详情
4. 一键申请或收藏优惠

#### 6. 预订管理中心
**位置**: 左侧导航栏 → "预订管理"
**功能**:
- 酒店搜索和预订
- 行程管理
- 订单跟踪
- 银行优惠整合
- 智能匹配推荐

**操作步骤**:
1. 点击左侧导航栏"预订管理"
2. 使用搜索功能查找酒店
3. 应用筛选条件
4. 完成预订流程

#### 7. 个人中心
**位置**: 右上角用户头像
**功能**:
- 查看个人信息
- 管理账户设置
- 查看订单历史
- 管理收藏和优惠券
- 查看活动记录

**操作步骤**:
1. 点击右上角用户头像
2. 查看个人概览信息
3. 使用各功能模块管理账户

#### 8. 关怀模式
**位置**: 右上角红色心形按钮
**功能**:
- 语音播报
- 字体放大
- 高对比度显示
- 键盘导航
- 简化界面

**操作步骤**:
1. 点击右上角"关怀模式"按钮
2. 系统自动调整界面显示
3. 享受无障碍操作体验

#### 9. 便携工具
**位置**: 右下角"便携工具"按钮
**功能**:
- 语音交互
- 语音命令控制
- 智能导航
- 功能快捷操作

**操作步骤**:
1. 点击右下角"便携工具"
2. 查看语音命令帮助
3. 使用语音指令控制界面

#### 10. 用户画像分析系统 🎯
**位置**: 个人中心 → "用户画像分析"
**功能**:
- **个人画像展示**: 基于多维度特征分析的用户类型识别
- **类型分析**: 5种用户类型精准分类（理财型游客、轻旅行打工人、家庭度假型、康养型用户、探索型年轻人）
- **Top5排行**: 用户类型占比和活跃度统计
- **实时更新**: 基于用户行为数据的动态画像更新
- **置信度评估**: 画像分析的可信度评分

**技术特点**:
- 多维度权重分析算法（旅行风格30%、预算偏好20%、风险偏好25%、兴趣标签15%、其他因素10%）
- 实时数据聚合和可视化展示
- Chart.js图表库实现数据可视化
- 本地数据存储和隐私保护

**操作步骤**:
1. 点击个人中心进入用户画像分析页面
2. 查看个人用户类型和置信度
3. 浏览Top5用户类型排行榜
4. 了解各类型用户的特征和占比

#### 11. 管理员画像看板 📊
**位置**: 管理员端 → "用户画像看板"
**功能**:
- **用户分群分析**: K-means聚类算法进行用户分群
- **转化漏斗分析**: 访问→注册→咨询→支付转化率统计
- **留存复购分析**: 7天/30天/90天留存率分析
- **数据可视化**: 饼状图、热力图、趋势图展示
- **数据导出**: 支持CSV/Excel格式数据导出

**商业价值**:
- 精准营销：减少30%营销成本，提升40%转化率
- 产品优化：基于用户需求优化产品设计
- 风险控制：信用评估和欺诈检测
- 数据变现：行业报告和API服务

**操作步骤**:
1. 使用管理员账号登录（admin/admin123）
2. 点击"用户画像看板"进入分析页面
3. 使用筛选器调整分析维度
4. 查看各类图表和数据统计
5. 导出分析报告和数据

## 🏗️ 技术架构

### 前端技术栈
- **HTML5**: 页面结构和语义化标签
- **CSS3**: 样式设计、动画效果、响应式布局
- **JavaScript ES6+**: 现代JavaScript交互逻辑
- **Chart.js**: 数据可视化图表库
- **Leaflet**: 地图服务和地理信息展示
- **WebSocket**: 实时数据通信
- **LocalStorage**: 本地数据存储和管理

### 后端技术栈
- **Node.js**: 服务器运行环境
- **Express.js**: Web应用框架
- **CORS**: 跨域资源共享中间件
- **dotenv**: 环境变量管理
- **node-cron**: 定时任务调度
- **OpenAI SDK**: AI服务集成

### AI服务集成
- **DeepSeek AI**: 主要智能对话服务
- **OpenAI API**: 备用AI模型接口
- **智能分析引擎**: 用户画像分析算法
- **自然语言处理**: 智能对话和文本分析

### 用户画像分析技术架构

#### 算法引擎
- **多维度权重分析**: 基于用户偏好的智能分类算法
- **K-means聚类**: 用户分群和相似性分析
- **实时数据聚合**: 动态用户行为数据收集和分析
- **置信度评估**: 画像分析结果的可信度计算

#### 数据可视化
- **Chart.js**: 饼状图、柱状图、趋势图
- **实时图表**: 动态数据更新和交互式图表
- **响应式设计**: 适配不同屏幕尺寸的图表展示
- **数据导出**: CSV/Excel格式数据导出功能

#### 数据存储
- **本地存储**: 用户偏好和画像数据
- **内存缓存**: 实时数据缓存和性能优化
- **数据加密**: 用户隐私数据保护
- **版本控制**: 画像数据版本管理和回滚

## 数据存储

### 本地存储
- 用户登录状态
- 个人财务数据
- 旅行偏好设置
- 操作历史记录

### 数据安全
- 本地数据加密存储
- API接口安全认证
- 用户隐私保护
- 数据脱敏处理

## 常见问题

### Q: 如何重置登录状态？
A: 清除浏览器本地存储数据，或使用隐私模式访问。

### Q: AI助手无法回复怎么办？
A: 检查网络连接，或查看控制台错误信息。系统有备用回复机制。

### Q: 如何修改默认管理员密码？
A: 在 `public/index.html` 文件中修改 `handleAdminLogin` 函数。

### Q: 如何添加新的城市数据？
A: 在 `server/data/tourismData.js` 文件中添加城市信息。

### Q: 如何自定义AI回复？
A: 在 `server/controllers/aiController.js` 文件中修改提示词模板。

## 开发指南

### 📁 项目结构
```
tourism-ai-assistant/
├── 📁 public/                    # 前端静态文件
│   ├── 📁 css/                  # 样式文件
│   │   └── base.css             # 基础样式
│   ├── 📁 js/                   # JavaScript文件
│   │   ├── main.js              # 主要逻辑
│   │   ├── router.js            # 路由管理
│   │   ├── userData.js          # 用户数据管理
│   │   ├── userSegmentation.js  # 用户画像分析
│   │   └── careMode.js          # 关怀模式
│   ├── 📁 components/           # 组件文件
│   │   └── userSegmentationCard.html
│   ├── 📁 templates/            # 模板文件
│   │   └── base.html
│   ├── 🏠 index.html            # 登录页面
│   ├── 🏠 home.html             # 用户首页
│   ├── 👤 account.html          # 个人中心（含用户画像分析）
│   ├── 🤖 ai.html               # AI助手
│   ├── 💰 financial.html        # 智能理财
│   ├── 🗺️ tourism.html          # 旅游规划
│   ├── 🎯 market.html           # 市场分析
│   ├── 🎁 promotion.html        # 优惠活动
│   ├── 📋 booking.html          # 预订管理
│   ├── ⚙️ admin.html            # 管理员端
│   └── 🔧 debug-admin.html      # 调试页面
├── 📁 server/                   # 后端服务
│   ├── 📁 controllers/          # 控制器
│   │   └── aiController.js      # AI控制器
│   ├── 📁 data/                 # 数据文件
│   │   ├── financialProducts.js # 金融产品数据
│   │   ├── promotions.js        # 促销活动数据
│   │   └── tourismData.js       # 旅游数据
│   ├── 📁 database/             # 数据库管理
│   │   ├── 📁 data/             # 数据存储
│   │   │   └── tourism_ai.json  # JSON数据库
│   │   ├── dbManager.js         # 数据库管理器
│   │   ├── jsonDbManager.js     # JSON数据库管理器
│   │   └── schema.sql           # 数据库结构
│   ├── 📁 routes/               # 路由配置
│   │   ├── adminAnalytics.js    # 管理员分析路由
│   │   ├── analytics.js         # 分析路由
│   │   └── apiRoutes.js         # API路由
│   ├── 📁 services/             # 服务层
│   │   ├── featureEngine.js     # 特征引擎
│   │   └── trackingService.js   # 追踪服务
│   ├── 📁 jobs/                 # 定时任务
│   │   └── batchScheduler.js    # 批处理调度器
│   ├── 🚀 app.js                # 应用入口
│   └── ⚙️ config.js             # 配置文件
├── 📁 node_modules/             # 依赖包
├── 📄 package.json              # 项目配置
├── 📄 package-lock.json         # 依赖锁定
├── 🚀 start.bat                 # Windows启动脚本
├── 🚀 start.sh                  # Linux/macOS启动脚本
├── 📖 README.md                 # 项目说明
├── 📊 用户画像分析商业计划书.md    # 商业计划书
├── 🔧 技术实现细节.md            # 技术实现文档
└── 📋 其他文档文件...
```

### 🔧 核心文件说明

#### 启动相关
- **start.bat**: Windows一键启动脚本
- **start.sh**: Linux/macOS一键启动脚本
- **server/app.js**: 应用主入口文件

#### 用户画像分析核心文件
- **public/js/userSegmentation.js**: 用户画像分析算法
- **public/account.html**: 个人中心页面（含画像分析）
- **public/admin.html**: 管理员画像看板
- **server/routes/adminAnalytics.js**: 管理员分析API

#### 配置文件
- **package.json**: 项目依赖和脚本配置
- **server/config.js**: 服务器配置文件
- **.env**: 环境变量配置（可选）

### 🛠️ 开发命令

#### 基础命令
```bash
# 安装依赖
npm install

# 启动生产服务器
npm start

# 启动开发服务器（自动重启）
npm run dev

# 查看项目信息
npm info

# 检查依赖安全
npm audit
```

#### 高级命令
```bash
# 清理缓存
npm cache clean --force

# 更新依赖
npm update

# 安装特定版本
npm install package@version

# 全局安装工具
npm install -g nodemon

# 查看已安装包
npm list

# 查看过时的包
npm outdated
```

#### 调试命令
```bash
# 启动调试模式
node --inspect server/app.js

# 使用nodemon调试
nodemon --inspect server/app.js

# 查看端口占用
netstat -ano | findstr :3000

# 杀死进程（Windows）
taskkill /PID <进程ID> /F

# 杀死进程（Linux/macOS）
kill -9 <进程ID>
```

#### 测试命令
```bash
# 运行测试（如果有测试文件）
npm test

# 测试AI服务连接
node test-ai.js

# 测试用户画像功能
# 访问 http://localhost:3000/test-segmentation.html
```

### 🔧 自定义配置

#### 环境变量配置
```bash
# 创建.env文件
touch .env

# 编辑环境变量
# PORT=3000
# NODE_ENV=development
# DEEPSEEK_API_KEY=your_key
# DEEPSEEK_BASE_URL=https://api.deepseek.com
```

#### 修改默认配置
- **修改端口**: 在 `.env` 文件中设置 `PORT=3001`
- **修改AI模型**: 在 `server/config.js` 中调整配置
- **修改管理员密码**: 在 `public/index.html` 中修改 `handleAdminLogin` 函数
- **添加新城市**: 在 `server/data/tourismData.js` 中添加城市信息
- **自定义AI回复**: 在 `server/controllers/aiController.js` 中修改提示词模板

#### 添加新功能
1. **前端页面**: 在 `public/` 目录下创建新的HTML文件
2. **后端路由**: 在 `server/routes/` 目录下添加路由文件
3. **数据管理**: 在 `server/data/` 目录下添加数据文件
4. **样式文件**: 在 `public/css/` 目录下添加CSS文件
5. **JavaScript**: 在 `public/js/` 目录下添加JS文件

## 许可证

MIT License

## 联系方式

如有问题或建议，请联系开发团队。

---

**注意**: 本项目为演示版本，部分功能使用模拟数据。在生产环境中使用前，请确保配置正确的API密钥和数据库连接。