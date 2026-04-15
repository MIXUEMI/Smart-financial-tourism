// routes/apiRoutes.js

const express = require('express');
const OpenAI = require('openai');
const config = require('../config'); // 引入我们的统一配置文件

// 引入数据文件
const promotions = require('../data/promotions');
const financialProducts = require('../data/financialProducts');
const tourismData = require('../data/tourismData');

const router = express.Router();

// 旅前计划数据存储（初期内存保存）
const travelPlans = [];

// 检查 DeepSeek API Key 是否已配置
if (!config.deepseek.apiKey) {
    console.error('❌ 错误：未在 .env 文件中配置 DEEPSEEK_API_KEY');
    // 在实际应用中，你可能希望在这里让程序退出或使其无法处理请求
}

// 使用从 config.js 中读取的配置来初始化 OpenAI 客户端
// 这样一来，所有的密钥和设置都由 config.js 统一管理
const deepseek = new OpenAI({
    baseURL: config.deepseek.baseUrl,
    apiKey: config.deepseek.apiKey
});

/**
 * POST /api/travel-plans
 * 保存用户的旅前资产体检数据
 * 请求体: { monthlyIncome, monthlyExpense, travelBudget, riskPreference }
 * 响应体: { success: true/false, message: "提示信息" }
 */
router.post('/travel-plans', (req, res) => {
    try {
        const { monthlyIncome, monthlyExpense, travelBudget, riskPreference } = req.body;
        
        // 校验必填字段
        if (!monthlyIncome || !monthlyExpense || !travelBudget) {
            return res.status(400).json({
                success: false,
                message: '月收入、月支出和旅行预算为必填项'
            });
        }
        
        // 校验数值有效性
        if (monthlyIncome < 0 || monthlyExpense < 0 || travelBudget < 0) {
            return res.status(400).json({
                success: false,
                message: '数值不能为负数'
            });
        }
        
        // 创建旅前计划对象
        const travelPlan = {
            id: Date.now().toString(),
            monthlyIncome: parseInt(monthlyIncome),
            monthlyExpense: parseInt(monthlyExpense),
            travelBudget: parseInt(travelBudget),
            riskPreference: riskPreference || 'moderate',
            createdAt: new Date().toISOString(),
            // 计算储蓄率
            savingsRate: ((monthlyIncome - monthlyExpense) / monthlyIncome * 100).toFixed(1),
            // 计算可投资金额
            investableAmount: Math.max(0, monthlyIncome - monthlyExpense - travelBudget)
        };
        
        // 保存到内存数组
        travelPlans.push(travelPlan);
        
        console.log('旅前计划保存成功:', travelPlan);
        
        res.json({
            success: true,
            message: '旅前计划保存成功',
            data: travelPlan
        });
        
    } catch (error) {
        console.error('保存旅前计划失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

/**
 * GET /api/travel-plans/latest
 * 获取用户最新的旅前计划
 * 响应体: { success: true/false, data: 旅前计划对象 }
 */
router.get('/travel-plans/latest', (req, res) => {
    try {
        if (travelPlans.length === 0) {
            // 返回默认模板
            const defaultPlan = {
                id: 'default',
                monthlyIncome: 0,
                monthlyExpense: 0,
                travelBudget: 0,
                riskPreference: 'moderate',
                createdAt: new Date().toISOString(),
                savingsRate: 0,
                investableAmount: 0
            };
            
            return res.json({
                success: true,
                data: defaultPlan,
                message: '暂无旅前计划数据'
            });
        }
        
        // 返回最新的计划
        const latestPlan = travelPlans[travelPlans.length - 1];
        
        res.json({
            success: true,
            data: latestPlan
        });
        
    } catch (error) {
        console.error('获取旅前计划失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

/**
 * GET /api/macro-indicators
 * 获取宏观经济指标数据
 * 响应体: { success: true/false, data: 宏观经济数据 }
 */
router.get('/macro-indicators', (req, res) => {
    try {
        // 模拟宏观经济指标数据
        const macroData = {
            gdpGrowth: 5.2, // GDP增长率
            inflationRate: 2.1, // 通胀率
            unemploymentRate: 5.4, // 失业率
            tourismRecovery: 78.5, // 旅游业恢复率
            consumerConfidence: 108.2, // 消费者信心指数
            lastUpdated: new Date().toISOString()
        };
        
        res.json({
            success: true,
            data: macroData
        });
        
    } catch (error) {
        console.error('获取宏观经济指标失败:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
});

/**
 * POST /api/financial-advice
 * 接收用户的金融旅游问题，并返回 DeepSeek AI 的建议。
 * 请求体 (Request Body) 格式: { "question": "用户的具体问题字符串" }
 * 响应体 (Response Body) 格式: { "advice": "AI生成的回答字符串" }
 */
router.post('/financial-advice', async (req, res) => {
    // 1. 从前端发送的请求体中获取问题
    const { question } = req.body;

    // 2. 输入验证：确保问题存在且不为空
    if (!question || typeof question !== 'string' || question.trim() === '') {
        return res.status(400).json({ error: '请求无效，问题内容不能为空。' });
    }

    try {
        console.log(`[API] 收到问题: "${question}"`);

        // 检查是否有有效的API密钥
        if (!config.deepseek.apiKey || config.deepseek.apiKey === '' || config.deepseek.apiKey === 'your_deepseek_api_key_here') {
            console.warn('⚠️ 未配置有效API密钥，使用模拟响应');
            const mockResponse = getMockFinancialAdvice(question);
            return res.json({ advice: mockResponse, mock: true });
        }

        // 3. 构造发送给 DeepSeek 的消息体
        const completion = await deepseek.chat.completions.create({
            model: config.deepseek.model, // 使用 config.js 中定义的模型
            messages: [
                { 
                    role: "system", 
                    content: "你是一个专业的金融旅游助手。你的任务是根据用户关于旅游的金融问题，提供清晰、实用且安全的建议。请专注于预算规划、节省开支、当地消费习惯、支付方式、汇率以及与金钱相关的旅游安全提示。" 
                },
                { 
                    role: "user", 
                    content: question 
                }
            ],
            max_tokens: config.deepseek.maxTokens,
            temperature: config.deepseek.temperature,
            stream: false
        });

        // 4. 提取 AI 的回答
        const aiResponse = completion.choices[0].message.content;
        console.log(`[API] AI 回答: "${aiResponse.substring(0, 50)}..."`);

        // 5. 将 AI 的回答作为 JSON 格式返回给前端
        res.json({ advice: aiResponse });

    } catch (error) {
        // 6. 错误处理 - 自动降级到模拟响应
        console.error('❌ 调用 DeepSeek API 时发生错误:', error);
        
        // 如果是认证错误，自动使用模拟响应
        if (error.status === 401 || error.status === 403) {
            console.warn('⚠️ API认证失败，自动降级到模拟响应');
            const mockResponse = getMockFinancialAdvice(question);
            return res.json({ advice: mockResponse, mock: true, fallback: true });
        }
        
        // 其他错误也降级到模拟响应
        console.warn('⚠️ API调用失败，使用模拟响应');
        const mockResponse = getMockFinancialAdvice(question);
        return res.json({ advice: mockResponse, mock: true, fallback: true });
    }
});

// 模拟金融旅游建议函数
function getMockFinancialAdvice(question) {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('日本') || lowerQuestion.includes('japan') || lowerQuestion.includes('东京') || lowerQuestion.includes('大阪')) {
        return `关于日本旅游的金融建议：

💰 预算规划（5000元）：
• 机票：1500-2000元（提前预订）
• 住宿：800-1200元（经济型酒店）
• 交通：300-500元（JR Pass或地铁）
• 餐饮：600-800元（当地美食）
• 景点门票：200-300元
• 购物：600-1000元

💳 支付方式：
• 现金：准备3-5万日元现金
• 信用卡：Visa/MasterCard通用
• 移动支付：支付宝/微信在部分商店可用

🏦 汇率建议：
• 提前关注汇率变化
• 在银行或正规兑换点换汇
• 避免在机场兑换（汇率较差）

⚠️ 安全提示：
• 分散存放现金和卡片
• 保留购物小票
• 记录紧急联系方式`;
    } else if (lowerQuestion.includes('欧洲') || lowerQuestion.includes('europe')) {
        return `关于欧洲旅游的金融建议：

💰 预算规划：
• 机票：3000-5000元
• 住宿：200-400元/晚
• 交通：Eurail Pass或当地交通卡
• 餐饮：100-200元/天
• 景点：50-100元/景点

💳 支付方式：
• 信用卡：Visa/MasterCard必备
• 现金：欧元现金少量备用
• 移动支付：Apple Pay/Google Pay

🏦 银行服务：
• 提前开通境外取现功能
• 了解手续费标准
• 准备多张银行卡备用`;
    } else if (lowerQuestion.includes('预算') || lowerQuestion.includes('省钱')) {
        return `旅游省钱攻略：

💰 预算控制技巧：
• 提前3-6个月预订机票酒店
• 选择淡季出行避开高峰期
• 使用比价网站寻找优惠
• 考虑民宿或青年旅社

💳 支付优化：
• 使用无境外手续费的信用卡
• 关注银行境外消费返现活动
• 合理使用现金和刷卡

🏦 金融工具：
• 货币兑换：关注汇率，分批兑换
• 旅行保险：购买合适的保险产品
• 紧急资金：准备应急资金`;
    } else {
        return `感谢您的咨询！我是您的金融旅游助手。

💡 我可以为您提供：
• 旅游预算规划和省钱技巧
• 不同国家的支付方式建议
• 汇率和货币兑换指导
• 旅行保险和金融安全建议
• 当地消费习惯和费用参考

请告诉我您计划去哪个国家旅游，或者有什么具体的金融问题需要咨询？`;
    }
}

// 保留原有的AI相关路由以保持兼容性
const aiController = require('../controllers/aiController');
router.post('/ai-chat', aiController.chat);
router.post('/ai/chat', aiController.chat);
router.post('/ai/financial-advice', aiController.getFinancialAdvice);
router.post('/ai/tourism-advice', aiController.getTourismAdvice);
router.post('/ai/combined-advice', aiController.getCombinedAdvice);
router.post('/ai/speech-to-text', aiController.speechToText);
router.post('/ai/text-to-speech', aiController.textToSpeech);
router.post('/ai/care-mode-chat', aiController.careModeChat);
router.get('/ai/health', aiController.healthCheck);

// 金融数据路由 - 支持不同城市
router.get('/financial-data', (req, res) => {
    try {
        const { city = '北京' } = req.query;
        
        // 不同城市的金融数据
        const cityFinancialData = {
            '北京': {
                exchangeRate: {
                    usd: (7.25 + (Math.random() - 0.5) * 0.1).toFixed(4),
                    eur: (7.85 + (Math.random() - 0.5) * 0.1).toFixed(4),
                    jpy: (0.048 + (Math.random() - 0.5) * 0.002).toFixed(4),
                    gbp: (9.12 + (Math.random() - 0.5) * 0.1).toFixed(4),
                    aud: (4.78 + (Math.random() - 0.5) * 0.05).toFixed(4)
                },
                interestRate: {
                    deposit: 2.1,
                    loan: 4.35,
                    mortgage: 4.1,
                    carLoan: 5.2,
                    consumerLoan: 6.8
                },
                stockIndex: {
                    shanghai: (3045.67 + (Math.random() - 0.5) * 50).toFixed(2),
                    shenzhen: (9856.23 + (Math.random() - 0.5) * 100).toFixed(2),
                    hongkong: (18456.78 + (Math.random() - 0.5) * 200).toFixed(2),
                    nasdaq: (14567.89 + (Math.random() - 0.5) * 300).toFixed(2)
                },
                localBanks: [
                    { name: '智金银行', rate: '3.25%', product: '定期存款', address: '北京市朝阳区' },
                    { name: '建业银行', rate: '3.30%', product: '理财产品', address: '北京市海淀区' },
                    { name: '招财银行', rate: '3.45%', product: '大额存单', address: '北京市西城区' }
                ],
                timestamp: new Date().toISOString()
            },
            '上海': {
                exchangeRate: {
                    usd: (7.26 + (Math.random() - 0.5) * 0.1).toFixed(4),
                    eur: (7.86 + (Math.random() - 0.5) * 0.1).toFixed(4),
                    jpy: (0.049 + (Math.random() - 0.5) * 0.002).toFixed(4),
                    gbp: (9.13 + (Math.random() - 0.5) * 0.1).toFixed(4),
                    aud: (4.79 + (Math.random() - 0.5) * 0.05).toFixed(4)
                },
                interestRate: {
                    deposit: 2.2,
                    loan: 4.25,
                    mortgage: 4.0,
                    carLoan: 5.1,
                    consumerLoan: 6.7
                },
                stockIndex: {
                    shanghai: (3056.78 + (Math.random() - 0.5) * 50).toFixed(2),
                    shenzhen: (9967.34 + (Math.random() - 0.5) * 100).toFixed(2),
                    hongkong: (18567.89 + (Math.random() - 0.5) * 200).toFixed(2),
                    nasdaq: (14678.90 + (Math.random() - 0.5) * 300).toFixed(2)
                },
                localBanks: [
                    { name: '浦发银行', rate: '3.35%', product: '定期存款', address: '上海市浦东新区' },
                    { name: '交通银行', rate: '3.40%', product: '理财产品', address: '上海市黄浦区' },
                    { name: '上海银行', rate: '3.55%', product: '大额存单', address: '上海市静安区' }
                ],
                timestamp: new Date().toISOString()
            },
            '深圳': {
                exchangeRate: {
                    usd: (7.24 + (Math.random() - 0.5) * 0.1).toFixed(4),
                    eur: (7.84 + (Math.random() - 0.5) * 0.1).toFixed(4),
                    jpy: (0.047 + (Math.random() - 0.5) * 0.002).toFixed(4),
                    gbp: (9.11 + (Math.random() - 0.5) * 0.1).toFixed(4),
                    aud: (4.77 + (Math.random() - 0.5) * 0.05).toFixed(4)
                },
                interestRate: {
                    deposit: 2.0,
                    loan: 4.45,
                    mortgage: 4.2,
                    carLoan: 5.3,
                    consumerLoan: 6.9
                },
                stockIndex: {
                    shanghai: (3034.56 + (Math.random() - 0.5) * 50).toFixed(2),
                    shenzhen: (9745.12 + (Math.random() - 0.5) * 100).toFixed(2),
                    hongkong: (18345.67 + (Math.random() - 0.5) * 200).toFixed(2),
                    nasdaq: (14456.78 + (Math.random() - 0.5) * 300).toFixed(2)
                },
                localBanks: [
                    { name: '平安银行', rate: '3.20%', product: '定期存款', address: '深圳市福田区' },
                    { name: '招财银行', rate: '3.25%', product: '理财产品', address: '深圳市南山区' },
                    { name: '深圳农商行', rate: '3.40%', product: '大额存单', address: '深圳市罗湖区' }
                ],
                timestamp: new Date().toISOString()
            }
        };
        
        const financialData = cityFinancialData[city] || cityFinancialData['北京'];
        
        res.json({
            success: true,
            data: financialData,
            city: city
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '获取金融数据失败'
        });
    }
});

// 金融优惠数据API - 支持不同城市
router.get('/financial-offers', (req, res) => {
    try {
        const { city = '北京' } = req.query;
        
        // 不同城市的金融优惠数据
        const cityOffers = {
            '北京': [
                {
                    id: 1,
                    title: '智金银行信用卡旅游优惠',
                    description: '持智金银行信用卡预订酒店享受9折优惠',
                    discount: '10%',
                    category: '旅游',
                    bank: '智金银行',
                    validUntil: '2025-12-31',
                    conditions: '单笔消费满500元',
                    icon: '🏨'
                },
                {
                    id: 2,
                    title: '建业银行积分兑换机票',
                    description: '使用建业银行积分兑换国内机票，最高可省1000元',
                    discount: '1000元',
                    category: '交通',
                    bank: '建业银行',
                    validUntil: '2025-11-30',
                    conditions: '积分余额满50000分',
                    icon: '✈️'
                },
                {
                    id: 3,
                    title: '招财银行餐饮优惠',
                    description: '招财银行信用卡在指定餐厅消费享受8.5折优惠',
                    discount: '15%',
                    category: '餐饮',
                    bank: '招财银行',
                    validUntil: '2025-10-31',
                    conditions: '每月限用3次',
                    icon: '🍽️'
                },
                {
                    id: 4,
                    title: '中华银行景点门票优惠',
                    description: '中华银行信用卡购买景点门票享受9折优惠',
                    discount: '10%',
                    category: '旅游',
                    bank: '中华银行',
                    validUntil: '2025-12-31',
                    conditions: '单笔消费满200元',
                    icon: '🎫'
                }
            ],
            '上海': [
                {
                    id: 1,
                    title: '浦发银行酒店优惠',
                    description: '浦发银行信用卡预订上海地区酒店享受8.8折优惠',
                    discount: '12%',
                    category: '旅游',
                    bank: '浦发银行',
                    validUntil: '2025-12-31',
                    conditions: '单笔消费满800元',
                    icon: '🏨'
                },
                {
                    id: 2,
                    title: '交通银行购物优惠',
                    description: '交通银行信用卡在南京路购物享受9折优惠',
                    discount: '10%',
                    category: '购物',
                    bank: '交通银行',
                    validUntil: '2025-11-30',
                    conditions: '单笔消费满1000元',
                    icon: '🛍️'
                }
            ],
            '深圳': [
                {
                    id: 1,
                    title: '平安银行旅游套餐',
                    description: '平安银行信用卡购买旅游套餐享受8.5折优惠',
                    discount: '15%',
                    category: '旅游',
                    bank: '平安银行',
                    validUntil: '2025-12-31',
                    conditions: '单笔消费满2000元',
                    icon: '🎒'
                },
                {
                    id: 2,
                    title: '深圳农商行餐饮优惠',
                    description: '深圳农商行信用卡在指定餐厅消费享受9折优惠',
                    discount: '10%',
                    category: '餐饮',
                    bank: '深圳农商行',
                    validUntil: '2025-10-31',
                    conditions: '每月限用5次',
                    icon: '🍽️'
                }
            ]
        };
        
        const offers = cityOffers[city] || cityOffers['北京'];
        
        res.json({
            success: true,
            data: offers,
            city: city
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '获取金融优惠失败'
        });
    }
});

// 理财产品路由
router.get('/financial-products', (req, res) => {
    try {
        const products = [
            {
                id: 1,
                name: '稳健型理财',
                type: '保本浮动收益',
                expectedReturn: '3.2%',
                riskLevel: '低',
                term: '90天',
                minAmount: 10000,
                features: ['保本', '稳定收益', '灵活期限']
            },
            {
                id: 2,
                name: '成长型理财',
                type: '非保本浮动收益',
                expectedReturn: '4.5%',
                riskLevel: '中',
                term: '180天',
                minAmount: 50000,
                features: ['较高收益', '专业管理', '风险可控']
            },
            {
                id: 3,
                name: '保本型理财',
                type: '保本固定收益',
                expectedReturn: '2.8%',
                riskLevel: '低',
                term: '30天',
                minAmount: 5000,
                features: ['保本保息', '短期灵活', '起购门槛低']
            }
        ];

        res.json({
            success: true,
            products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '获取理财产品失败'
        });
    }
});

// 贷款产品路由
router.get('/loan-products', (req, res) => {
    try {
        const loans = [
            {
                id: 1,
                name: '住房贷款',
                rate: '4.1%',
                term: '30年',
                maxAmount: 5000000,
                features: ['低利率', '长期限', '灵活还款'],
                requirements: ['收入证明', '房产证明', '征信良好']
            },
            {
                id: 2,
                name: '汽车贷款',
                rate: '5.2%',
                term: '5年',
                maxAmount: 500000,
                features: ['快速审批', '零首付可选', '保险优惠'],
                requirements: ['驾驶证', '收入证明', '车辆信息']
            },
            {
                id: 3,
                name: '消费贷款',
                rate: '6.8%',
                term: '3年',
                maxAmount: 200000,
                features: ['无抵押', '快速放款', '用途灵活'],
                requirements: ['身份证', '收入证明', '征信良好']
            }
        ];

        res.json({
            success: true,
            loans
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '获取贷款产品失败'
        });
    }
});

// 旅游数据路由
router.get('/tourism-data', (req, res) => {
    try {
        const { city = '北京' } = req.query;
        
        // 使用外部数据文件
        const cityData = tourismData;

        const data = cityData.find(item => item.city === city) || cityData[0];
        
        // 添加模拟天气数据
        data.weather = {
            temperature: `${Math.round(15 + Math.random() * 10)}°C`,
            condition: ['晴', '多云', '阴', '小雨'][Math.floor(Math.random() * 4)],
            humidity: `${Math.round(40 + Math.random() * 40)}%`
        };
        
        res.json({
            success: true,
            city,
            data,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '获取旅游数据失败'
        });
    }
});

// 热门城市路由
router.get('/popular-cities', (req, res) => {
    try {
        const cities = [
            { name: '北京', popularity: 95, coordinates: [39.9042, 116.4074] },
            { name: '上海', popularity: 92, coordinates: [31.2304, 121.4737] },
            { name: '深圳', popularity: 88, coordinates: [22.5431, 114.0579] },
            { name: '杭州', popularity: 85, coordinates: [30.2741, 120.1551] },
            { name: '成都', popularity: 82, coordinates: [30.5728, 104.0668] },
            { name: '广州', popularity: 80, coordinates: [23.1291, 113.2644] },
            { name: '南京', popularity: 78, coordinates: [32.0603, 118.7969] },
            { name: '武汉', popularity: 75, coordinates: [30.5928, 114.3055] }
        ];

        res.json({
            success: true,
            cities
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '获取热门城市失败'
        });
    }
});

// 景点推荐路由
router.get('/attractions', (req, res) => {
    try {
        const { city = '北京' } = req.query;
        
        const attractionsData = {
            '北京': [
                { name: '故宫', rating: 4.8, type: '历史文化', price: 60, duration: '4-6小时', coordinates: [39.9163, 116.3972] },
                { name: '长城', rating: 4.9, type: '世界遗产', price: 45, duration: '全天', coordinates: [40.4319, 116.5704] },
                { name: '天安门', rating: 4.7, type: '地标建筑', price: 0, duration: '1-2小时', coordinates: [39.9042, 116.4074] },
                { name: '颐和园', rating: 4.6, type: '皇家园林', price: 30, duration: '3-4小时', coordinates: [39.9999, 116.2755] }
            ],
            '上海': [
                { name: '外滩', rating: 4.8, type: '城市景观', price: 0, duration: '2-3小时', coordinates: [31.2397, 121.4998] },
                { name: '东方明珠', rating: 4.5, type: '现代建筑', price: 160, duration: '2-3小时', coordinates: [31.2397, 121.4998] },
                { name: '豫园', rating: 4.4, type: '古典园林', price: 40, duration: '2-3小时', coordinates: [31.2277, 121.4887] }
            ]
        };

        const attractions = attractionsData[city] || attractionsData['北京'];
        
        res.json({
            success: true,
            city,
            attractions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '获取景点数据失败'
        });
    }
});

// 酒店价格路由
router.get('/hotel-prices', (req, res) => {
    try {
        const { city = '北京' } = req.query;
        
        const hotelData = {
            '北京': { average: 450, range: '300-800', luxury: 1200, budget: 200 },
            '上海': { average: 520, range: '350-900', luxury: 1500, budget: 250 },
            '深圳': { average: 380, range: '250-650', luxury: 1000, budget: 180 }
        };

        const prices = hotelData[city] || hotelData['北京'];
        
        res.json({
            success: true,
            city,
            prices
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '获取酒店价格失败'
        });
    }
});

// 天气信息路由
router.get('/weather', (req, res) => {
    try {
        const { city = '北京' } = req.query;
        
        // 根据城市生成不同的模拟天气数据
        const cityWeatherData = {
            '北京': { baseTemp: 15, conditions: ['晴', '多云', '阴'] },
            '上海': { baseTemp: 18, conditions: ['晴', '多云', '小雨'] },
            '深圳': { baseTemp: 22, conditions: ['晴', '多云', '雷阵雨'] },
            '杭州': { baseTemp: 16, conditions: ['晴', '多云', '小雨'] },
            '成都': { baseTemp: 14, conditions: ['阴', '多云', '小雨'] },
            '广州': { baseTemp: 20, conditions: ['晴', '多云', '雷阵雨'] },
            '南京': { baseTemp: 17, conditions: ['晴', '多云', '阴'] },
            '武汉': { baseTemp: 16, conditions: ['晴', '多云', '小雨'] }
        };
        
        const cityData = cityWeatherData[city] || cityWeatherData['北京'];
        const temperature = Math.round(cityData.baseTemp + (Math.random() - 0.5) * 10);
        const condition = cityData.conditions[Math.floor(Math.random() * cityData.conditions.length)];
        
        const weatherData = {
            temperature,
            condition,
            humidity: Math.round(40 + Math.random() * 40),
            wind: Math.round(1 + Math.random() * 5),
            airQuality: ['优', '良', '轻度污染'][Math.floor(Math.random() * 3)],
            uvIndex: ['低', '中等', '高'][Math.floor(Math.random() * 3)],
            pressure: Math.round(1000 + Math.random() * 30),
            windDirection: ['北风', '南风', '东风', '西风', '东北风', '西南风'][Math.floor(Math.random() * 6)]
        };
        
        res.json({
            success: true,
            city,
            weather: weatherData,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '获取天气信息失败'
        });
    }
});

// 新增金融API路由 - 支持个性化投资组合功能

// 市场概览API
router.get('/financial/market-summary', (req, res) => {
    try {
        const marketData = {
            shanghaiIndex: (3245.67 + (Math.random() - 0.5) * 50).toFixed(2),
            shanghaiChange: (Math.random() - 0.5) * 30,
            shanghaiChangePercent: ((Math.random() - 0.5) * 2).toFixed(2),
            shenzhenIndex: (10567.89 + (Math.random() - 0.5) * 100).toFixed(2),
            shenzhenChange: (Math.random() - 0.5) * 50,
            shenzhenChangePercent: ((Math.random() - 0.5) * 2).toFixed(2),
            chinextIndex: (2156.78 + (Math.random() - 0.5) * 30).toFixed(2),
            chinextChange: (Math.random() - 0.5) * 20,
            chinextChangePercent: ((Math.random() - 0.5) * 3).toFixed(2),
            usdCny: (7.2345 + (Math.random() - 0.5) * 0.1).toFixed(4),
            usdCnyChange: (Math.random() - 0.5) * 0.05,
            timestamp: new Date().toISOString()
        };
        
        res.json({
            success: true,
            data: marketData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '获取市场概览失败'
        });
    }
});

// 理财产品API
router.get('/financial/products', (req, res) => {
    try {
        // 使用外部数据文件
        const products = financialProducts;
        
        res.json({
            success: true,
            products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '获取理财产品失败'
        });
    }
});

// 贷款产品API
router.get('/financial/loans', (req, res) => {
    try {
        const loans = [
            {
                name: '个人消费贷',
                rate: '5.8%',
                amount: '最高50万',
                term: '最长5年',
                features: ['无抵押', '快速审批', '用途灵活']
            },
            {
                name: '房屋抵押贷',
                rate: '4.2%',
                amount: '最高500万',
                term: '最长30年',
                features: ['低利率', '长期限', '灵活还款']
            },
            {
                name: '企业经营贷',
                rate: '6.5%',
                amount: '最高1000万',
                term: '最长10年',
                features: ['大额度', '专业服务', '支持企业发展']
            }
        ];
        
        res.json({
            success: true,
            loans
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '获取贷款产品失败'
        });
    }
});

// 投资建议API
router.get('/financial/advice', (req, res) => {
    try {
        const advice = {
            general: '当前市场处于震荡期，建议分散投资，关注科技、消费、医疗等成长性行业。',
            recommendations: [
                '可考虑配置30%债券基金，40%股票基金',
                '建议定期定投，降低市场波动风险',
                '关注政策利好板块，如新能源、人工智能',
                '保持适当现金储备，应对市场变化'
            ],
            riskWarning: '投资有风险，入市需谨慎。请根据自身风险承受能力选择合适的产品。'
        };
        
        res.json({
            success: true,
            advice
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '获取投资建议失败'
        });
    }
});

// 风险评估API
router.get('/financial/risk-assessment', (req, res) => {
    try {
        const riskData = {
            riskLevel: '中等',
            riskScore: 65,
            description: '您属于平衡型投资者，可以承受适中的风险，建议采用稳健与成长并重的投资策略。',
            recommendations: [
                '建议配置40%稳健型产品',
                '可适当配置30%成长型产品',
                '保留20%现金或货币基金',
                '定期调整投资组合比例'
            ]
        };
        
        res.json({
            success: true,
            data: riskData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '获取风险评估失败'
        });
    }
});

// 投资组合API
router.get('/financial/portfolio', (req, res) => {
    try {
        const portfolio = {
            totalValue: 300000,
            todayReturn: 1200,
            todayReturnPercent: 0.4,
            assets: [
                { name: '股票基金', percentage: 40, value: 120000, change: '+2.5%' },
                { name: '债券基金', percentage: 30, value: 90000, change: '+1.2%' },
                { name: '货币基金', percentage: 20, value: 60000, change: '+0.8%' },
                { name: '其他投资', percentage: 10, value: 30000, change: '-0.5%' }
            ]
        };
        
        res.json({
            success: true,
            portfolio
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '获取投资组合失败'
        });
    }
});

// 市场新闻API
router.get('/financial/news', (req, res) => {
    try {
        const news = [
            {
                title: '央行降准释放流动性，市场情绪乐观',
                summary: '央行宣布降准0.5个百分点，释放长期流动性约1万亿元，有利于稳定市场预期。',
                time: '2小时前',
                category: '货币政策'
            },
            {
                title: '科技股领涨，创业板指数创新高',
                summary: '人工智能、新能源等科技板块表现强劲，带动创业板指数上涨2.3%。',
                time: '4小时前',
                category: '市场动态'
            },
            {
                title: '外资持续流入，A股配置价值凸显',
                summary: '北向资金连续5日净流入，累计净买入超过200亿元，显示外资对A股信心增强。',
                time: '6小时前',
                category: '资金流向'
            },
            {
                title: '政策利好频出，消费板块有望复苏',
                summary: '国家出台多项促消费政策，消费板块估值修复，建议关注优质消费龙头。',
                time: '8小时前',
                category: '行业分析'
            },
            {
                title: '新能源车销量创新高，产业链受益',
                summary: '11月新能源车销量同比增长35%，相关产业链公司业绩有望持续改善。',
                time: '10小时前',
                category: '行业动态'
            }
        ];
        
        res.json({
            success: true,
            news
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '获取市场新闻失败'
        });
    }
});

// 财务健康检查API
router.get('/financial/health-check', (req, res) => {
    try {
        const healthData = {
            healthScore: 85,
            scoreBreakdown: {
                emergencyFund: 90,
                debtRatio: 80,
                investmentDiversification: 85,
                insuranceCoverage: 75,
                retirementPlanning: 90
            },
            recommendations: [
                '建议增加应急储备金至6个月生活费',
                '考虑增加长期投资比例',
                '定期调整投资组合配置',
                '关注税务优化机会',
                '完善保险保障体系'
            ],
            strengths: [
                '应急储备充足',
                '投资组合多样化',
                '退休规划完善'
            ],
            improvements: [
                '优化债务结构',
                '增加保险保障',
                '提高投资收益率'
            ]
        };
        
        res.json({
            success: true,
            data: healthData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '获取财务健康检查失败'
        });
    }
});

// 社交化投资API
router.get('/financial/social', (req, res) => {
    try {
        const socialData = {
            stats: {
                totalUsers: 12580,
                activeStrategies: 342,
                averageReturn: 8.5,
                topStrategy: '价值投资组合'
            },
            topStrategies: [
                {
                    name: '价值投资组合',
                    return: 12.5,
                    risk: '中等',
                    followers: 1250,
                    description: '专注于被低估的优质公司'
                },
                {
                    name: '成长股策略',
                    return: 15.2,
                    risk: '高',
                    followers: 980,
                    description: '投资高成长潜力的科技公司'
                },
                {
                    name: '稳健收益组合',
                    return: 6.8,
                    risk: '低',
                    followers: 2100,
                    description: '追求稳定收益的保守策略'
                }
            ],
            community: {
                activeUsers: 3420,
                dailyPosts: 156,
                weeklyGrowth: 5.2
            }
        };
        
        res.json({
            success: true,
            data: socialData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '获取社交化投资数据失败'
        });
    }
});

// 智能旅游服务中心API
router.get('/tourism/smart-center', (req, res) => {
    try {
        const { city = '北京' } = req.query;
        
        const smartCenterData = {
            transportation: {
                alerts: [
                    '地铁1号线天安门东站临时关闭，请选择其他站点',
                    '二环路东段拥堵，建议绕行三环路'
                ],
                publicTransport: [
                    {
                        name: '地铁1号线',
                        icon: '🚇',
                        status: 'delay',
                        statusText: '延误5分钟',
                        operatingHours: '05:30-23:30',
                        fare: '¥3-9',
                        estimatedTime: '25分钟',
                        crowdLevel: '拥挤'
                    },
                    {
                        name: '地铁2号线',
                        icon: '🚇',
                        status: 'normal',
                        statusText: '正常运行',
                        operatingHours: '05:30-23:30',
                        fare: '¥3-9',
                        estimatedTime: '20分钟',
                        crowdLevel: '适中'
                    }
                ]
            },
            foods: [
                { name: '北京烤鸭', location: '全聚德', price: '¥200-300', rating: '4.8分' },
                { name: '炸酱面', location: '老北京炸酱面', price: '¥25-35', rating: '4.5分' },
                { name: '豆汁', location: '护国寺小吃', price: '¥5-10', rating: '4.2分' },
                { name: '涮羊肉', location: '东来顺', price: '¥80-120', rating: '4.6分' }
            ],
            guide: {
                bestTime: '4-5月，9-10月',
                duration: '3-5天',
                attractions: '故宫、长城',
                food: '烤鸭、炸酱面',
                shopping: '王府井、三里屯'
            },
            financial: {
                products: [
                    { name: '智游信用卡', type: '信用卡', desc: '专为旅行者设计', benefits: ['2倍积分', '机场贵宾厅', '旅行保险'], badge: '推荐' },
                    { name: '旅行保险', type: '保险', desc: '全年覆盖，全球理赔', benefits: ['全年覆盖', '全球理赔', '24小时服务'], badge: '热销' },
                    { name: '旅行基金', type: '基金', desc: '稳健投资，积累资金', benefits: ['年化6-8%', '风险可控', '灵活赎回'], badge: '新品' }
                ]
            }
        };
        
        res.json({
            success: true,
            data: smartCenterData,
            city: city,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '获取智能旅游服务中心数据失败'
        });
    }
});

// 旅游相关API
router.get('/tourism/transportation', (req, res) => {
    try {
        const { city = '北京' } = req.query;
        
        const transportData = {
            alerts: [
                '地铁1号线天安门东站临时关闭，请选择其他站点',
                '二环路东段拥堵，建议绕行三环路'
            ],
            publicTransport: [
                {
                    name: '地铁1号线',
                    icon: '🚇',
                    status: 'delay',
                    statusText: '延误5分钟',
                    operatingHours: '05:30-23:30',
                    fare: '¥3-9',
                    estimatedTime: '25分钟',
                    crowdLevel: '拥挤'
                },
                {
                    name: '地铁2号线',
                    icon: '🚇',
                    status: 'normal',
                    statusText: '正常运行',
                    operatingHours: '05:30-23:30',
                    fare: '¥3-9',
                    estimatedTime: '20分钟',
                    crowdLevel: '适中'
                }
            ]
        };
        
        res.json({
            success: true,
            transportation: transportData,
            city: city
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '获取交通信息失败'
        });
    }
});

router.get('/tourism/food', (req, res) => {
    try {
        const { city = '北京' } = req.query;
        
        const foods = [
            { name: '北京烤鸭', location: '全聚德', price: '¥200-300', rating: '4.8分' },
            { name: '炸酱面', location: '老北京炸酱面', price: '¥25-35', rating: '4.5分' },
            { name: '豆汁', location: '护国寺小吃', price: '¥5-10', rating: '4.2分' },
            { name: '涮羊肉', location: '东来顺', price: '¥80-120', rating: '4.6分' }
        ];
        
        res.json({
            success: true,
            foods: foods,
            city: city
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '获取美食推荐失败'
        });
    }
});

router.get('/tourism/guide', (req, res) => {
    try {
        const { city = '北京' } = req.query;
        
        const guide = {
            bestTime: '4-5月，9-10月',
            duration: '3-5天',
            attractions: '故宫、长城',
            food: '烤鸭、炸酱面',
            shopping: '王府井、三里屯'
        };
        
        res.json({
            success: true,
            guide: guide,
            city: city
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '获取旅游攻略失败'
        });
    }
});

router.get('/tourism/financial', (req, res) => {
    try {
        const { city = '北京' } = req.query;
        
        const products = [
            { name: '智游信用卡', type: '信用卡', desc: '专为旅行者设计', benefits: ['2倍积分', '机场贵宾厅', '旅行保险'], badge: '推荐' },
            { name: '旅行保险', type: '保险', desc: '全年覆盖，全球理赔', benefits: ['全年覆盖', '全球理赔', '24小时服务'], badge: '热销' },
            { name: '旅行基金', type: '基金', desc: '稳健投资，积累资金', benefits: ['年化6-8%', '风险可控', '灵活赎回'], badge: '新品' }
        ];
        
        res.json({
            success: true,
            products: products,
            city: city
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '获取金融产品失败'
        });
    }
});

// 酒店推荐API
router.get('/tourism/hotels', (req, res) => {
    try {
        const { city = '北京' } = req.query;
        
        const hotels = [
            {
                name: '北京饭店',
                district: '东城区',
                price: 800,
                rating: 4.5,
                distance: '0.5km',
                type: '豪华酒店',
                features: ['免费WiFi', '健身房', '商务中心', '停车场'],
                nearbyAttractions: [
                    { name: '天安门广场', distance: '0.3km', type: '历史景点' },
                    { name: '故宫博物院', distance: '0.5km', type: '文化景点' },
                    { name: '王府井步行街', distance: '0.8km', type: '购物景点' }
                ],
                nearbyFoods: [
                    { name: '全聚德烤鸭', distance: '0.2km', type: '传统美食' },
                    { name: '东来顺涮羊肉', distance: '0.4km', type: '火锅' },
                    { name: '护国寺小吃', distance: '0.6km', type: '北京小吃' }
                ],
                notes: ['需提前预订', '提供机场接送', '支持信用卡支付'],
                checkIn: '14:00',
                checkOut: '12:00',
                bankOffers: [
                    { bank: '智金银行', offer: '故宫联名酒店卡', discount: '房费8.5折', condition: '刷卡入住', relatedAttraction: '故宫博物院' },
                    { bank: '智金银行', offer: '天安门主题卡', discount: '免费升级房型', condition: '金卡客户', relatedAttraction: '天安门广场' },
                    { bank: '智金银行', offer: '王府井购物卡', discount: '购物返现5%', condition: '联名卡消费', relatedAttraction: '王府井步行街' },
                    { bank: '智金银行', offer: '全聚德联名卡', discount: '烤鸭套餐免费', condition: '酒店餐厅消费', relatedAttraction: '全聚德烤鸭' }
                ]
            },
            {
                name: '王府井希尔顿酒店',
                district: '东城区',
                price: 1200,
                rating: 4.8,
                distance: '0.8km',
                type: '国际连锁',
                features: ['免费WiFi', '游泳池', 'SPA中心', '24小时客房服务'],
                nearbyAttractions: [
                    { name: '王府井步行街', distance: '0.1km', type: '购物景点' },
                    { name: '天安门广场', distance: '0.8km', type: '历史景点' },
                    { name: '景山公园', distance: '1.2km', type: '公园景点' }
                ],
                nearbyFoods: [
                    { name: '王府井小吃街', distance: '0.1km', type: '美食街' },
                    { name: '东华门夜市', distance: '0.3km', type: '夜市' },
                    { name: '老北京炸酱面', distance: '0.5km', type: '面食' }
                ],
                notes: ['含早餐', '可延迟退房', '提供婴儿床'],
                checkIn: '15:00',
                checkOut: '11:00',
                bankOffers: [
                    { bank: '智金银行', offer: '王府井购物联名卡', discount: '房费9折', condition: '刷卡入住', relatedAttraction: '王府井步行街' },
                    { bank: '智金银行', offer: '天安门升旗卡', discount: '免费早餐', condition: '早起看升旗', relatedAttraction: '天安门广场' },
                    { bank: '智金银行', offer: '景山公园卡', discount: 'SPA服务8折', condition: '联名卡消费', relatedAttraction: '景山公园' },
                    { bank: '智金银行', offer: '小吃街美食卡', discount: '夜宵免费', condition: '酒店餐厅消费', relatedAttraction: '王府井小吃街' }
                ]
            },
            {
                name: '北京丽思卡尔顿酒店',
                district: '朝阳区',
                price: 1800,
                rating: 4.9,
                distance: '1.2km',
                type: '奢华酒店',
                features: ['免费WiFi', '米其林餐厅', '健身中心', '礼宾服务'],
                nearbyAttractions: [
                    { name: '三里屯', distance: '0.5km', type: '时尚商圈' },
                    { name: '朝阳公园', distance: '0.8km', type: '公园景点' },
                    { name: '798艺术区', distance: '2.0km', type: '艺术景点' }
                ],
                nearbyFoods: [
                    { name: '三里屯太古里', distance: '0.5km', type: '国际美食' },
                    { name: '工体美食街', distance: '0.8km', type: '美食街' },
                    { name: '国贸商城', distance: '1.5km', type: '高端餐饮' }
                ],
                notes: ['需提前确认', '提供管家服务', '支持外币兑换'],
                checkIn: '15:00',
                checkOut: '12:00',
                bankOffers: [
                    { bank: '智金银行', offer: '三里屯时尚卡', discount: '房费8折', condition: '刷卡入住', relatedAttraction: '三里屯' },
                    { bank: '智金银行', offer: '朝阳公园健身卡', discount: '健身房免费', condition: '金卡客户', relatedAttraction: '朝阳公园' },
                    { bank: '智金银行', offer: '798艺术卡', discount: '艺术展门票免费', condition: '联名卡消费', relatedAttraction: '798艺术区' },
                    { bank: '智金银行', offer: '米其林美食卡', discount: '餐厅消费9折', condition: '酒店餐厅消费', relatedAttraction: '三里屯太古里' }
                ]
            }
        ];
        
        res.json({
            success: true,
            hotels: hotels,
            city: city
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '获取酒店推荐失败'
        });
    }
});

// 景点信息API
router.get('/tourism/attractions', (req, res) => {
    try {
        const { city = '北京' } = req.query;
        
        const attractions = [
            {
                name: '故宫博物院',
                category: '历史文化',
                price: 60,
                rating: 4.8,
                distance: '1.2km',
                openTime: '08:30-17:00',
                bestTime: '春秋两季',
                bestSeason: '3-5月, 9-11月',
                discounts: ['学生票30元', '老人票30元', '儿童免费(6岁以下)'],
                bankOffers: [
                    { bank: '智金银行', offer: '故宫联名信用卡', discount: '门票9折', condition: '刷卡购票' },
                    { bank: '智金银行', offer: '文化主题储蓄卡', discount: '文创产品8.5折', condition: '新客户专享' },
                    { bank: '智金银行', offer: '文物保险', discount: '免费赠送', condition: '购票即送' },
                    { bank: '智金银行', offer: '故宫纪念币', discount: '限量版免费', condition: '金卡客户' }
                ],
                suitableAge: '全年龄段',
                duration: '3-4小时',
                features: ['世界文化遗产', '明清皇宫', '文物展览'],
                tips: ['建议提前预约', '避开节假日', '穿舒适鞋子']
            },
            {
                name: '长城',
                category: '世界遗产',
                price: 45,
                rating: 4.9,
                distance: '2.5km',
                openTime: '06:30-19:00',
                bestTime: '早晨或傍晚',
                bestSeason: '4-10月',
                discounts: ['学生票25元', '老人票25元', '儿童免费(1.2米以下)'],
                bankOffers: [
                    { bank: '智金银行', offer: '长城主题信用卡', discount: '门票8.5折', condition: '首次办卡' },
                    { bank: '智金银行', offer: '登山运动保险', discount: '免费赠送', condition: '购票即送' },
                    { bank: '智金银行', offer: '长城纪念卡', discount: '缆车票5折', condition: '金卡客户' },
                    { bank: '智金银行', offer: '户外装备分期', discount: '0手续费', condition: '分期购买' }
                ],
                suitableAge: '6岁以上',
                duration: '2-3小时',
                features: ['世界文化遗产', '古代军事防御', '登山健身'],
                tips: ['穿运动鞋', '带足饮水', '注意安全']
            },
            {
                name: '天安门广场',
                category: '地标建筑',
                price: 0,
                rating: 4.7,
                distance: '0.8km',
                openTime: '05:00-22:00',
                bestTime: '升旗仪式时',
                bestSeason: '全年',
                discounts: ['完全免费'],
                bankOffers: [
                    { bank: '智金银行', offer: '爱国主题信用卡', discount: '纪念品9折', condition: '刷卡消费' },
                    { bank: '智金银行', offer: '升旗仪式VIP卡', discount: '优先位置', condition: '金卡客户' },
                    { bank: '智金银行', offer: '爱国基金', discount: '捐款返现', condition: '公益捐款' },
                    { bank: '智金银行', offer: '国旗护卫队联名卡', discount: '升旗仪式门票', condition: '限量发行' }
                ],
                suitableAge: '全年龄段',
                duration: '1-2小时',
                features: ['国家象征', '升旗仪式', '人民英雄纪念碑'],
                tips: ['升旗时间随季节变化', '需携带身份证', '安检严格']
            },
            {
                name: '颐和园',
                category: '皇家园林',
                price: 30,
                rating: 4.6,
                distance: '3.2km',
                openTime: '06:30-18:00',
                bestTime: '上午或下午',
                bestSeason: '4-10月',
                discounts: ['学生票15元', '老人票15元', '儿童免费(6岁以下)'],
                bankOffers: [
                    { bank: '智金银行', offer: '皇家园林信用卡', discount: '门票8折', condition: '新客户专享' },
                    { bank: '智金银行', offer: '游船套餐卡', discount: '买一送一', condition: '联名卡' },
                    { bank: '智金银行', offer: '文化基金', discount: '文创9折', condition: '文化消费' },
                    { bank: '智金银行', offer: '昆明湖游船卡', discount: '游船票7折', condition: '金卡客户' }
                ],
                suitableAge: '全年龄段',
                duration: '2-3小时',
                features: ['皇家园林', '昆明湖', '万寿山'],
                tips: ['可租船游湖', '园内较大需步行', '春秋景色最美']
            },
            {
                name: '天坛公园',
                category: '古建筑',
                price: 15,
                rating: 4.5,
                distance: '2.8km',
                openTime: '06:00-22:00',
                bestTime: '早晨',
                bestSeason: '4-10月',
                discounts: ['学生票8元', '老人票8元', '儿童免费(6岁以下)'],
                bankOffers: [
                    { bank: '智金银行', offer: '古建筑主题卡', discount: '门票7.5折', condition: '首次使用' },
                    { bank: '智金银行', offer: '祈福基金', discount: '香火免费', condition: '祈福消费' },
                    { bank: '智金银行', offer: '文化体验卡', discount: '导游免费', condition: '文化卡' },
                    { bank: '智金银行', offer: '回音壁体验卡', discount: '特殊体验', condition: 'VIP客户' }
                ],
                suitableAge: '全年龄段',
                duration: '1-2小时',
                features: ['古代祭天建筑', '回音壁', '祈年殿'],
                tips: ['早晨有晨练', '回音壁需体验', '古建筑群壮观']
            }
        ];
        
        res.json({
            success: true,
            attractions: attractions,
            city: city
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '获取景点信息失败'
        });
    }
});

// 天气信息API
router.get('/tourism/weather', (req, res) => {
    try {
        const { city = '北京' } = req.query;
        
        const weatherData = {
            current: {
                temperature: 22,
                description: '晴',
                humidity: 65,
                windSpeed: 12,
                visibility: 10,
                uvIndex: 6,
                pressure: 1013,
                feelsLike: 24,
                airQuality: '良',
                aqi: 85
            },
            forecast7Days: [
                { day: '今天', date: '9/29', temp: '22°C', high: '26°C', low: '18°C', desc: '晴', precipitation: 0, windSpeed: 12, humidity: 65 },
                { day: '明天', date: '9/30', temp: '25°C', high: '28°C', low: '20°C', desc: '多云', precipitation: 20, windSpeed: 15, humidity: 70 },
                { day: '后天', date: '10/1', temp: '20°C', high: '23°C', low: '16°C', desc: '小雨', precipitation: 80, windSpeed: 18, humidity: 85 },
                { day: '周三', date: '10/2', temp: '18°C', high: '21°C', low: '14°C', desc: '阴', precipitation: 30, windSpeed: 10, humidity: 75 },
                { day: '周四', date: '10/3', temp: '23°C', high: '26°C', low: '19°C', desc: '晴', precipitation: 5, windSpeed: 8, humidity: 60 },
                { day: '周五', date: '10/4', temp: '26°C', high: '29°C', low: '22°C', desc: '多云', precipitation: 15, windSpeed: 12, humidity: 68 },
                { day: '周六', date: '10/5', temp: '24°C', high: '27°C', low: '20°C', desc: '晴', precipitation: 0, windSpeed: 10, humidity: 62 }
            ],
            forecast15Days: [
                { day: '今天', date: '9/29', temp: '22°C', high: '26°C', low: '18°C', desc: '晴', precipitation: 0, windSpeed: 12 },
                { day: '明天', date: '9/30', temp: '25°C', high: '28°C', low: '20°C', desc: '多云', precipitation: 20, windSpeed: 15 },
                { day: '后天', date: '10/1', temp: '20°C', high: '23°C', low: '16°C', desc: '小雨', precipitation: 80, windSpeed: 18 },
                { day: '周三', date: '10/2', temp: '18°C', high: '21°C', low: '14°C', desc: '阴', precipitation: 30, windSpeed: 10 },
                { day: '周四', date: '10/3', temp: '23°C', high: '26°C', low: '19°C', desc: '晴', precipitation: 5, windSpeed: 8 },
                { day: '周五', date: '10/4', temp: '26°C', high: '29°C', low: '22°C', desc: '多云', precipitation: 15, windSpeed: 12 },
                { day: '周六', date: '10/5', temp: '24°C', high: '27°C', low: '20°C', desc: '晴', precipitation: 0, windSpeed: 10 },
                { day: '周日', date: '10/6', temp: '21°C', high: '24°C', low: '17°C', desc: '多云', precipitation: 25, windSpeed: 14 },
                { day: '周一', date: '10/7', temp: '19°C', high: '22°C', low: '15°C', desc: '小雨', precipitation: 60, windSpeed: 16 },
                { day: '周二', date: '10/8', temp: '17°C', high: '20°C', low: '13°C', desc: '阴', precipitation: 40, windSpeed: 12 },
                { day: '周三', date: '10/9', temp: '20°C', high: '23°C', low: '16°C', desc: '晴', precipitation: 10, windSpeed: 9 },
                { day: '周四', date: '10/10', temp: '24°C', high: '27°C', low: '19°C', desc: '晴', precipitation: 0, windSpeed: 11 },
                { day: '周五', date: '10/11', temp: '26°C', high: '29°C', low: '21°C', desc: '多云', precipitation: 20, windSpeed: 13 },
                { day: '周六', date: '10/12', temp: '23°C', high: '26°C', low: '18°C', desc: '晴', precipitation: 5, windSpeed: 10 },
                { day: '周日', date: '10/13', temp: '21°C', high: '24°C', low: '17°C', desc: '多云', precipitation: 30, windSpeed: 15 }
            ],
            hourly: [
                { hour: '00:00', temp: '18°C', desc: '晴', humidity: 70 },
                { hour: '03:00', temp: '16°C', desc: '晴', humidity: 75 },
                { hour: '06:00', temp: '15°C', desc: '晴', humidity: 80 },
                { hour: '09:00', temp: '19°C', desc: '晴', humidity: 65 },
                { hour: '12:00', temp: '22°C', desc: '晴', humidity: 60 },
                { hour: '15:00', temp: '24°C', desc: '晴', humidity: 55 },
                { hour: '18:00', temp: '21°C', desc: '晴', humidity: 65 },
                { hour: '21:00', temp: '19°C', desc: '晴', humidity: 70 }
            ],
            clothing: {
                recommendation: '薄外套+长裤',
                details: '早晚温差较大，建议穿薄外套，中午可脱掉外套',
                comfort: '舒适',
                uvProtection: '需要防晒',
                umbrella: '不需要'
            },
            drivingGuide: {
                roadConditions: '道路状况良好，无积水',
                visibility: '能见度10公里，适合驾驶',
                temperature: '温度适宜，车内建议保持22-24°C',
                windSpeed: '风力12km/h，对驾驶影响较小',
                recommendations: [
                    '建议使用空调保持舒适温度',
                    '注意防晒，建议佩戴太阳镜',
                    '道路干燥，可正常行驶',
                    '建议避开12:00-14:00高温时段'
                ],
                safetyTips: [
                    '保持安全车距，注意前方车辆',
                    '定期检查轮胎气压和磨损情况',
                    '携带充足饮用水和应急物品',
                    '遵守交通规则，文明驾驶'
                ],
                fuelConsumption: '当前天气条件下，油耗正常，建议保持经济时速行驶'
            }
        };
        
        res.json({
            success: true,
            weather: weatherData,
            city: city
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: '获取天气信息失败'
        });
    }
});

// 健康检查路由
router.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// AI使用统计接口
router.get('/ai/usage-stats', aiController.getUsageStats);

// AI建议历史接口
router.get('/ai/advice-history', aiController.getAdviceHistory);

// AI语音聊天接口
router.post('/ai/voice-chat', aiController.voiceChat);

// 优惠活动接口
router.get('/promotion/offers', (req, res) => {
    try {
        // 使用外部数据文件

        res.json({
            success: true,
            promotions: promotions,
            total: promotions.length
        });
    } catch (error) {
        console.error('获取优惠活动失败:', error);
        res.status(500).json({
            success: false,
            error: '获取优惠活动失败'
        });
    }
});

module.exports = router;
