# 智游金旅 - 用户画像系统

## 🎯 系统概述

智游金旅用户画像系统是一个完整的用户行为分析和画像生成平台，在不暴露个人隐私的前提下，为用户提供个性化的类型分析和消费建议。

## ✨ 核心功能

### 用户端功能
- **个人画像展示**: 显示用户类型、分位位置、解释标签
- **类型占比**: 环形图展示各用户类型分布
- **词云分析**: 近30天热门关键词热度
- **隐私控制**: 可随时关闭画像功能

### 管理端功能
- **画像看板**: 全站用户类型分析
- **转化漏斗**: 曝光→点击→下单→权益→理财/分期
- **留存分析**: 7/30/90天留存率
- **城市热力图**: 用户地理分布分析
- **匿名下钻**: 支持脱敏的详细分析

### 技术特性
- **规则树画像**: 5种用户类型自动分类
- **特征计算**: 30+维度的用户特征分析
- **批处理调度**: 每日3:00自动更新画像
- **隐私合规**: k-匿名、差分隐私、数据保留策略

## 🏗️ 系统架构

```
智游金旅用户画像系统
├── 数据层
│   ├── SQLite数据库
│   ├── 用户表 (users)
│   ├── 事件表 (events)
│   ├── 特征表 (user_features)
│   ├── 画像表 (user_segment)
│   └── 聚合表 (segment_overview_daily, wordcloud_30d)
├── 服务层
│   ├── 埋点服务 (trackingService)
│   ├── 特征引擎 (featureEngine)
│   ├── 批处理调度 (batchScheduler)
│   └── 数据库管理 (dbManager)
├── API层
│   ├── 用户端API (/api/analytics/*)
│   └── 管理端API (/api/analytics/admin/*)
└── 前端层
    ├── 用户画像卡片 (userSegmentationCard)
    ├── 管理端看板 (admin.html)
    └── 图表组件 (Chart.js)
```

## 🚀 快速开始

### 1. 环境要求
- Node.js 14+
- npm 6+

### 2. 安装依赖
```bash
npm install
```

### 3. 初始化数据库
```bash
# Linux/Mac
chmod +x init-segmentation.sh
./init-segmentation.sh

# Windows
init-segmentation.bat
```

### 4. 启动服务
```bash
npm start
```

### 5. 访问系统
- 用户端: http://localhost:3000/ai
- 管理端: http://localhost:3000/admin

## 📊 用户类型说明

### 1. 理财型游客
- **特征**: 风险偏好低，消费能力强
- **规则**: risk_score ≤ 40 且 spend_30d ≥ 3000
- **建议**: 稳健型理财产品，年化收益4-6%

### 2. 轻旅行打工人
- **特征**: 旅行频次高，偏好分期消费
- **规则**: trips_365d ≥ 3 且 activity_30d ≥ 8 且 installment_count ≥ 2
- **建议**: 分期旅游产品，周末短途套餐

### 3. 家庭度假型
- **特征**: 注重家庭，教育投资
- **规则**: education_orders ≥ 2
- **建议**: 亲子旅游套餐，教育类产品

### 4. 康养型用户
- **特征**: 健康意识强，品质生活
- **规则**: age_bucket in ('55-64','65+') 或 health_orders ≥ 1
- **建议**: 康养旅游，健康保险产品

### 5. 探索型年轻人
- **特征**: 追求新鲜，价格敏感
- **规则**: age_bucket in ('18-24','25-34') 且 destination_diversity ≥ 3
- **建议**: 青年旅社，背包客套餐

## 🔒 隐私保护

### 数据最小化
- 用户端仅显示聚合数据和自己的画像
- 管理端仅显示脱敏的聚合统计
- 不返回任何个人身份信息(PII)

### k-匿名保护
- 分组样本数 < 30 时自动隐藏
- 确保用户无法被单独识别

### 差分隐私
- 可选启用微弱噪声添加
- 保护个体隐私的同时保持统计准确性

### 数据保留策略
- 事件明细: 180天
- 聚合数据: 长期保留
- 定期自动清理过期数据

### 用户控制
- 可随时关闭画像功能
- 提供详细的隐私说明
- 支持撤回同意

## 📈 埋点系统

### 事件类型
- `page_view`: 页面浏览
- `search_city`: 城市搜索
- `book_click`: 预订点击
- `rights_activate`: 权益激活
- `finance_buy`: 金融产品购买

### 使用方式
```javascript
// 前端埋点
window.tracking.pageView('ai_page');
window.tracking.citySearch('北京');
window.tracking.bookClick('hotel_001', 2999, '北京');
```

