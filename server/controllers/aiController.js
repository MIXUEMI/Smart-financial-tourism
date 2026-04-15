// AI控制器 - 处理DeepSeek API请求
const OpenAI = require('openai');
const config = require('../config');

// 初始化OpenAI客户端（兼容DeepSeek API）
const openai = new OpenAI({
    baseURL: config.deepseek.baseUrl,
    apiKey: config.deepseek.apiKey,
});

class AIController {
    // 处理AI聊天请求
    async chat(req, res) {
        try {
            const { message, context = {}, voiceMode = false } = req.body;
            
            if (!message || message.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    error: '消息内容不能为空'
                });
            }

            // 检查API密钥
            if (!config.deepseek.apiKey) {
                console.warn('DeepSeek API密钥未配置，使用模拟响应');
                return this.getMockResponse(message, voiceMode, res);
            }

            // 构建系统提示
            const systemPrompt = `你是一个专业的金融旅游AI助手，能够为用户提供金融和旅游相关的专业建议。你的特点：
1. 专业性强：在金融和旅游领域有丰富的知识
2. 服务导向：始终以用户需求为中心
3. 安全可靠：不会提供投资建议，只提供信息参考
4. 个性化：根据用户情况提供定制化建议
5. 语音友好：如果用户使用语音交互，回答要简洁明了，适合语音播放

请用中文回答，语言要专业但易懂，回答要简洁明了。${voiceMode ? '回答要简短，适合语音播放。' : ''}`;
            
