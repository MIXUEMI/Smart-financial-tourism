// 智游金旅 - 特征计算引擎
// 创建时间: 2025-01-26
// 版本: v1.0

const dbManager = require('../database/jsonDbManager');

class FeatureEngine {
    constructor() {
        this.featureVersion = 'v1.0';
        this.segmentRules = {
            '理财型游客': {
                condition: (features) => features.risk_score <= 40 && features.spend_30d >= 3000,
                description: '风险偏好低，消费能力强，注重稳健理财'
            },
            '轻旅行打工人': {
                condition: (features) => features.trips_365d >= 3 && features.activity_30d >= 8 && features.installment_count >= 2,
                description: '旅行频次高，活跃度高，偏好分期消费'
            },
            '家庭度假型': {
                condition: (features) => features.education_orders >= 2,
                description: '有多次教育类订单，注重家庭度假体验'
            },
            '康养型用户': {
                condition: (features) => {
                    const ageBuckets = ['55-64', '65+'];
                    return ageBuckets.includes(features.age_bucket) || features.health_orders >= 1;
                },
                description: '年龄偏大或购买康养产品，注重健康养生'
            },
            '探索型年轻人': {
                condition: (features) => {
                    const youngAgeBuckets = ['18-24', '25-34'];
                    return youngAgeBuckets.includes(features.age_bucket) && features.destination_diversity >= 3;
                },
                description: '年轻群体，目的地多样性高，喜欢探索新地方'
            }
        };
    }

    // 计算用户特征
    async calculateUserFeatures(userId) {
        try {
            console.log(`🔍 开始计算用户 ${userId} 的特征...`);
            
            // 获取用户基础信息
            const user = await dbManager.queryOne('SELECT * FROM users WHERE id = ?', [userId]);
            if (!user) {
                throw new Error(`用户 ${userId} 不存在`);
            }

            // 计算各项特征
            const features = {
                user_id: userId,
                spend_30d: await this.calculateSpend30d(userId),
                trips_365d: await this.calculateTrips365d(userId),
                risk_score: await this.calculateRiskScore(userId),
                activity_30d: await this.calculateActivity30d(userId),
                city: await this.getPrimaryCity(userId),
                age_bucket: await this.getAgeBucket(userId),
                installment_count: await this.calculateInstallmentCount(userId),
                education_orders: await this.calculateEducationOrders(userId),
                health_orders: await this.calculateHealthOrders(userId),
                destination_diversity: await this.calculateDestinationDiversity(userId),
                updated_at: new Date().toISOString()
            };

            // 保存特征到数据库
            await this.saveUserFeatures(features);
            
            console.log(`✅ 用户 ${userId} 特征计算完成:`, features);
            return features;
            
        } catch (error) {
            console.error(`❌ 计算用户 ${userId} 特征失败:`, error);
            throw error;
        }
    }

    // 计算30天消费金额
    async calculateSpend30d(userId) {
        const sql = `
            SELECT COALESCE(SUM(amount), 0) as total_spend
            FROM events 
            WHERE user_id = ? 
            AND event IN ('book_click', 'finance_buy')
            AND ts >= datetime('now', '-30 days')
        `;
        
        const result = await dbManager.queryOne(sql, [userId]);
        return parseFloat(result.total_spend) || 0;
    }

    // 计算365天旅行次数
    async calculateTrips365d(userId) {
        const sql = `
            SELECT COUNT(DISTINCT city) as trip_count
            FROM events 
            WHERE user_id = ? 
            AND event IN ('book_click', 'search_city')
            AND city IS NOT NULL
            AND ts >= datetime('now', '-365 days')
        `;
        
        const result = await dbManager.queryOne(sql, [userId]);
        return result.trip_count || 0;
    }

    // 计算风险评分（0-100）
    async calculateRiskScore(userId) {
        const sql = `
            SELECT 
                COUNT(CASE WHEN event = 'finance_buy' AND is_installment = 1 THEN 1 END) as installment_count,
                COUNT(CASE WHEN event = 'finance_buy' THEN 1 END) as finance_count,
                AVG(CASE WHEN event = 'finance_buy' THEN amount END) as avg_amount
            FROM events 
            WHERE user_id = ? 
            AND ts >= datetime('now', '-90 days')
        `;
        
        const result = await dbManager.queryOne(sql, [userId]);
        
        let riskScore = 50; // 基础分数
        
        // 分期次数越多，风险分数越高
        if (result.installment_count > 0) {
            riskScore += result.installment_count * 10;
        }
        
        // 金融产品购买金额越大，风险分数越低（更保守）
        if (result.avg_amount > 0) {
            riskScore -= Math.min(result.avg_amount / 1000, 30);
        }
        
        // 确保分数在0-100范围内
        return Math.max(0, Math.min(100, Math.round(riskScore)));
    }