## 🔧 管理命令

### 数据库管理
```bash
# 初始化数据库
node server/database/dbManager.js

# 查看统计信息
node -e "const db = require('./server/database/dbManager'); db.init().then(() => db.getStats()).then(console.log)"
```

### 特征计算
```bash
# 手动运行特征计算
node server/services/featureEngine.js

# 批量处理所有用户
node -e "const fe = require('./server/services/featureEngine'); fe.batchProcessAllUsers()"
```

### 批处理任务
```bash
# 启动批处理调度器
node server/jobs/batchScheduler.js

# 手动触发画像生成
node -e "const bs = require('./server/jobs/batchScheduler'); bs.triggerSegmentationJob()"
```

## 📊 API接口

### 用户端API

#### GET /api/analytics/segments-overview
获取类型占比和词云数据
```json
{
  "as_of": "2025-01-26",
  "segments": [
    {"label": "理财型游客", "share": 0.26},
    {"label": "轻旅行打工人", "share": 0.32}
  ],
  "wordcloud": [
    {"text": "亲子", "weight": 41},
    {"text": "北京", "weight": 38}
  ]
}
```

#### GET /api/analytics/user-segmentation/me
获取用户自己的画像信息
```json
{
  "user_label": "轻旅行打工人",
  "percentiles": {
    "spend_level": 62,
    "activity": 74,
    "risk_tolerance": 45
  },
  "explanation": ["周末短途", "价格敏感", "偏好分期"],
  "version": "v1.0"
}
```

### 管理端API

#### GET /api/analytics/admin/segments
获取管理端类型占比数据
```json
{
  "as_of": "2025-01-26",
  "city": "all",
  "segments": [
    {"label": "理财型游客", "share": 0.22, "n": 3250},
    {"label": "轻旅行打工人", "share": 0.32, "n": 4720}
  ]
}
```

#### GET /api/analytics/admin/funnel
获取转化漏斗数据
```json
{
  "label": "轻旅行打工人",
  "range": "30d",
  "steps": [
    {"name": "曝光", "count": 120000},
    {"name": "点击", "count": 36000, "rate": 0.30},
    {"name": "下单", "count": 7200, "rate": 0.20}
  ]
}
```

## 🎯 验收指标

### 用户端指标
- 画像卡片点击率 ≥ 12%
- 画像开关保留率(7日) ≥ 85%
- 页面加载时间 P95 < 1s

### 业务指标
- 画像驱动的金融转化率提升 ≥ +8%
- 权益激活率提升 ≥ +10%
- 用户满意度 ≥ 4.5/5.0

### 技术指标
- API响应时间 P95 < 150ms
- 系统可用性 ≥ 99.9%
- 数据准确性 ≥ 95%

## 🔧 配置说明

### 环境变量
```bash
# 功能开关
FEATURE_SEGMENT=on
FEATURE_TRACKING=on

# 批处理配置
SEG_JOB_CRON="0 3 * * *"

# 隐私配置
ENABLE_DIFFERENTIAL_PRIVACY=true
K_ANONYMOUS_THRESHOLD=30
DATA_RETENTION_DAYS=180

# 缓存配置
CACHE_TTL_OVERVIEW=600000  # 10分钟
CACHE_TTL_USER=60000      # 1分钟
```

## 🐛 故障排除

### 常见问题

1. **数据库连接失败**
   ```bash
   # 检查数据库文件权限
   ls -la server/database/
   
   # 重新初始化数据库
   node server/database/dbManager.js
   ```

2. **画像数据不更新**
   ```bash
   # 检查批处理任务状态
   ps aux | grep batchScheduler
   
   # 手动触发批处理
   node -e "const bs = require('./server/jobs/batchScheduler'); bs.triggerSegmentationJob()"
   ```

3. **API响应慢**
   ```bash
   # 检查缓存状态
   # 清理过期数据
   node -e "const ts = require('./server/services/trackingService'); ts.cleanupExpiredEvents()"
   ```

## 📝 更新日志

### v1.0.0 (2025-01-26)
- ✅ 完整的用户画像系统
- ✅ 5种用户类型自动分类
- ✅ 用户端画像展示
- ✅ 管理端看板分析
- ✅ 隐私合规保护
- ✅ 埋点数据收集
- ✅ 批处理任务调度

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系我们

- 项目主页: https://github.com/your-org/tourism-ai-assistant
- 问题反馈: https://github.com/your-org/tourism-ai-assistant/issues
- 邮箱: support@tourism-ai.com

---

**智游金旅 - AI智能金融 × 云端旅游 × 数据未来** 🚀








