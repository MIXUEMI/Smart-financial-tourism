// 服务器配置文件
require('dotenv').config();

const config = {
    // 服务器配置
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    
    // DeepSeek API 配置
    deepseek: {
        apiKey: process.env.DEEPSEEK_API_KEY || '',
        baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
        model: 'deepseek-chat',
        maxTokens: 2000,
        temperature: 0.7
    },
    
    // 数据库配置（如果需要）
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        name: process.env.DB_NAME || 'tourism_ai_db',
        user: process.env.DB_USER || '',
        password: process.env.DB_PASSWORD || ''
    },
    
    // 其他API配置
    external: {
        weatherApiKey: process.env.WEATHER_API_KEY || '',
        mapApiKey: process.env.MAP_API_KEY || ''
    },
    
    // CORS配置
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        credentials: true
    }
};

module.exports = config;