            // 调用DeepSeek API
            const completion = await openai.chat.completions.create({
                model: config.deepseek.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message }
                ],
                max_tokens: voiceMode ? 500 : config.deepseek.maxTokens,
                temperature: config.deepseek.temperature,
                stream: false
            });

            const response = completion.choices[0].message.content;
            
            res.json({
                success: true,
                response: response,
                voiceMode: voiceMode,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('AI聊天错误:', error);
            
            // 如果API调用失败，返回模拟响应
            if (error.status === 401 || error.status === 403) {
                console.warn('API密钥无效或权限不足，使用模拟响应');
                return this.getMockResponse(req.body.message, req.body.voiceMode || false, res);
            }
            
            res.status(500).json({
                success: false,
                error: 'AI服务暂时不可用，请稍后重试',
                details: config.nodeEnv === 'development' ? error.message : undefined
            });
        }
    }

    // 获取模拟响应
    getMockResponse(message, voiceMode, res) {
        let response = '';
        
        if (message.includes('理财') || message.includes('投资')) {
            response = '根据您的需求，我推荐以下理财产品：1. 货币基金，风险低，收益稳定；2. 债券基金，风险中等，收益较好；3. 股票基金，风险较高，收益潜力大。建议根据您的风险承受能力选择。';
        } else if (message.includes('旅游') || message.includes('景点')) {
            response = '关于旅游建议：这里有很多值得一游的景点，建议您提前规划行程，关注天气情况，选择合适的住宿。我可以为您提供更详细的旅游攻略。';
        } else if (message.includes('天气')) {
            response = '当前天气情况良好，适合出行。建议您关注实时天气变化，做好相应的准备。';
        } else if (message.includes('贷款') || message.includes('信用卡')) {
            response = '关于贷款和信用卡的问题，建议您直接联系银行客服，他们可以为您提供最新的产品信息和申请条件。';
        } else {
            response = '感谢您的咨询！我是您的金融旅游AI助手，可以为您提供理财建议、旅游攻略、天气信息等服务。请告诉我您需要什么帮助？';
        }

        if (voiceMode && response.length > 100) {
            response = response.substring(0, 100) + '...';
        }

        res.json({
            success: true,
            response: response,
            voiceMode: voiceMode,
            mockResponse: true,
            timestamp: new Date().toISOString()
        });
    }

    // 获取模拟金融响应
    getMockFinancialResponse(query, res) {
        let response = '';
        
        if (query.includes('风险评估') || query.includes('风险承受')) {
            response = '根据您的年龄和收入情况，建议您选择中等风险的投资组合。建议配置：40%货币基金，30%债券基金，20%混合基金，10%股票基金。这样可以平衡收益与风险。';
        } else if (query.includes('投资组合') || query.includes('资产配置')) {
            response = '基于您的风险偏好，我推荐以下投资组合：货币基金20%（流动性），债券基金30%（稳健收益），混合基金25%（平衡增长），股票基金25%（长期增值）。预期年化收益约6.5%。';
        } else if (query.includes('旅游理财') || query.includes('旅行基金')) {
            response = '针对旅游需求，建议您：1. 设立专门的旅游基金账户；2. 选择短期理财产品确保资金流动性；3. 申请旅游信用卡享受消费优惠；4. 购买旅行保险保障安全。';
        } else {
            response = '感谢您的金融咨询！我建议您根据自身风险承受能力选择合适的理财产品，同时做好资产配置和风险控制。如需更详细的建议，请提供更多个人信息。';
        }

        res.json({
            success: true,
            response: response,
            type: 'financial',
            mockResponse: true,
            timestamp: new Date().toISOString()
        });
    }

    // 获取模拟旅游响应
    getMockTourismResponse(query, destination, res) {
        let response = '';
        
        if (destination === '北京') {
            response = `🏛️ ${destination} 旅游推荐

必游景点：
• 故宫博物院 - 明清两代皇宫，世界文化遗产
• 天安门广场 - 世界上最大的城市广场
• 八达岭长城 - 万里长城最著名的一段
• 颐和园 - 中国古典园林之首

美食推荐：
• 北京烤鸭 - 全聚德、便宜坊
• 炸酱面 - 老北京传统面食
• 豆汁焦圈 - 地道北京早餐
• 涮羊肉 - 东来顺、聚宝源

住宿建议：
• 王府井地区 - 交通便利，购物方便
• 三里屯地区 - 时尚潮流，夜生活丰富
• 朝阳区 - 商务酒店集中，设施完善

交通指南：
• 地铁 - 1-10号线覆盖主要景点
• 公交 - 票价便宜，线路密集
• 出租车 - 起步价13元，注意限行

最佳旅游时间：4-5月，9-10月`;
        } else if (destination === '上海') {
            response = `🌆 ${destination} 旅游推荐

必游景点：
• 外滩 - 万国建筑博览群
• 东方明珠 - 上海地标建筑
• 豫园 - 江南古典园林
• 田子坊 - 创意文化街区

美食推荐：
• 小笼包 - 南翔小笼、鼎泰丰
• 生煎包 - 大壶春、小杨生煎
• 本帮菜 - 老正兴、德兴馆
• 海派西餐 - 红房子西菜馆

住宿建议：
• 外滩地区 - 江景房，夜景优美
• 南京路 - 购物便利，交通发达
• 浦东新区 - 现代化酒店，商务首选

交通指南：
• 地铁 - 1-18号线连接主要区域
• 公交 - 线路密集，覆盖全市
• 出租车 - 起步价14元

最佳旅游时间：3-5月，9-11月`;
        } else {
            response = `🏛️ ${destination} 旅游推荐

必游景点：
• 当地著名景点1 - 历史文化景点
• 当地著名景点2 - 自然风光景点
• 当地著名景点3 - 现代建筑景点

美食推荐：
• 当地特色菜1 - 传统美食
• 当地特色菜2 - 地方小吃
• 当地特色菜3 - 特色饮品

住宿建议：
• 市中心区域 - 交通便利
• 景区附近 - 风景优美
• 商务区 - 设施完善

交通指南：
• 公共交通 - 经济实惠
• 出租车 - 方便快捷
• 自驾游 - 自由灵活

最佳旅游时间：春秋两季`;
        }

        res.json({
            success: true,
            response: response,
            type: 'tourism',
            mockResponse: true,
            timestamp: new Date().toISOString()
        });
    }

    // 获取默认系统提示
    getDefaultSystemPrompt(context) {
        return `你是一个专业的金融旅游AI助手，能够为用户提供金融和旅游相关的专业建议。你的特点：
1. 专业性强：在金融和旅游领域有丰富的知识
2. 服务导向：始终以用户需求为中心
3. 安全可靠：不会提供投资建议，只提供信息参考
4. 个性化：根据用户情况提供定制化建议

请用中文回答，语言要专业但易懂，回答要简洁明了。`;
    }

    // 构建系统提示
    buildSystemPrompt(context, userMessage = '') {
        const basePrompt = `你是一个专业的金融旅游AI助手，能够为用户提供金融和旅游相关的专业建议。你的特点：
1. 专业性强：在金融和旅游领域有丰富的知识
2. 服务导向：始终以用户需求为中心
3. 安全可靠：不会提供投资建议，只提供信息参考
4. 个性化：根据用户情况提供定制化建议

请用中文回答，语言要专业但易懂，回答要简洁明了。`;

        // 检测场景化意图
        let intentPrompt = '';
        if (userMessage.includes('预算') || userMessage.includes('预算诊断')) {
            intentPrompt = `\n\n当前用户进行预算诊断咨询，请重点关注：
- 分析用户预算的合理性
- 提供预算优化建议
- 推荐适合的理财产品和优惠
- 给出具体的省钱技巧和投资建议`;
        } else if (userMessage.includes('权益') || userMessage.includes('权益策略')) {
            intentPrompt = `\n\n当前用户咨询权益策略，请重点关注：
- 推荐最适合的金融权益
- 分析优惠活动的性价比
- 提供权益组合建议
- 解释如何最大化权益价值`;
        } else if (userMessage.includes('焦虑') || userMessage.includes('情绪调理')) {
            intentPrompt = `\n\n当前用户需要情绪疏导，请重点关注：
- 提供心理安慰和鼓励
- 分享理财和旅行的积极面
- 给出实用的减压建议
- 用温暖的语言建立信任`;
        }

        // 根据上下文类型添加特定提示
        switch (context.type) {
            case 'financial':
                return basePrompt + `\n\n当前用户咨询金融相关问题，请重点关注：
- 理财产品介绍和风险提示
- 贷款产品说明
- 投资基础知识普及
- 风险管理和资产配置建议` + intentPrompt;
                
            case 'tourism':
                return basePrompt + `\n\n当前用户咨询旅游相关问题，请重点关注：
- 景点推荐和介绍
- 旅游路线规划
- 住宿和交通建议
- 当地文化和美食推荐`;
                
            case 'combined':
                return basePrompt + `\n\n当前用户咨询金融与旅游结合的问题，请重点关注：
- 旅游相关的金融产品（如旅游信用卡、旅游保险）
- 旅游预算规划
- 金融优惠与旅游优惠的结合
- 投资理财与旅游消费的平衡`;
                
            case 'emergency':
                return basePrompt + `\n\n当前用户遇到紧急情况，请重点关注：
- 提供快速有效的解决方案
- 给出应急联系方式
- 提供安全建议和注意事项`;
                
            default:
                return basePrompt;
        }
    }

    // 获取金融建议
    async getFinancialAdvice(req, res) {
        try {
            const { query, userProfile = {} } = req.body;
            
            const context = {
                type: 'financial',
                userProfile: {
                    age: userProfile.age || 30,
                    income: userProfile.income || 'medium',
                    riskTolerance: userProfile.riskTolerance || 'moderate',
                    investmentGoal: userProfile.investmentGoal || 'wealth_growth'
                }
            };

            // 检查API密钥
            if (!config.deepseek.apiKey) {
                console.warn('DeepSeek API密钥未配置，使用模拟响应');
                return this.getMockFinancialResponse(query, res);
            }

            const systemPrompt = this.buildSystemPrompt(context, message);
            
            const completion = await openai.chat.completions.create({
                model: config.deepseek.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `用户信息：年龄${context.userProfile.age}岁，收入水平${context.userProfile.income}，风险偏好${context.userProfile.riskTolerance}，投资目标${context.userProfile.investmentGoal}。问题：${query}` }
                ],
                max_tokens: config.deepseek.maxTokens,
                temperature: config.deepseek.temperature
            });

            res.json({
                success: true,
                response: completion.choices[0].message.content,
                type: 'financial',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('金融建议错误:', error);
            res.status(500).json({
                success: false,
                error: '获取金融建议失败，请稍后重试'
            });
        }
    }

    // 获取旅游建议
    async getTourismAdvice(req, res) {
        try {
            const { query, destination = '', travelDates = '' } = req.body;
            
            const context = {
                type: 'tourism',
                destination,
                travelDates,
                preferences: {
                    budget: 'medium',
                    interests: ['culture', 'nature', 'food'],
                    groupSize: 2
                }
            };

            // 检查API密钥
            if (!config.deepseek.apiKey) {
                console.warn('DeepSeek API密钥未配置，使用模拟响应');
                return this.getMockTourismResponse(query, destination, res);
            }

            const systemPrompt = this.buildSystemPrompt(context, message);
            
            const completion = await openai.chat.completions.create({
                model: config.deepseek.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `目的地：${destination}，出行时间：${travelDates}。问题：${query}` }
                ],
                max_tokens: config.deepseek.maxTokens,
                temperature: config.deepseek.temperature
            });

            res.json({
                success: true,
                response: completion.choices[0].message.content,
                type: 'tourism',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('旅游建议错误:', error);
            res.status(500).json({
                success: false,
                error: '获取旅游建议失败，请稍后重试'
            });
        }
    }

    // 获取综合建议
    async getCombinedAdvice(req, res) {
        try {
            const { query, financialContext = {}, tourismContext = {} } = req.body;
            
            const context = {
                type: 'combined',
                financial: financialContext,
                tourism: tourismContext,
                integration: true
            };

            const systemPrompt = this.buildSystemPrompt(context, message);
            
            const completion = await openai.chat.completions.create({
                model: config.deepseek.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `金融背景：${JSON.stringify(financialContext)}，旅游背景：${JSON.stringify(tourismContext)}。问题：${query}` }
                ],
                max_tokens: config.deepseek.maxTokens,
                temperature: config.deepseek.temperature
            });

            res.json({
                success: true,
                response: completion.choices[0].message.content,
                type: 'combined',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('综合建议错误:', error);
            res.status(500).json({
                success: false,
                error: '获取综合建议失败，请稍后重试'
            });
        }
    }

    // 语音转文字
    async speechToText(req, res) {
        try {
            // 这里应该集成语音识别服务，如百度、讯飞等
            // 目前返回模拟数据
            const { audioData } = req.body;
            
            if (!audioData) {
                return res.status(400).json({
                    success: false,
                    error: '音频数据不能为空'
                });
            }

            // 模拟语音识别结果
            const mockTranscription = "我想了解一下理财产品";
            
            res.json({
                success: true,
                transcription: mockTranscription,
                confidence: 0.95,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('语音识别错误:', error);
            res.status(500).json({
                success: false,
                error: '语音识别服务暂时不可用'
            });
        }
    }

    // 文字转语音
    async textToSpeech(req, res) {
        try {
            const { text, voice = 'zh-CN-XiaoxiaoNeural' } = req.body;
            
            if (!text || text.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    error: '文本内容不能为空'
                });
            }

            // 这里应该集成TTS服务，如百度、讯飞等
            // 目前返回模拟数据
            const mockAudioUrl = `data:audio/wav;base64,${Buffer.from('mock audio data').toString('base64')}`;
            
            res.json({
                success: true,
                audioUrl: mockAudioUrl,
                duration: Math.ceil(text.length / 10), // 估算时长
                voice: voice,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('语音合成错误:', error);
            res.status(500).json({
                success: false,
                error: '语音合成服务暂时不可用'
            });
        }
    }

    // 关怀模式专用AI助手
    async careModeChat(req, res) {
        try {
            const { message, userAge = 65, voiceMode = true } = req.body;
            
            if (!message || message.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    error: '消息内容不能为空'
                });
            }

            // 关怀模式专用系统提示
            const careModePrompt = `你是一个专门为老年人服务的金融旅游AI助手。你的特点：
1. 语言简单易懂：用通俗的语言解释复杂概念
2. 耐心细致：详细回答每个问题，不厌其烦
3. 安全第一：特别强调风险提示和安全建议
4. 操作指导：提供详细的操作步骤
5. 情感关怀：语气温和，充满关怀
6. 语音友好：回答简短清晰，适合语音播放

用户年龄：${userAge}岁，请用温暖、耐心的语气回答，语言要简单明了。`;

            const completion = await openai.chat.completions.create({
                model: config.deepseek.model,
                messages: [
                    { role: 'system', content: careModePrompt },
                    { role: 'user', content: message }
                ],
                max_tokens: 300, // 关怀模式回答更简短
                temperature: 0.8, // 更温和的语气
                stream: false
            });

            const response = completion.choices[0].message.content;
            
            res.json({
                success: true,
                response: response,
                careMode: true,
                voiceMode: voiceMode,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('关怀模式AI聊天错误:', error);
            res.status(500).json({
                success: false,
                error: 'AI服务暂时不可用，请稍后重试'
            });
        }
    }

    // 健康检查
    async healthCheck(req, res) {
        try {
            // 测试DeepSeek API连接
            const testCompletion = await openai.chat.completions.create({
                model: config.deepseek.model,
                messages: [{ role: 'user', content: 'Hello' }],
                max_tokens: 10
            });

            res.json({
                success: true,
                status: 'healthy',
                deepseek: 'connected',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                status: 'unhealthy',
                deepseek: 'disconnected',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    // 获取使用统计
    async getUsageStats(req, res) {
        try {
            // 模拟使用统计数据
            const stats = {
                totalQuestions: Math.floor(Math.random() * 1000) + 500,
                todayQuestions: Math.floor(Math.random() * 50) + 20,
                averageResponseTime: '1.2秒',
                satisfactionRate: '95%',
                popularTopics: [
                    { topic: '理财产品', count: 156 },
                    { topic: '旅游推荐', count: 134 },
                    { topic: '风险评估', count: 98 },
                    { topic: '贷款咨询', count: 87 }
                ]
            };

            res.json({
                success: true,
                ...stats,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('获取使用统计失败:', error);
            res.status(500).json({
                success: false,
                error: '获取统计数据失败'
            });
        }
    }

    // 获取建议历史
    async getAdviceHistory(req, res) {
        try {
            // 模拟建议历史数据
            const history = [
                {
                    id: 1,
                    date: '2025-09-29',
                    topic: '北京旅游推荐',
                    summary: '推荐了故宫、长城等经典景点，并提供了智金银行相关优惠信息',
                    category: '旅游'
                },
                {
                    id: 2,
                    date: '2025-09-28',
                    topic: '理财产品咨询',
                    summary: '建议配置稳健型理财产品，年化收益4-6%',
                    category: '金融'
                },
                {
                    id: 3,
                    date: '2025-09-27',
                    topic: '风险评估',
                    summary: '进行了个人风险承受能力评估，建议保守型投资',
                    category: '金融'
                },
                {
                    id: 4,
                    date: '2025-09-26',
                    topic: '酒店预订',
                    summary: '推荐了北京饭店，并提供了智金银行酒店优惠信息',
                    category: '旅游'
                },
                {
                    id: 5,
                    date: '2025-09-25',
                    topic: '贷款咨询',
                    summary: '介绍了智金银行个人贷款产品，利率优惠',
                    category: '金融'
                }
            ];

            res.json({
                success: true,
                history: history,
                total: history.length,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('获取建议历史失败:', error);
            res.status(500).json({
                success: false,
                error: '获取历史记录失败'
            });
        }
    }

    // 语音聊天
    async voiceChat(req, res) {
        try {
            const { message, voiceMode = true } = req.body;
            
            if (!message || message.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    error: '语音消息内容不能为空'
                });
            }

            // 调用普通聊天接口，但启用语音模式
            req.body.voiceMode = true;
            return await this.chat(req, res);

        } catch (error) {
            console.error('语音聊天错误:', error);
            res.status(500).json({
                success: false,
                error: '语音服务暂时不可用，请稍后重试'
            });
        }
    }
}

module.exports = new AIController();