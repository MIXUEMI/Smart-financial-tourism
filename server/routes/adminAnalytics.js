// 智游金旅 - 管理端画像API路由
// 创建时间: 2025-01-26
// 版本: v1.0

const express = require('express');
const router = express.Router();
const dbManager = require('../database/jsonDbManager');
const trackingService = require('../services/trackingService');

// 中间件：检查管理员权限
const checkAdminAuth = (req, res, next) => {
    // 从JWT token或session中获取用户信息
    const user = req.user || req.session?.user;
    
    if (!user) {
        return res.status(401).json({ 
            error: '未登录',
            code: 'UNAUTHORIZED' 
        });
    }
    
    if (user.user_type !== 'admin') {
        return res.status(403).json({ 
            error: '权限不足，需要管理员权限',
            code: 'FORBIDDEN' 
        });
    }
    
    req.adminId = user.id;
    next();
};

// GET /api/analytics/admin/segments
// 获取管理端类型占比数据
router.get('/segments', checkAdminAuth, async (req, res) => {
    try {
        const { as_of, city } = req.query;
        const targetDate = as_of || new Date().toISOString().split('T')[0];
        
        // 记录埋点
        await trackingService.trackPageView('admin_segments', req.adminId);
        
        let sql, params;
        
        if (city && city !== 'all') {
            // 按城市筛选
            sql = `
                SELECT 
                    us.label,
                    ROUND(COUNT(*) * 1.0 / (
                        SELECT COUNT(*) 
                        FROM user_segment us2 
                        JOIN user_features uf2 ON us2.user_id = uf2.user_id 
                        WHERE uf2.city = ?
                    ), 4) as share,
                    COUNT(*) as n
                FROM user_segment us
                JOIN user_features uf ON us.user_id = uf.user_id
                WHERE uf.city = ?
                AND us.label IS NOT NULL
                GROUP BY us.label
                HAVING COUNT(*) >= 30
                ORDER BY n DESC
            `;
            params = [city, city];
        } else {
            // 全站数据
            sql = `
                SELECT 
                    label,
                    share,
                    total_users as n
                FROM segment_overview_daily 
                WHERE as_of = ?
                ORDER BY total_users DESC
            `;
            params = [targetDate];
        }
        
        const segments = await dbManager.query(sql, params);
        
        // 检查样本数量
        if (segments.length === 0) {
            return res.json({
                as_of: targetDate,
                city: city || 'all',
                segments: [],
                note: '样本不足'
            });
        }
        
        res.json({
            as_of: targetDate,
            city: city || 'all',
            segments: segments
        });
        
    } catch (error) {
        console.error('获取管理端类型占比失败:', error);
        res.status(500).json({ 
            error: '服务器内部错误',
            code: 'INTERNAL_ERROR' 
        });
    }
});

