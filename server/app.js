// 服务器主入口文件
const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');

// 加载环境变量
require('dotenv').config();

// 创建Express应用
const app = express();

// 中间件配置
app.use(cors(config.cors));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static(path.join(__dirname, '../public')));

// 配置CSS和JS静态资源路径
app.use('/css', express.static(path.join(__dirname, '../public/css')));
app.use('/js', express.static(path.join(__dirname, '../public/js')));

// API路由
const apiRoutes = require('./routes/apiRoutes');
const analyticsRoutes = require('./routes/analytics');
const adminAnalyticsRoutes = require('./routes/adminAnalytics');

app.use('/api', apiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/analytics/admin', adminAnalyticsRoutes);

// 根路径 - 返回登录页面
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 主界面路由
app.get('/main', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/main.html'));
});

// 各功能页面路由
app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/home.html'));
});

app.get('/financial', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/financial.html'));
});

app.get('/tourism', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/tourism.html'));
});

app.get('/ai', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/ai.html'));
});

app.get('/booking', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/booking.html'));
});

app.get('/promotion', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/promotion.html'));
});

app.get('/account', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/account.html'));
});

// 管理员面板路由
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin.html'));
});

// 管理员登录调试页面
app.get('/debug-admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/debug-admin.html'));
});

app.get('/market', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/market.html'));
});

// 兼容旧的主页面路由
app.get('/main', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/main.html'));
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({
        success: false,
        error: config.nodeEnv === 'development' ? err.message : '服务器内部错误',
        timestamp: new Date().toISOString()
    });
});

// 处理所有其他路由 - 返回首页（排除API路由）
app.get('*', (req, res, next) => {
    // 如果是API路由，跳过这个处理
    if (req.path.startsWith('/api/')) {
        return next();
    }
    // 如果是静态资源，跳过这个处理
    if (req.path.startsWith('/css/') || req.path.startsWith('/js/') || req.path.startsWith('/images/')) {
        return next();
    }
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 404处理
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: '请求的资源不存在',
        timestamp: new Date().toISOString()
    });
});

// 启动服务器
const PORT = config.port;
app.listen(PORT, () => {
    console.log(`🚀 金融旅游AI助手服务器启动成功！`);
    console.log(`📍 服务地址: http://localhost:${PORT}`);
    console.log(`🌍 环境: ${config.nodeEnv}`);
    console.log(`🤖 DeepSeek API: ${config.deepseek.baseUrl}`);
    console.log(`⏰ 启动时间: ${new Date().toLocaleString()}`);
    console.log('='.repeat(50));
});

// 优雅关闭
process.on('SIGTERM', () => {
    console.log('收到SIGTERM信号，正在关闭服务器...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('收到SIGINT信号，正在关闭服务器...');
    process.exit(0);
});

module.exports = app;