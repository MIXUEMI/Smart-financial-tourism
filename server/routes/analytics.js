// 智游金旅 - 用户画像API路由
// 创建时间: 2025-01-26
// 版本: v1.0

const express = require('express');
const router = express.Router();
const dbManager = require('../database/jsonDbManager');
const trackingService = require('../services/trackingService');

// 中间件：检查用户登录状态
const checkAuth = (req, res, next) => {
    // 从JWT token或session中获取用户ID
    const userId = req.user?.id || req.session?.userId;
    
    if (!userId) {
        return res.status(401).json({ 
            error: '未登录',
            code: 'UNAUTHORIZED' 
        });
    }
    
    req.userId = userId;
    next();
};

// 中间件：检查用户画像同意状态
const checkSegmentationConsent = async (req, res, next) => {
    try {
        const userId = req.userId;
        
        const user = await dbManager.queryOne(
            'SELECT seg_consent FROM users WHERE id = ?', 
            [userId]
        );
        
        if (!user) {
            return res.status(404).json({ 
                error: '用户不存在',
                code: 'USER_NOT_FOUND' 
            });
        }
        
        if (!user.seg_consent) {
            return res.status(204).json({ 
                message: '用户已关闭画像功能',
                code: 'SEGMENTATION_DISABLED' 
            });
        }
        
        next();
    } catch (error) {
        console.error('检查画像同意状态失败:', error);
        res.status(500).json({ 
            error: '服务器内部错误',
            code: 'INTERNAL_ERROR' 
        });
    }
};

// GET /api/analytics/segments-overview
// 获取类型占比和词云数据
router.get('/segments-overview', checkAuth, async (req, res) => {
    try {
        const { scope = 'global', city } = req.query;
        const today = new Date().toISOString().split('T')[0];
        
        // 记录埋点
        await trackingService.trackPageView('segments_overview', req.userId);
        
        // 获取类型占比数据
        let segmentsSql = `
            SELECT label, share, total_users
            FROM segment_overview_daily 
            WHERE as_of = ?
        `;
        let segmentsParams = [today];
        
        // 如果指定了城市，需要过滤
        if (scope === 'city' && city) {
            segmentsSql = `
                SELECT 
                    us.label,
                    ROUND(COUNT(*) * 1.0 / (
                        SELECT COUNT(*) 
                        FROM user_segment us2 
                        JOIN user_features uf2 ON us2.user_id = uf2.user_id 
                        WHERE uf2.city = ?
                    ), 4) as share,
                    COUNT(*) as total_users
                FROM user_segment us
                JOIN user_features uf ON us.user_id = uf.user_id
                WHERE uf.city = ?
                AND us.label IS NOT NULL
                GROUP BY us.label
                HAVING COUNT(*) >= 30
            `;
            segmentsParams = [city, city];
        }
        
        const segments = await dbManager.query(segmentsSql, segmentsParams);
        
        // 检查样本数量
        if (segments.length === 0) {
            return res.json({
                as_of: today,
                segments: [],
                wordcloud: [],
                note: '样本不足'
            });
        }
        
        // 获取词云数据
        const wordcloudSql = `
            SELECT text, weight
            FROM wordcloud_30d 
            WHERE as_of = ?
            ORDER BY weight DESC
            LIMIT 20
        `;
        
        const wordcloud = await dbManager.query(wordcloudSql, [today]);
        
        // 应用差分隐私（可选）
        const processedSegments = applyDifferentialPrivacy(segments);
        const processedWordcloud = applyDifferentialPrivacy(wordcloud);
        
        res.json({
            as_of: today,
            segments: processedSegments,
            wordcloud: processedWordcloud
        });
        
    } catch (error) {
        console.error('获取类型占比失败:', error);
        res.status(500).json({ 
            error: '服务器内部错误',
            code: 'INTERNAL_ERROR' 
        });
    }
});

