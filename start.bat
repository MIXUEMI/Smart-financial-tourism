@echo off
echo 启动智游金旅AI助手...
echo.
echo 正在检查Node.js环境...
node --version
if %errorlevel% neq 0 (
    echo 错误: 未找到Node.js，请先安装Node.js
    pause
    exit /b 1
)

echo.
echo 正在安装依赖...
npm install

echo.
echo 正在启动服务器...
echo 服务器地址: http://localhost:3000
echo 按 Ctrl+C 停止服务器
echo.

node server/app.js