// GET /api/analytics/admin/funnel
// 获取转化漏斗数据
router.get('/funnel', checkAdminAuth, async (req, res) => {
    try {
        const { label, range = '30d', city = 'all' } = req.query;
        
        if (!label) {
            return res.status(422).json({ 
                error: '参数错误：label是必需的',
                code: 'MISSING_PARAMETER' 
            });
        }
        
        // 记录埋点
        await trackingService.trackPageView('admin_funnel', req.adminId);
        
        // 计算日期范围
        const days = parseInt(range.replace('d', ''));
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        // 获取该类型用户列表
        let userSql = `
            SELECT us.user_id
            FROM user_segment us
        `;
        let userParams = [label];
        
        if (city !== 'all') {
            userSql += `
                JOIN user_features uf ON us.user_id = uf.user_id
                WHERE us.label = ? AND uf.city = ?
            `;
            userParams.push(city);
        } else {
            userSql += `WHERE us.label = ?`;
        }
        
        const users = await dbManager.query(userSql, userParams);
        
        if (users.length < 30) {
            return res.json({
                label: label,
                range: range,
                city: city,
                steps: [],
                note: '样本不足'
            });
        }
        
        const userIds = users.map(u => u.user_id);
        const placeholders = userIds.map(() => '?').join(',');
        
        // 计算转化漏斗
        const funnelSql = `
            SELECT 
                event,
                COUNT(DISTINCT user_id) as count
            FROM events 
            WHERE user_id IN (${placeholders})
            AND ts >= ?
            GROUP BY event
        `;
        
        const events = await dbManager.query(funnelSql, [...userIds, startDate.toISOString()]);
        
        // 构建漏斗步骤
        const steps = [
            { name: '曝光', count: 0, rate: 0 },
            { name: '点击', count: 0, rate: 0 },
            { name: '下单', count: 0, rate: 0 },
            { name: '权益', count: 0, rate: 0 },
            { name: '理财/分期', count: 0, rate: 0 }
        ];
        
        // 映射事件到漏斗步骤
        const eventMapping = {
            'page_view': '曝光',
            'book_click': '点击',
            'rights_activate': '权益',
            'finance_buy': '理财/分期'
        };
        
        events.forEach(event => {
            const stepName = eventMapping[event.event];
            if (stepName) {
                const step = steps.find(s => s.name === stepName);
                if (step) {
                    step.count = event.count;
                }
            }
        });
        
        // 计算转化率
        for (let i = 1; i < steps.length; i++) {
            if (steps[i-1].count > 0) {
                steps[i].rate = Math.round((steps[i].count / steps[i-1].count) * 100) / 100;
            }
        }
        
        res.json({
            label: label,
            range: range,
            city: city,
            steps: steps
        });
        
    } catch (error) {
        console.error('获取转化漏斗失败:', error);
        res.status(500).json({ 
            error: '服务器内部错误',
            code: 'INTERNAL_ERROR' 
        });
    }
});

// GET /api/analytics/admin/retention
// 获取留存和复购数据
router.get('/retention', checkAdminAuth, async (req, res) => {
    try {
        const { label, city = 'all' } = req.query;
        
        // 记录埋点
        await trackingService.trackPageView('admin_retention', req.adminId);
        
        // 获取该类型用户列表
        let userSql = `
            SELECT us.user_id
            FROM user_segment us
        `;
        let userParams = [label];
        
        if (city !== 'all') {
            userSql += `
                JOIN user_features uf ON us.user_id = uf.user_id
                WHERE us.label = ? AND uf.city = ?
            `;
            userParams.push(city);
        } else {
            userSql += `WHERE us.label = ?`;
        }
        
        const users = await dbManager.query(userSql, userParams);
        
        if (users.length < 30) {
            return res.json({
                label: label,
                city: city,
                retention: [],
                repurchase: [],
                note: '样本不足'
            });
        }
        
        const userIds = users.map(u => u.user_id);
        const placeholders = userIds.map(() => '?').join(',');
        
        // 计算留存率
        const retentionSql = `
            SELECT 
                CASE 
                    WHEN julianday('now') - julianday(ts) <= 7 THEN '7天'
                    WHEN julianday('now') - julianday(ts) <= 30 THEN '30天'
                    WHEN julianday('now') - julianday(ts) <= 90 THEN '90天'
                END as period,
                COUNT(DISTINCT user_id) as active_users
            FROM events 
            WHERE user_id IN (${placeholders})
            AND ts >= datetime('now', '-90 days')
            GROUP BY period
        `;
        
        const retention = await dbManager.query(retentionSql, userIds);
        
        // 计算复购率
        const repurchaseSql = `
            SELECT 
                user_id,
                COUNT(*) as order_count
            FROM events 
            WHERE user_id IN (${placeholders})
            AND event = 'book_click'
            AND ts >= datetime('now', '-90 days')
            GROUP BY user_id
        `;
        
        const repurchase = await dbManager.query(repurchaseSql, userIds);
        
        const repurchaseStats = {
            total_users: repurchase.length,
            single_order: repurchase.filter(r => r.order_count === 1).length,
            multiple_orders: repurchase.filter(r => r.order_count > 1).length,
            avg_orders: repurchase.length > 0 ? 
                Math.round((repurchase.reduce((sum, r) => sum + r.order_count, 0) / repurchase.length) * 100) / 100 : 0
        };
        
        res.json({
            label: label,
            city: city,
            retention: retention,
            repurchase: repurchaseStats
        });
        
    } catch (error) {
        console.error('获取留存复购数据失败:', error);
        res.status(500).json({ 
            error: '服务器内部错误',
            code: 'INTERNAL_ERROR' 
        });
    }
});

