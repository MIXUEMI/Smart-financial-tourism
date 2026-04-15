// 智游金旅 - 埋点系统
// 创建时间: 2025-01-26
// 版本: v1.0

const dbManager = require('../database/jsonDbManager');

class TrackingService {
    constructor() {
        this.isEnabled = process.env.FEATURE_TRACKING === 'on' || true;
        this.batchSize = 100;
        this.batchTimeout = 5000; // 5秒批量提交
        this.eventQueue = [];
        this.batchTimer = null;
    }

    // 初始化埋点系统
    async init() {
        if (!this.isEnabled) {
            console.log('📊 埋点系统已禁用');
            return;
        }

        console.log('📊 埋点系统初始化完成');
        
        // 启动批量处理定时器
        this.startBatchTimer();
        
        // 页面卸载时提交剩余事件
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', () => {
                this.flushEvents();
            });
        }
    }

    // 记录页面浏览事件
    async trackPageView(pageId, userId = null) {
        if (!this.isEnabled) return;
        
        const event = {
            user_id: userId || this.getCurrentUserId(),
            event: 'page_view',
            page_id: pageId,
            ts: new Date().toISOString()
        };
        
        this.addToQueue(event);
    }

    // 记录城市搜索事件
    async trackCitySearch(city, userId = null) {
        if (!this.isEnabled) return;
        
        const event = {
            user_id: userId || this.getCurrentUserId(),
            event: 'search_city',
            city: city,
            ts: new Date().toISOString()
        };
        
        this.addToQueue(event);
    }

    // 记录预订点击事件
    async trackBookClick(itemId, price, city = null, userId = null) {
        if (!this.isEnabled) return;
        
        const event = {
            user_id: userId || this.getCurrentUserId(),
            event: 'book_click',
            item_id: itemId,
            amount: price,
            city: city,
            ts: new Date().toISOString()
        };
        
        this.addToQueue(event);
    }

    // 记录权益激活事件
    async trackRightsActivate(rightsId, userId = null) {
        if (!this.isEnabled) return;
        
        const event = {
            user_id: userId || this.getCurrentUserId(),
            event: 'rights_activate',
            rights_id: rightsId,
            ts: new Date().toISOString()
        };
        
        this.addToQueue(event);
    }

    // 记录金融产品购买事件
    async trackFinanceBuy(productId, amount, term = null, isInstallment = false, userId = null) {
        if (!this.isEnabled) return;
        
        const event = {
            user_id: userId || this.getCurrentUserId(),
            event: 'finance_buy',
            product_id: productId,
            amount: amount,
            term: term,
            is_installment: isInstallment,
            ts: new Date().toISOString()
        };
        
        this.addToQueue(event);
    }

    // 记录自定义事件
    async trackCustomEvent(eventName, data = {}, userId = null) {
        if (!this.isEnabled) return;
        
        const event = {
            user_id: userId || this.getCurrentUserId(),
            event: eventName,
            ...data,
            ts: new Date().toISOString()
        };
        
        this.addToQueue(event);
    }

    // 添加到事件队列
    addToQueue(event) {
        this.eventQueue.push(event);
        
        // 如果队列满了，立即提交
        if (this.eventQueue.length >= this.batchSize) {
            this.flushEvents();
        }
    }

    // 启动批量处理定时器
    startBatchTimer() {
        if (this.batchTimer) {
            clearTimeout(this.batchTimer);
        }
        
        this.batchTimer = setTimeout(() => {
            this.flushEvents();
        }, this.batchTimeout);
    }

    // 批量提交事件
    async flushEvents() {
        if (this.eventQueue.length === 0) return;
        
        const events = [...this.eventQueue];
        this.eventQueue = [];
        
        try {
            await this.batchInsertEvents(events);
            console.log(`📊 批量提交 ${events.length} 个埋点事件`);
        } catch (error) {
            console.error('批量提交埋点事件失败:', error);
            // 失败的事件重新加入队列
            this.eventQueue.unshift(...events);
        }
        
        // 重启定时器
        this.startBatchTimer();
    }

    // 批量插入事件到数据库
    async batchInsertEvents(events) {
        if (events.length === 0) return;
        
        const sql = `
            INSERT INTO events (user_id, event, amount, city, item_id, product_id, page_id, rights_id, term, is_installment, ts)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const values = events.map(event => [
            event.user_id,
            event.event,
            event.amount || null,
            event.city || null,
            event.item_id || null,
            event.product_id || null,
            event.page_id || null,
            event.rights_id || null,
            event.term || null,
            event.is_installment || false,
            event.ts
        ]);
        
        await dbManager.beginTransaction();
        
        try {
            for (const value of values) {
                await dbManager.run(sql, value);
            }
            await dbManager.commit();
        } catch (error) {
            await dbManager.rollback();
            throw error;
        }
    }

    // 获取当前用户ID
    getCurrentUserId() {
        // 从localStorage获取用户ID（前端）
        if (typeof window !== 'undefined') {
            const userData = localStorage.getItem('userData');
            if (userData) {
                try {
                    const parsed = JSON.parse(userData);
                    return parsed.id || null;
                } catch (e) {
                    return null;
                }
            }
        }
        
        // 从session获取用户ID（后端）
        if (typeof session !== 'undefined' && session.userId) {
            return session.userId;
        }
        
        return null;
    }

    // 获取用户事件统计
    async getUserEventStats(userId, days = 30) {
        try {
            const sql = `
                SELECT 
                    event,
                    COUNT(*) as count,
                    SUM(amount) as total_amount,
                    COUNT(DISTINCT city) as city_count
                FROM events 
                WHERE user_id = ? 
                AND ts >= datetime('now', '-${days} days')
                GROUP BY event
                ORDER BY count DESC
            `;
            
            return await dbManager.query(sql, [userId]);
        } catch (error) {
            console.error('获取用户事件统计失败:', error);
            return [];
        }
    }

    // 获取全站事件统计
    async getGlobalEventStats(days = 30) {
        try {
            const sql = `
                SELECT 
                    event,
                    COUNT(*) as count,
                    COUNT(DISTINCT user_id) as user_count,
                    SUM(amount) as total_amount,
                    AVG(amount) as avg_amount
                FROM events 
                WHERE ts >= datetime('now', '-${days} days')
                GROUP BY event
                ORDER BY count DESC
            `;
            
            return await dbManager.query(sql);
        } catch (error) {
            console.error('获取全站事件统计失败:', error);
            return [];
        }
    }

    // 获取城市热度统计
    async getCityHeatmap(days = 30) {
        try {
            const sql = `
                SELECT 
                    city,
                    COUNT(*) as event_count,
                    COUNT(DISTINCT user_id) as user_count,
                    SUM(amount) as total_amount
                FROM events 
                WHERE city IS NOT NULL 
                AND ts >= datetime('now', '-${days} days')
                GROUP BY city
                ORDER BY event_count DESC
                LIMIT 20
            `;
            
            return await dbManager.query(sql);
        } catch (error) {
            console.error('获取城市热度统计失败:', error);
            return [];
        }
    }

    // 清理过期事件数据
    async cleanupExpiredEvents(days = 180) {
        try {
            const sql = `
                DELETE FROM events 
                WHERE ts < datetime('now', '-${days} days')
            `;
            
            const result = await dbManager.run(sql);
            console.log(`📊 清理了 ${result.changes} 条过期事件数据`);
            return result.changes;
        } catch (error) {
            console.error('清理过期事件数据失败:', error);
            return 0;
        }
    }

    // 禁用埋点系统
    disable() {
        this.isEnabled = false;
        this.flushEvents(); // 提交剩余事件
        console.log('📊 埋点系统已禁用');
    }

    // 启用埋点系统
    enable() {
        this.isEnabled = true;
        console.log('📊 埋点系统已启用');
    }
}

// 创建全局埋点服务实例
const trackingService = new TrackingService();

// 导出埋点服务
module.exports = trackingService;

// 前端埋点工具函数
if (typeof window !== 'undefined') {
    window.tracking = {
        pageView: (pageId) => trackingService.trackPageView(pageId),
        citySearch: (city) => trackingService.trackCitySearch(city),
        bookClick: (itemId, price, city) => trackingService.trackBookClick(itemId, price, city),
        rightsActivate: (rightsId) => trackingService.trackRightsActivate(rightsId),
        financeBuy: (productId, amount, term, isInstallment) => 
            trackingService.trackFinanceBuy(productId, amount, term, isInstallment),
        custom: (eventName, data) => trackingService.trackCustomEvent(eventName, data)
    };
}
