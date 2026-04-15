@echo off
REM 智游金旅 - 数据库初始化脚本 (Windows)
REM 创建时间: 2025-01-26
REM 版本: v1.0

echo 🚀 智游金旅 - 用户画像系统初始化
echo ==================================

REM 检查Node.js环境
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js 未安装，请先安装 Node.js
    pause
    exit /b 1
)

echo ✅ Node.js 环境检查通过

REM 检查npm依赖
if not exist "node_modules" (
    echo 📦 安装npm依赖...
    npm install
)

REM 检查必要的依赖
echo 🔍 检查依赖包...
npm list sqlite3 >nul 2>&1
if %errorlevel% neq 0 (
    echo 📦 安装 sqlite3...
    npm install sqlite3
)

npm list node-cron >nul 2>&1
if %errorlevel% neq 0 (
    echo 📦 安装 node-cron...
    npm install node-cron
)

REM 创建数据库目录
echo 📁 创建数据库目录...
if not exist "server\database" mkdir server\database

REM 初始化数据库
echo 🗄️ 初始化数据库...
node server\database\dbManager.js
if %errorlevel% neq 0 (
    echo ❌ 数据库初始化失败
    pause
    exit /b 1
)
echo ✅ 数据库初始化成功

REM 运行特征计算和画像生成
echo 🎯 生成初始画像数据...
node server\services\featureEngine.js
if %errorlevel% neq 0 (
    echo ❌ 画像数据生成失败
    pause
    exit /b 1
)
echo ✅ 画像数据生成成功

REM 启动批处理任务
echo ⏰ 启动批处理任务...
start /b node server\jobs\batchScheduler.js
echo ✅ 批处理任务启动成功
echo 💡 批处理任务将在后台运行，每日3:00自动更新画像数据

echo.
echo 🎉 用户画像系统初始化完成！
echo.
echo 📊 系统功能：
echo    ✅ 用户画像分析（5种类型）
echo    ✅ 埋点数据收集
echo    ✅ 特征计算引擎
echo    ✅ 批处理任务调度
echo    ✅ 用户端画像展示
echo    ✅ 管理端看板分析
echo    ✅ 隐私合规保护
echo.
echo 🚀 启动服务器：
echo    npm start
echo.
echo 🔧 管理命令：
echo    查看画像数据: node server\services\featureEngine.js
echo    手动批处理: node server\jobs\batchScheduler.js
echo    数据库管理: node server\database\dbManager.js
echo.
echo 📱 访问地址：
echo    用户端: http://localhost:3000/ai
echo    管理端: http://localhost:3000/admin
echo.
echo 🔒 隐私保护：
echo    - k-匿名阈值: 30
echo    - 数据保留期: 180天
echo    - 差分隐私: 可选启用
echo    - 用户同意: 可随时关闭
echo.
echo ==================================
echo 🎯 智游金旅用户画像系统就绪！
echo.
pause