// GET /api/analytics/admin/drilldown
// 获取匿名下钻数据
router.get('/drilldown', checkAdminAuth, async (req, res) => {
    try {
        const { label, city = 'all', limit = 50 } = req.query;
        
        if (!label) {
            return res.status(422).json({ 
                error: '参数错误：label是必需的',
                code: 'MISSING_PARAMETER' 
            });
        }
        
        // 记录埋点
        await trackingService.trackPageView('admin_drilldown', req.adminId);
        
        // 获取该类型用户列表
        let userSql = `
            SELECT 
                us.user_id,
                us.spend_pct,
                us.activity_pct,
                us.risk_pct,
                uf.spend_30d,
                uf.activity_30d,
                uf.risk_score
            FROM user_segment us
            LEFT JOIN user_features uf ON us.user_id = uf.user_id
        `;
        let userParams = [label];
        
        if (city !== 'all') {
            userSql += `
                WHERE us.label = ? AND uf.city = ?
            `;
            userParams.push(city);
        } else {
            userSql += `WHERE us.label = ?`;
        }
        
        userSql += ` ORDER BY us.spend_pct DESC LIMIT ?`;
        userParams.push(parseInt(limit));
        
        const users = await dbManager.query(userSql, userParams);
        
        if (users.length < 30) {
            return res.json({
                label: label,
                city: city,
                users: [],
                note: '样本不足'
            });
        }
        
        // 脱敏处理：只返回聚合统计，不返回个体数据
        const aggregatedData = {
            total_users: users.length,
            avg_spend_pct: Math.round(users.reduce((sum, u) => sum + u.spend_pct, 0) / users.length),
            avg_activity_pct: Math.round(users.reduce((sum, u) => sum + u.activity_pct, 0) / users.length),
            avg_risk_pct: Math.round(users.reduce((sum, u) => sum + u.risk_pct, 0) / users.length),
            spend_distribution: {
                high: users.filter(u => u.spend_pct >= 80).length,
                medium: users.filter(u => u.spend_pct >= 40 && u.spend_pct < 80).length,
                low: users.filter(u => u.spend_pct < 40).length
            },
            activity_distribution: {
                high: users.filter(u => u.activity_pct >= 80).length,
                medium: users.filter(u => u.activity_pct >= 40 && u.activity_pct < 80).length,
                low: users.filter(u => u.activity_pct < 40).length
            }
        };
        
        res.json({
            label: label,
            city: city,
            aggregated_data: aggregatedData,
            privacy_note: '已脱敏处理，仅显示聚合统计信息'
        });
        
    } catch (error) {
        console.error('获取下钻数据失败:', error);
        res.status(500).json({ 
            error: '服务器内部错误',
            code: 'INTERNAL_ERROR' 
        });
    }
});

// GET /api/analytics/admin/stats
// 获取管理端统计概览
router.get('/stats', checkAdminAuth, async (req, res) => {
    try {
        // 记录埋点
        await trackingService.trackPageView('admin_stats', req.adminId);
        
        // 获取基础统计
        const stats = await dbManager.getStats();
        
        // 获取今日新增用户
        const todayUsers = await dbManager.queryOne(`
            SELECT COUNT(*) as count 
            FROM users 
            WHERE DATE(created_at) = DATE('now')
        `);
        
        // 获取今日事件数
        const todayEvents = await dbManager.queryOne(`
            SELECT COUNT(*) as count 
            FROM events 
            WHERE DATE(ts) = DATE('now')
        `);
        
        // 获取活跃用户数（近7天）
        const activeUsers = await dbManager.queryOne(`
            SELECT COUNT(DISTINCT user_id) as count 
            FROM events 
            WHERE ts >= datetime('now', '-7 days')
        `);
        
        res.json({
            database_stats: stats,
            today_users: todayUsers.count,
            today_events: todayEvents.count,
            active_users_7d: activeUsers.count,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('获取管理端统计失败:', error);
        res.status(500).json({ 
            error: '服务器内部错误',
            code: 'INTERNAL_ERROR' 
        });
    }
});

// 错误处理中间件
router.use((error, req, res, next) => {
    console.error('管理端API错误:', error);
    
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