    // 计算30天活跃度
    async calculateActivity30d(userId) {
        const sql = `
            SELECT COUNT(*) as activity_count
            FROM events 
            WHERE user_id = ? 
            AND ts >= datetime('now', '-30 days')
        `;
        
        const result = await dbManager.queryOne(sql, [userId]);
        return result.activity_count || 0;
    }

    // 获取主要城市
    async getPrimaryCity(userId) {
        const sql = `
            SELECT city, COUNT(*) as count
            FROM events 
            WHERE user_id = ? 
            AND city IS NOT NULL
            AND ts >= datetime('now', '-90 days')
            GROUP BY city
            ORDER BY count DESC
            LIMIT 1
        `;
        
        const result = await dbManager.queryOne(sql, [userId]);
        return result ? result.city : null;
    }

    // 获取年龄分组（模拟数据）
    async getAgeBucket(userId) {
        // 这里可以根据实际业务需求实现年龄获取逻辑
        // 目前使用模拟数据
        const ageBuckets = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
        const randomIndex = Math.floor(Math.random() * ageBuckets.length);
        return ageBuckets[randomIndex];
    }

    // 计算分期次数
    async calculateInstallmentCount(userId) {
        const sql = `
            SELECT COUNT(*) as installment_count
            FROM events 
            WHERE user_id = ? 
            AND event = 'finance_buy'
            AND is_installment = 1
            AND ts >= datetime('now', '-90 days')
        `;
        
        const result = await dbManager.queryOne(sql, [userId]);
        return result.installment_count || 0;
    }

    // 计算教育类订单数
    async calculateEducationOrders(userId) {
        const sql = `
            SELECT COUNT(*) as education_count
            FROM events 
            WHERE user_id = ? 
            AND event = 'book_click'
            AND item_id LIKE '%education%'
            AND ts >= datetime('now', '-365 days')
        `;
        
        const result = await dbManager.queryOne(sql, [userId]);
        return result.education_count || 0;
    }

    // 计算康养类订单数
    async calculateHealthOrders(userId) {
        const sql = `
            SELECT COUNT(*) as health_count
            FROM events 
            WHERE user_id = ? 
            AND event = 'book_click'
            AND item_id LIKE '%health%'
            AND ts >= datetime('now', '-365 days')
        `;
        
        const result = await dbManager.queryOne(sql, [userId]);
        return result.health_count || 0;
    }

    // 计算目的地多样性
    async calculateDestinationDiversity(userId) {
        const sql = `
            SELECT COUNT(DISTINCT city) as diversity_count
            FROM events 
            WHERE user_id = ? 
            AND city IS NOT NULL
            AND ts >= datetime('now', '-365 days')
        `;
        
        const result = await dbManager.queryOne(sql, [userId]);
        return result.diversity_count || 0;
    }