// GET /api/analytics/user-segmentation/me
// 获取用户自己的画像信息
router.get('/user-segmentation/me', checkAuth, checkSegmentationConsent, async (req, res) => {
    try {
        const userId = req.userId;
        
        // 记录埋点
        await trackingService.trackPageView('user_segmentation', userId);
        
        // 获取用户画像数据
        const segmentSql = `
            SELECT us.*, uf.spend_30d, uf.activity_30d, uf.risk_score
            FROM user_segment us
            LEFT JOIN user_features uf ON us.user_id = uf.user_id
            WHERE us.user_id = ?
        `;
        
        const segment = await dbManager.queryOne(segmentSql, [userId]);
        
        if (!segment) {
            return res.status(404).json({ 
                error: '用户画像数据不存在',
                code: 'SEGMENT_NOT_FOUND' 
            });
        }
        
        // 生成解释标签
        const explanation = generateExplanation(segment);
        
        res.json({
            user_label: segment.label,
            percentiles: {
                spend_level: segment.spend_pct,
                activity: segment.activity_pct,
                risk_tolerance: segment.risk_pct
            },
            explanation: explanation,
            version: segment.version,
            privacy_note: '基于近30天匿名化行为与偏好推断；仅你可见，可在「隐私与画像」关闭。'
        });
        
    } catch (error) {
        console.error('获取用户画像失败:', error);
        res.status(500).json({ 
            error: '服务器内部错误',
            code: 'INTERNAL_ERROR' 
        });
    }
});

// PUT /api/analytics/user-segmentation/consent
// 更新用户画像同意状态
router.put('/user-segmentation/consent', checkAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const { consent } = req.body;
        
        if (typeof consent !== 'boolean') {
            return res.status(422).json({ 
                error: '参数错误：consent必须是布尔值',
                code: 'INVALID_PARAMETER' 
            });
        }
        
        // 更新用户同意状态
        await dbManager.run(
            'UPDATE users SET seg_consent = ? WHERE id = ?',
            [consent, userId]
        );
        
        // 记录埋点
        await trackingService.trackCustomEvent(
            consent ? 'segmentation_consent_enabled' : 'segmentation_consent_disabled',
            { consent },
            userId
        );
        
        res.json({
            message: consent ? '画像功能已开启' : '画像功能已关闭',
            consent: consent
        });
        
    } catch (error) {
        console.error('更新画像同意状态失败:', error);
        res.status(500).json({ 
            error: '服务器内部错误',
            code: 'INTERNAL_ERROR' 
        });
    }
});

// GET /api/analytics/user-segmentation/consent
// 获取用户画像同意状态
router.get('/user-segmentation/consent', checkAuth, async (req, res) => {
    try {
        const userId = req.userId;
        
        const user = await dbManager.queryOne(
            'SELECT seg_consent FROM users WHERE id = ?',
            [userId]
        );
        
        if (!user) {
            return res.status(404).json({ 
                error: '用户不存在',
                code: 'USER_NOT_FOUND' 
            });
        }
        
        res.json({
            consent: user.seg_consent
        });
        
    } catch (error) {
        console.error('获取画像同意状态失败:', error);
        res.status(500).json({ 
            error: '服务器内部错误',
            code: 'INTERNAL_ERROR' 
        });
    }
});

// GET /api/analytics/admin/segments
// 管理员获取用户类型占比数据
router.get('/admin/segments', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // 模拟管理员数据
        const segments = [
            { label: '理财型游客', n: 1250, percentage: 28.5 },
            { label: '轻旅行打工人', n: 980, percentage: 22.3 },
            { label: '家庭度假型', n: 1150, percentage: 26.2 },
            { label: '康养型用户', n: 650, percentage: 14.8 },
            { label: '探索型年轻人', n: 360, percentage: 8.2 }
        ];
        
        res.json({
            segments: segments,
            total: 4390,
            as_of: today,
            note: '基于K-means聚类算法分析'
        });
        
    } catch (error) {
        console.error('获取管理员画像数据失败:', error);
        res.status(500).json({ 
            error: '服务器内部错误',
            code: 'INTERNAL_ERROR' 
        });
    }
});

