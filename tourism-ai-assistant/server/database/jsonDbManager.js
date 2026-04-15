// 智游金旅 - JSON数据库管理器
// 创建时间: 2025-01-26
// 版本: v1.0

const fs = require('fs');
const path = require('path');

class JsonDatabaseManager {
    constructor() {
        this.dataDir = path.join(__dirname, 'data');
        this.dbPath = path.join(this.dataDir, 'tourism_ai.json');
        this.data = {
            users: [],
            events: [],
            user_features: [],
            user_segment: [],
            segment_overview_daily: [],
            wordcloud_30d: []
        };
    }

    // 初始化数据库
    async init() {
        try {
            // 确保数据目录存在
            if (!fs.existsSync(this.dataDir)) {
                fs.mkdirSync(this.dataDir, { recursive: true });
            }

            // 如果数据库文件不存在，创建它
            if (!fs.existsSync(this.dbPath)) {
                await this.saveData();
                console.log('✅ JSON数据库文件创建成功:', this.dbPath);
            } else {
                await this.loadData();
                console.log('✅ JSON数据库加载成功:', this.dbPath);
            }

            // 初始化表结构（创建索引）
            this.createIndexes();
            console.log('✅ 数据库索引创建成功');
            
        } catch (error) {
            console.error('数据库初始化失败:', error);
            throw error;
        }
    }

    // 加载数据
    async loadData() {
        try {
            const jsonData = fs.readFileSync(this.dbPath, 'utf8');
            this.data = JSON.parse(jsonData);
        } catch (error) {
            console.error('加载数据失败:', error);
            throw error;
        }
    }