    // 保存用户特征
    async saveUserFeatures(features) {
        const sql = `
            INSERT OR REPLACE INTO user_features 
            (user_id, spend_30d, trips_365d, risk_score, activity_30d, city, age_bucket, 
             installment_count, education_orders, health_orders, destination_diversity, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const values = [
            features.user_id,
            features.spend_30d,
            features.trips_365d,
            features.risk_score,
            features.activity_30d,
            features.city,
            features.age_bucket,
            features.installment_count,
            features.education_orders,
            features.health_orders,
            features.destination_diversity,
            features.updated_at
        ];
        
        await dbManager.run(sql, values);
    }

    // 为用户分配画像标签
    async assignUserSegment(userId) {
        try {
            console.log(`🏷️ 开始为用户 ${userId} 分配画像标签...`);
            
            // 获取用户特征
            const features = await dbManager.queryOne('SELECT * FROM user_features WHERE user_id = ?', [userId]);
            if (!features) {
                throw new Error(`用户 ${userId} 的特征数据不存在`);
            }

            // 根据规则分配标签
            let assignedLabel = '未分类';
            for (const [label, rule] of Object.entries(this.segmentRules)) {
                if (rule.condition(features)) {
                    assignedLabel = label;
                    break;
                }
            }

            // 计算分位数
            const percentiles = await this.calculatePercentiles(userId, assignedLabel, features);

            // 保存画像结果
            const segmentData = {
                user_id: userId,
                label: assignedLabel,
                spend_pct: percentiles.spend_pct,
                activity_pct: percentiles.activity_pct,
                risk_pct: percentiles.risk_pct,
                version: this.featureVersion,
                updated_at: new Date().toISOString()
            };

            await this.saveUserSegment(segmentData);
            
            console.log(`✅ 用户 ${userId} 画像标签分配完成: ${assignedLabel}`);
            return segmentData;
            
        } catch (error) {
            console.error(`❌ 为用户 ${userId} 分配画像标签失败:`, error);
            throw error;
        }
    }

    // 计算分位数
    async calculatePercentiles(userId, label, features) {
        try {
            // 获取同类型用户的数据
            const sql = `
                SELECT spend_30d, activity_30d, risk_score
                FROM user_features uf
                JOIN user_segment us ON uf.user_id = us.user_id
                WHERE us.label = ?
                AND uf.user_id != ?
            `;
            
            const peers = await dbManager.query(sql, [label, userId]);
            
            if (peers.length === 0) {
                // 如果没有同类型用户，返回默认分位数
                return { spend_pct: 50, activity_pct: 50, risk_pct: 50 };
            }

            // 计算分位数
            const spendValues = peers.map(p => p.spend_30d).sort((a, b) => a - b);
            const activityValues = peers.map(p => p.activity_30d).sort((a, b) => a - b);
            const riskValues = peers.map(p => p.risk_score).sort((a, b) => a - b);

            const spendPct = this.calculatePercentile(features.spend_30d, spendValues);
            const activityPct = this.calculatePercentile(features.activity_30d, activityValues);
            const riskPct = this.calculatePercentile(features.risk_score, riskValues);

            return {
                spend_pct: Math.round(spendPct),
                activity_pct: Math.round(activityPct),
                risk_pct: Math.round(riskPct)
            };
            
        } catch (error) {
            console.error('计算分位数失败:', error);
            return { spend_pct: 50, activity_pct: 50, risk_pct: 50 };
        }
    }

    // 计算单个分位数
    calculatePercentile(value, sortedArray) {
        if (sortedArray.length === 0) return 50;
        
        let count = 0;
        for (const item of sortedArray) {
            if (item <= value) count++;
        }
        
        return (count / sortedArray.length) * 100;
    }

    // 保存用户画像
    async saveUserSegment(segmentData) {
        const sql = `
            INSERT OR REPLACE INTO user_segment 
            (user_id, label, spend_pct, activity_pct, risk_pct, version, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        const values = [
            segmentData.user_id,
            segmentData.label,
            segmentData.spend_pct,
            segmentData.activity_pct,
            segmentData.risk_pct,
            segmentData.version,
            segmentData.updated_at
        ];
        
        await dbManager.run(sql, values);
    }

    // 批量处理所有用户
    async batchProcessAllUsers() {
        try {
            console.log('🚀 开始批量处理所有用户特征和画像...');
            
            // 获取所有活跃用户
            const users = await dbManager.query(`
                SELECT DISTINCT user_id 
                FROM events 
                WHERE ts >= datetime('now', '-30 days')
            `);
            
            console.log(`📊 找到 ${users.length} 个活跃用户`);
            
            let processedCount = 0;
            let errorCount = 0;
            
            for (const user of users) {
                try {
                    // 计算特征
                    await this.calculateUserFeatures(user.user_id);
                    
                    // 分配画像
                    await this.assignUserSegment(user.user_id);
                    
                    processedCount++;
                    
                    if (processedCount % 10 === 0) {
                        console.log(`📈 已处理 ${processedCount}/${users.length} 个用户`);
                    }
                    
                } catch (error) {
                    console.error(`❌ 处理用户 ${user.user_id} 失败:`, error.message);
                    errorCount++;
                }
            }
            
            console.log(`✅ 批量处理完成: 成功 ${processedCount} 个，失败 ${errorCount} 个`);
            return { processedCount, errorCount };
            
        } catch (error) {
            console.error('❌ 批量处理失败:', error);
            throw error;
        }
    }

    // 获取画像规则说明
    getSegmentRules() {
        return this.segmentRules;
    }
}

// 创建全局特征引擎实例
const featureEngine = new FeatureEngine();

// 导出特征引擎
module.exports = featureEngine;

// 如果直接运行此文件，则执行批量处理
if (require.main === module) {
    featureEngine.batchProcessAllUsers()
        .then((result) => {
            console.log('🎉 特征计算和画像分配完成');
            console.log(`📊 处理结果: 成功 ${result.processedCount} 个，失败 ${result.errorCount} 个`);
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ 批量处理失败:', error);
            process.exit(1);
        });
}
