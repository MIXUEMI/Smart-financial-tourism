// 智游金旅 - 批处理任务调度器
// 创建时间: 2025-01-26
// 版本: v1.0

const cron = require('node-cron');
const dbManager = require('../database/jsonDbManager');
const featureEngine = require('./featureEngine');
const trackingService = require('./trackingService');

class BatchJobScheduler {
    constructor() {
        this.isRunning = false;
        this.jobs = new Map();
        this.cronSchedule = process.env.SEG_JOB_CRON || '0 3 * * *'; // 默认每日3:00
        this.isEnabled = process.env.FEATURE_SEGMENT === 'on' || true;
    }

    // 初始化批处理调度器
    async init() {
        if (!this.isEnabled) {
            console.log('📊 批处理任务已禁用');
            return;
        }

        console.log('📊 批处理任务调度器初始化...');
        
        // 注册定时任务
        this.registerJobs();
        
        console.log('✅ 批处理任务调度器初始化完成');
        console.log(`⏰ 画像生成任务计划: ${this.cronSchedule}`);
    }

    // 注册所有批处理任务
    registerJobs() {
        // 主要画像生成任务（每日3:00）
        this.jobs.set('segmentation', cron.schedule(this.cronSchedule, async () => {
            await this.runSegmentationJob();
        }, {
            scheduled: false,
            timezone: 'Asia/Shanghai'
        }));

        // 数据清理任务（每周日凌晨2:00）
        this.jobs.set('cleanup', cron.schedule('0 2 * * 0', async () => {
            await this.runCleanupJob();
        }, {
            scheduled: false,
            timezone: 'Asia/Shanghai'
        }));

        // 聚合数据更新任务（每小时）
        this.jobs.set('aggregation', cron.schedule('0 * * * *', async () => {
            await this.runAggregationJob();
        }, {
            scheduled: false,
            timezone: 'Asia/Shanghai'
        }));

        // 启动所有任务
        this.jobs.forEach((job, name) => {
            job.start();
            console.log(`✅ 批处理任务 "${name}" 已启动`);
        });
    }

    // 运行画像生成任务
    async runSegmentationJob() {
        if (this.isRunning) {
            console.log('⚠️ 画像生成任务正在运行中，跳过本次执行');
            return;
        }

        this.isRunning = true;
        const startTime = Date.now();
        
        try {
            console.log('🚀 开始执行画像生成任务...');
            
            // 1. 批量计算用户特征和画像
            const featureResult = await featureEngine.batchProcessAllUsers();
            
            // 2. 生成聚合数据
            await this.generateAggregationData();
            
            // 3. 生成词云数据
            await this.generateWordcloudData();
            
            // 4. 更新统计信息
            await this.updateStatistics();
            
            const duration = Date.now() - startTime;
            console.log(`✅ 画像生成任务完成，耗时: ${duration}ms`);
            console.log(`📊 处理结果: 成功 ${featureResult.processedCount} 个用户，失败 ${featureResult.errorCount} 个`);
            
        } catch (error) {
            console.error('❌ 画像生成任务失败:', error);
        } finally {
            this.isRunning = false;
        }
    }

    // 运行数据清理任务
    async runCleanupJob() {
        try {
            console.log('🧹 开始执行数据清理任务...');
            
            // 清理过期事件数据
            const cleanedEvents = await trackingService.cleanupExpiredEvents(180);
            
            // 清理过期的聚合数据（保留1年）
            const sql = `
                DELETE FROM segment_overview_daily 
                WHERE as_of < date('now', '-365 days')
            `;
            const result = await dbManager.run(sql);
            
            console.log(`✅ 数据清理完成: 清理了 ${cleanedEvents} 条事件，${result.changes} 条聚合数据`);
            
        } catch (error) {
            console.error('❌ 数据清理任务失败:', error);
        }
    }

    // 运行聚合数据更新任务
    async runAggregationJob() {
        try {
            console.log('📊 开始执行聚合数据更新任务...');
            
            await this.generateAggregationData();
            await this.generateWordcloudData();
            
            console.log('✅ 聚合数据更新完成');
            
        } catch (error) {
            console.error('❌ 聚合数据更新任务失败:', error);
        }
    }

    // 生成聚合数据
    async generateAggregationData() {
        try {
            const today = new Date().toISOString().split('T')[0];
            
            // 删除今日的聚合数据
            await dbManager.run('DELETE FROM segment_overview_daily WHERE as_of = ?', [today]);
            
            // 计算各类型用户占比
            const sql = `
                SELECT 
                    label,
                    COUNT(*) as user_count,
                    ROUND(COUNT(*) * 1.0 / (SELECT COUNT(*) FROM user_segment), 4) as share
                FROM user_segment 
                WHERE label IS NOT NULL
                GROUP BY label
                HAVING COUNT(*) >= 30  -- k-匿名阈值
            `;
            
            const segments = await dbManager.query(sql);
            
            // 插入聚合数据
            for (const segment of segments) {
                await dbManager.run(`
                    INSERT INTO segment_overview_daily (as_of, label, share, total_users)
                    VALUES (?, ?, ?, ?)
                `, [today, segment.label, segment.share, segment.user_count]);
            }
            
            console.log(`📊 生成了 ${segments.length} 个类型的聚合数据`);
            
        } catch (error) {
            console.error('生成聚合数据失败:', error);
        }
    }