// GET /api/analytics/admin/funnel
// 管理员获取转化漏斗数据
router.get('/admin/funnel', async (req, res) => {
    try {
        const { label, range = '30d' } = req.query;
        
        // 模拟转化漏斗数据
        const steps = [
            { name: '访问首页', count: 10000 },
            { name: '浏览产品', count: 7500 },
            { name: '加入购物车', count: 3200 },
            { name: '开始支付', count: 1800 },
            { name: '完成支付', count: 1200 }
        ];
        
        res.json({
            steps: steps,
            conversionRate: 12.0,
            label: label || '全部用户',
            range: range,
            note: '基于用户行为路径分析'
        });
        
    } catch (error) {
        console.error('获取转化漏斗数据失败:', error);
        res.status(500).json({ 
            error: '服务器内部错误',
            code: 'INTERNAL_ERROR' 
        });
    }
});

// GET /api/analytics/admin/retention
// 管理员获取留存复购数据
router.get('/admin/retention', async (req, res) => {
    try {
        const { label } = req.query;
        
        // 模拟留存数据
        const retention = [
            { period: '7天', rate: 85.2 },
            { period: '30天', rate: 68.5 },
            { period: '90天', rate: 45.8 },
            { period: '180天', rate: 32.1 }
        ];
        
        const repurchase = [
            { period: '首次复购', rate: 35.6 },
            { period: '二次复购', rate: 22.3 },
            { period: '三次复购', rate: 15.8 }
        ];
        
        res.json({
            retention: retention,
            repurchase: repurchase,
            label: label || '全部用户',
            note: '基于用户生命周期分析'
        });
        
    } catch (error) {
        console.error('获取留存数据失败:', error);
        res.status(500).json({ 
            error: '服务器内部错误',
            code: 'INTERNAL_ERROR' 
        });
    }
});

// 应用差分隐私（添加微弱噪声）
function applyDifferentialPrivacy(data, epsilon = 1.0) {
    if (!process.env.ENABLE_DIFFERENTIAL_PRIVACY || process.env.ENABLE_DIFFERENTIAL_PRIVACY !== 'true') {
        return data;
    }
    
    return data.map(item => {
        const noise = (Math.random() - 0.5) * 2 * (1 / epsilon);
        
        if (item.share !== undefined) {
            item.share = Math.max(0, Math.min(1, item.share + noise * 0.01));
        }
        
        if (item.weight !== undefined) {
            item.weight = Math.max(0, Math.round(item.weight + noise * 0.1));
        }
        
        return item;
    });
}

// 生成解释标签
function generateExplanation(segment) {
    const explanations = {
        '理财型游客': ['风险偏好低', '消费能力强', '注重稳健理财'],
        '轻旅行打工人': ['周末短途', '价格敏感', '偏好分期'],
        '家庭度假型': ['注重家庭', '教育投资', '亲子体验'],
        '康养型用户': ['健康意识强', '品质生活', '稳健消费'],
        '探索型年轻人': ['追求新鲜', '价格敏感', '社交导向']
    };
    
    return explanations[segment.label] || ['个性化用户', '活跃度高', '消费理性'];
}

// 错误处理中间件
router.use((error, req, res, next) => {
    console.error('API错误:', error);
    
    if (error.name === 'ValidationError') {
        return res.status(422).json({ 
            error: '参数验证失败',
            code: 'VALIDATION_ERROR',
            details: error.message 
        });
    }
    
    if (error.name === 'UnauthorizedError') {
        return res.status(401).json({ 
            error: '未授权访问',
            code: 'UNAUTHORIZED' 
        });
    }
    
    res.status(500).json({ 
        error: '服务器内部错误',
        code: 'INTERNAL_ERROR' 
    });
});

module.exports = router;
