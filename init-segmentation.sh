#!/bin/bash
# 智游金旅 - 数据库初始化脚本
# 创建时间: 2025-01-26
# 版本: v1.0

echo "🚀 智游金旅 - 用户画像系统初始化"
echo "=================================="

# 检查Node.js环境
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

echo "✅ Node.js 环境检查通过"

# 检查npm依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装npm依赖..."
    npm install
fi

# 检查必要的依赖
echo "🔍 检查依赖包..."
if ! npm list sqlite3 &> /dev/null; then
    echo "📦 安装 sqlite3..."
    npm install sqlite3
fi

if ! npm list node-cron &> /dev/null; then
    echo "📦 安装 node-cron..."
    npm install node-cron
fi

# 创建数据库目录
echo "📁 创建数据库目录..."
mkdir -p server/database

# 初始化数据库
echo "🗄️ 初始化数据库..."
node server/database/dbManager.js

if [ $? -eq 0 ]; then
    echo "✅ 数据库初始化成功"
else
    echo "❌ 数据库初始化失败"
    exit 1
fi

# 运行特征计算和画像生成
echo "🎯 生成初始画像数据..."
node server/services/featureEngine.js

if [ $? -eq 0 ]; then
    echo "✅ 画像数据生成成功"
else
    echo "❌ 画像数据生成失败"
    exit 1
fi

# 启动批处理任务
echo "⏰ 启动批处理任务..."
node server/jobs/batchScheduler.js &
BATCH_PID=$!

# 等待批处理任务完成
sleep 5

# 检查批处理任务状态
if ps -p $BATCH_PID > /dev/null; then
    echo "✅ 批处理任务启动成功 (PID: $BATCH_PID)"
    echo "💡 批处理任务将在后台运行，每日3:00自动更新画像数据"
else
    echo "⚠️ 批处理任务启动失败"
fi

echo ""
echo "🎉 用户画像系统初始化完成！"
echo ""
echo "📊 系统功能："
echo "   ✅ 用户画像分析（5种类型）"
echo "   ✅ 埋点数据收集"
echo "   ✅ 特征计算引擎"
echo "   ✅ 批处理任务调度"
echo "   ✅ 用户端画像展示"
echo "   ✅ 管理端看板分析"
echo "   ✅ 隐私合规保护"
echo ""
echo "🚀 启动服务器："
echo "   npm start"
echo ""
echo "🔧 管理命令："
echo "   查看画像数据: node server/services/featureEngine.js"
echo "   手动批处理: node server/jobs/batchScheduler.js"
echo "   数据库管理: node server/database/dbManager.js"
echo ""
echo "📱 访问地址："
echo "   用户端: http://localhost:3000/ai"
echo "   管理端: http://localhost:3000/admin"
echo ""
echo "🔒 隐私保护："
echo "   - k-匿名阈值: 30"
echo "   - 数据保留期: 180天"
echo "   - 差分隐私: 可选启用"
echo "   - 用户同意: 可随时关闭"
echo ""
echo "=================================="
echo "🎯 智游金旅用户画像系统就绪！"