    // 生成词云数据
    async generateWordcloudData() {
        try {
            const today = new Date().toISOString().split('T')[0];
            
            // 删除今日的词云数据
            await dbManager.run('DELETE FROM wordcloud_30d WHERE as_of = ?', [today]);
            
            // 统计近30天的热门城市
            const citySql = `
                SELECT city, COUNT(*) as weight
                FROM events 
                WHERE city IS NOT NULL 
                AND ts >= datetime('now', '-30 days')
                GROUP BY city
                HAVING COUNT(*) >= 30  -- k-匿名阈值
                ORDER BY weight DESC
                LIMIT 20
            `;
            
            const cities = await dbManager.query(citySql);
            
            // 统计近30天的热门搜索词（模拟）
            const searchWords = [
                { text: '亲子', weight: 45 },
                { text: '北京', weight: 42 },
                { text: '上海', weight: 38 },
                { text: '理财', weight: 35 },
                { text: '酒店', weight: 32 },
                { text: '分期', weight: 28 },
                { text: '杭州', weight: 25 },
                { text: '三亚', weight: 22 },
                { text: '成都', weight: 20 },
                { text: '西安', weight: 18 }
            ];
            
            // 插入城市数据
            for (const city of cities) {
                await dbManager.run(`
                    INSERT INTO wordcloud_30d (text, weight, as_of)
                    VALUES (?, ?, ?)
                `, [city.city, city.weight, today]);
            }
            
            // 插入搜索词数据
            for (const word of searchWords) {
                await dbManager.run(`
                    INSERT INTO wordcloud_30d (text, weight, as_of)
                    VALUES (?, ?, ?)
                `, [word.text, word.weight, today]);
            }
            
            console.log(`📊 生成了 ${cities.length} 个城市和 ${searchWords.length} 个搜索词的词云数据`);
            
        } catch (error) {
            console.error('生成词云数据失败:', error);
        }
    }

    // 更新统计信息
    async updateStatistics() {
        try {
            const stats = await dbManager.getStats();
            console.log('📊 数据库统计信息:', stats);
            
            // 可以在这里添加更多的统计信息更新逻辑
            // 比如更新缓存、发送监控数据等
            
        } catch (error) {
            console.error('更新统计信息失败:', error);
        }
    }

    // 手动触发画像生成任务
    async triggerSegmentationJob() {
        console.log('🔧 手动触发画像生成任务...');
        await this.runSegmentationJob();
    }

    // 手动触发数据清理任务
    async triggerCleanupJob() {
        console.log('🔧 手动触发数据清理任务...');
        await this.runCleanupJob();
    }

    // 手动触发聚合数据更新任务
    async triggerAggregationJob() {
        console.log('🔧 手动触发聚合数据更新任务...');
        await this.runAggregationJob();
    }

    // 获取任务状态
    getJobStatus() {
        const status = {
            isEnabled: this.isEnabled,
            isRunning: this.isRunning,
            cronSchedule: this.cronSchedule,
            jobs: {}
        };
        
        this.jobs.forEach((job, name) => {
            status.jobs[name] = {
                running: job.running,
                scheduled: job.scheduled
            };
        });
        
        return status;
    }

    // 停止所有任务
    stopAllJobs() {
        this.jobs.forEach((job, name) => {
            job.stop();
            console.log(`⏹️ 批处理任务 "${name}" 已停止`);
        });
    }

    // 启动所有任务
    startAllJobs() {
        this.jobs.forEach((job, name) => {
            job.start();
            console.log(`▶️ 批处理任务 "${name}" 已启动`);
        });
    }

    // 销毁调度器
    destroy() {
        this.stopAllJobs();
        this.jobs.clear();
        console.log('🗑️ 批处理任务调度器已销毁');
    }
}

// 创建全局批处理调度器实例
const batchScheduler = new BatchJobScheduler();

// 导出批处理调度器
module.exports = batchScheduler;

// 如果直接运行此文件，则初始化调度器
if (require.main === module) {
    batchScheduler.init()
        .then(() => {
            console.log('🎉 批处理任务调度器启动完成');
            
            // 保持进程运行
            process.on('SIGINT', () => {
                console.log('\n🛑 收到退出信号，正在关闭批处理调度器...');
                batchScheduler.destroy();
                process.exit(0);
            });
            
            // 保持进程运行
            setInterval(() => {
                // 每5分钟输出一次状态
                const status = batchScheduler.getJobStatus();
                console.log('📊 批处理任务状态:', status);
            }, 5 * 60 * 1000);
            
        })
        .catch((error) => {
            console.error('❌ 批处理任务调度器启动失败:', error);
            process.exit(1);
        });
}