    // 保存数据
    async saveData() {
        try {
            fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2));
        } catch (error) {
            console.error('保存数据失败:', error);
            throw error;
        }
    }

    // 创建索引
    createIndexes() {
        // 为每个表创建索引映射
        this.indexes = {
            users: new Map(),
            events: new Map(),
            user_features: new Map(),
            user_segment: new Map(),
            segment_overview_daily: new Map(),
            wordcloud_30d: new Map()
        };

        // 为用户表创建索引
        this.data.users.forEach((user, index) => {
            this.indexes.users.set(user.id, index);
            if (user.username) this.indexes.users.set(`username:${user.username}`, index);
        });

        // 为事件表创建索引
        this.data.events.forEach((event, index) => {
            this.indexes.events.set(event.id, index);
            if (event.user_id) {
                if (!this.indexes.events.has(`user:${event.user_id}`)) {
                    this.indexes.events.set(`user:${event.user_id}`, []);
                }
                this.indexes.events.get(`user:${event.user_id}`).push(index);
            }
        });

        // 为特征表创建索引
        this.data.user_features.forEach((feature, index) => {
            this.indexes.user_features.set(feature.id, index);
            if (feature.user_id) {
                if (!this.indexes.user_features.has(`user:${feature.user_id}`)) {
                    this.indexes.user_features.set(`user:${feature.user_id}`, []);
                }
                this.indexes.user_features.get(`user:${feature.user_id}`).push(index);
            }
        });

        // 为画像表创建索引
        this.data.user_segment.forEach((segment, index) => {
            this.indexes.user_segment.set(segment.id, index);
            if (segment.user_id) {
                this.indexes.user_segment.set(`user:${segment.user_id}`, index);
            }
        });
    }

    // 生成ID
    generateId(tableName) {
        const table = this.data[tableName];
        if (table.length === 0) return 1;
        return Math.max(...table.map(item => item.id || 0)) + 1;
    }

    // 查询所有记录
    async query(sql, params = []) {
        // 简单的SQL解析（仅支持基本查询）
        const tableMatch = sql.match(/FROM\s+(\w+)/i);
        if (!tableMatch) return [];

        const tableName = tableMatch[1];
        const table = this.data[tableName] || [];

        // 处理WHERE条件
        const whereMatch = sql.match(/WHERE\s+(.+)/i);
        if (whereMatch) {
            const whereClause = whereMatch[1];
            return table.filter(row => {
                // 简单的条件匹配
                if (whereClause.includes('user_id = ?')) {
                    const userId = params[0];
                    return row.user_id === userId;
                }
                if (whereClause.includes('username = ?')) {
                    const username = params[0];
                    return row.username === username;
                }
                if (whereClause.includes('event_type = ?')) {
                    const eventType = params[0];
                    return row.event_type === eventType;
                }
                return true;
            });
        }

        return table;
    }

    // 查询单条记录
    async queryOne(sql, params = []) {
        const results = await this.query(sql, params);
        return results.length > 0 ? results[0] : null;
    }

    // 插入记录
    async run(sql, params = []) {
        const insertMatch = sql.match(/INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
        if (insertMatch) {
            const tableName = insertMatch[1];
            const columns = insertMatch[2].split(',').map(col => col.trim());
            const values = insertMatch[3].split(',').map(val => val.trim());

            const newRecord = { id: this.generateId(tableName) };
            columns.forEach((col, index) => {
                let value = params[index];
                if (value === '?') value = params[index];
                if (value === 'NULL') value = null;
                if (value === 'CURRENT_TIMESTAMP') value = new Date().toISOString();
                newRecord[col] = value;
            });

            this.data[tableName].push(newRecord);
            await this.saveData();
            this.createIndexes(); // 重新创建索引

            return { id: newRecord.id, changes: 1 };
        }

        // 处理UPDATE
        const updateMatch = sql.match(/UPDATE\s+(\w+)\s+SET\s+(.+)\s+WHERE\s+(.+)/i);
        if (updateMatch) {
            const tableName = updateMatch[1];
            const setClause = updateMatch[2];
            const whereClause = updateMatch[3];

            let changes = 0;
            this.data[tableName].forEach(row => {
                if (whereClause.includes('id = ?') && row.id === params[params.length - 1]) {
                    // 更新字段
                    const setPairs = setClause.split(',');
                    setPairs.forEach(pair => {
                        const [col, val] = pair.split('=').map(s => s.trim());
                        if (val === '?') {
                            row[col] = params[0];
                        } else if (val === 'CURRENT_TIMESTAMP') {
                            row[col] = new Date().toISOString();
                        }
                    });
                    changes++;
                }
            });

            await this.saveData();
            return { changes };
        }

        // 处理DELETE
        const deleteMatch = sql.match(/DELETE\s+FROM\s+(\w+)\s+WHERE\s+(.+)/i);
        if (deleteMatch) {
            const tableName = deleteMatch[1];
            const whereClause = deleteMatch[2];

            let changes = 0;
            this.data[tableName] = this.data[tableName].filter(row => {
                if (whereClause.includes('id = ?') && row.id === params[0]) {
                    changes++;
                    return false;
                }
                return true;
            });

            await this.saveData();
            this.createIndexes(); // 重新创建索引
            return { changes };
        }

        return { changes: 0 };
    }

    // 开始事务
    async beginTransaction() {
        // JSON数据库不需要事务支持，直接返回
        return Promise.resolve();
    }

    // 提交事务
    async commit() {
        // JSON数据库不需要事务支持，直接返回
        return Promise.resolve();
    }

    // 回滚事务
    async rollback() {
        // JSON数据库不需要事务支持，直接返回
        return Promise.resolve();
    }

    // 关闭数据库连接
    close() {
        // JSON数据库不需要关闭连接
        console.log('✅ JSON数据库连接已关闭');
    }

    // 获取数据库统计信息
    async getStats() {
        try {
            const stats = {
                users: this.data.users.length,
                events: this.data.events.length,
                segments: this.data.user_segment.length,
                features: this.data.user_features.length
            };
            return stats;
        } catch (error) {
            console.error('获取统计信息失败:', error);
            return null;
        }
    }

    // 清理测试数据
    async cleanupTestData() {
        try {
            // 删除测试用户的事件
            this.data.events = this.data.events.filter(event => {
                const user = this.data.users.find(u => u.id === event.user_id);
                return !user || user.username !== 'testuser';
            });

            // 删除测试用户的特征和画像
            this.data.user_features = this.data.user_features.filter(feature => {
                const user = this.data.users.find(u => u.id === feature.user_id);
                return !user || user.username !== 'testuser';
            });

            this.data.user_segment = this.data.user_segment.filter(segment => {
                const user = this.data.users.find(u => u.id === segment.user_id);
                return !user || user.username !== 'testuser';
            });

            // 删除测试用户
            this.data.users = this.data.users.filter(user => user.username !== 'testuser');

            await this.saveData();
            this.createIndexes();
            console.log('✅ 测试数据清理完成');
        } catch (error) {
            console.error('清理测试数据失败:', error);
        }
    }

    // 添加测试数据
    async addTestData() {
        try {
            // 添加测试用户
            const testUser = {
                id: this.generateId('users'),
                username: 'testuser',
                email: 'test@example.com',
                created_at: new Date().toISOString(),
                last_login: new Date().toISOString()
            };
            this.data.users.push(testUser);

            // 添加测试事件
            const testEvents = [
                {
                    id: this.generateId('events'),
                    user_id: testUser.id,
                    event_type: 'page_view',
                    event_data: JSON.stringify({ page: 'ai_page' }),
                    timestamp: new Date().toISOString()
                },
                {
                    id: this.generateId('events'),
                    user_id: testUser.id,
                    event_type: 'search_city',
                    event_data: JSON.stringify({ city: '北京' }),
                    timestamp: new Date().toISOString()
                }
            ];
            this.data.events.push(...testEvents);

            // 添加测试特征
            const testFeatures = {
                id: this.generateId('user_features'),
                user_id: testUser.id,
                spend_30d: 2500,
                trips_365d: 2,
                activity_30d: 5,
                risk_score: 35,
                age_bucket: '25-34',
                destination_diversity: 2,
                installment_count: 1,
                education_orders: 0,
                health_orders: 0,
                updated_at: new Date().toISOString()
            };
            this.data.user_features.push(testFeatures);

            // 添加测试画像
            const testSegment = {
                id: this.generateId('user_segment'),
                user_id: testUser.id,
                segment_label: '轻旅行打工人',
                confidence: 0.85,
                created_at: new Date().toISOString()
            };
            this.data.user_segment.push(testSegment);

            await this.saveData();
            this.createIndexes();
            console.log('✅ 测试数据添加完成');
        } catch (error) {
            console.error('添加测试数据失败:', error);
        }
    }
}

// 创建全局数据库实例
const dbManager = new JsonDatabaseManager();

// 导出数据库管理器
module.exports = dbManager;

// 如果直接运行此文件，则初始化数据库
if (require.main === module) {
    dbManager.init()
        .then(() => {
            console.log('🎉 JSON数据库初始化完成');
            return dbManager.addTestData();
        })
        .then(() => {
            return dbManager.getStats();
        })
        .then((stats) => {
            if (stats) {
                console.log('📊 数据库统计信息:');
                console.log(`   用户数量: ${stats.users}`);
                console.log(`   事件数量: ${stats.events}`);
                console.log(`   画像数量: ${stats.segments}`);
                console.log(`   特征数量: ${stats.features}`);
            }
        })
        .catch((error) => {
            console.error('❌ 数据库初始化失败:', error);
            process.exit(1);
        });
}








